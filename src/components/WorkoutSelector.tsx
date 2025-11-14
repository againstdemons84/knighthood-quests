import React, { useState, useEffect } from 'react';
import { WorkoutSelection, BasketState } from '../types/scenario';
import { calculateCombinedMetrics, formatDuration } from '../utils/scenarioHelpers';
import { generateOptimalSelections, convertToWorkoutSelections, SortedWorkout } from '../utils/optimalSelections';
import knighthoodWorkouts from '../data/knighthood-workouts.json';
import allWorkouts from '../data/workouts.json';
import { calculateAllTrainingMetrics } from '../utils/trainingMetrics';
import { getWorkoutData } from '../data/workout-data';
import { WorkoutData } from '../types/workout';
import { UserPowerProfile } from '../types/userProfile';
import { getBestWorkoutData } from '../utils/workoutDataHelpers';
import { useViewport } from '../hooks/useViewport';
import WorkoutChart from './WorkoutChart';
import styles from './WorkoutSelector.module.css';

interface WorkoutSelectorProps {
    onBasketChange: (basket: BasketState) => void;
    initialBasket?: WorkoutSelection[];
    userProfile: UserPowerProfile;
    onSaveScenario?: () => void;
    editingScenario?: any;
    onCancelEdit?: () => void;
}

interface WorkoutRow {
    id: string;
    name: string;
    workoutData?: WorkoutData | null;
    metrics: {
        duration: number;
        tss: number;
        intensityFactor: number;
        normalizedPower: number;
    } | null;
    error?: string;
    isSelected: boolean;
    usedOutdoorData?: boolean;
}

const WorkoutSelector: React.FC<WorkoutSelectorProps> = ({ 
    onBasketChange, 
    initialBasket = [],
    userProfile,
    onSaveScenario,
    editingScenario,
    onCancelEdit
}) => {
    const viewport = useViewport();
    const [workoutRows, setWorkoutRows] = useState<WorkoutRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [basket, setBasket] = useState<WorkoutSelection[]>(initialBasket);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'duration' | 'tss' | 'if'>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [optimalSelections, setOptimalSelections] = useState<any>(null);
    const [showFloatingSave, setShowFloatingSave] = useState(false);
    
    const searchInputRef = React.useRef<HTMLInputElement>(null);

    const MAX_WORKOUTS = 10;

    const findWorkoutTitle = (contentId: string): string => {
        const workout = allWorkouts.data.library.content.find((item: any) => item.id === contentId);
        return workout?.name || 'Unknown Workout';
    };

    const loadWorkoutData = async (workoutId: string): Promise<{ data: WorkoutData | null; usedOutdoor: boolean }> => {
        try {
            const rawData = getWorkoutData(workoutId);
            if (!rawData) {
                throw new Error(`Workout data not found for ${workoutId}`);
            }
            const result = getBestWorkoutData(rawData);
            return {
                data: result.data,
                usedOutdoor: result.usedOutdoor
            };
        } catch (error) {
            console.error(`Error loading workout ${workoutId}:`, error);
            return { data: null, usedOutdoor: false };
        }
    };

    const handleSort = (column: 'name' | 'duration' | 'tss' | 'if') => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('asc');
        }
    };

    const getSortIcon = (column: string) => {
        if (sortBy !== column) return '↕️';
        return sortOrder === 'asc' ? '↑' : '↓';
    };

    useEffect(() => {
        const loadAllWorkouts = async () => {
            const rows: WorkoutRow[] = [];
            const basketIds = new Set(basket.map(w => w.id));

            for (const workout of knighthoodWorkouts.workouts) {
                const title = findWorkoutTitle(workout.id);
                const workoutResult = await loadWorkoutData(workout.id);
                
                let metrics = null;
                if (workoutResult.data) {
                    try {
                        const calculatedMetrics = calculateAllTrainingMetrics(workoutResult.data, userProfile);
                        metrics = {
                            duration: calculatedMetrics.duration,
                            tss: calculatedMetrics.trainingStressScore,
                            intensityFactor: calculatedMetrics.intensityFactor,
                            normalizedPower: calculatedMetrics.normalizedPower
                        };
                    } catch (error) {
                        console.error(`Error calculating metrics for ${workout.id}:`, error);
                    }
                }

                rows.push({
                    id: workout.id,
                    name: title,
                    workoutData: workoutResult.data,
                    metrics,
                    error: !workoutResult.data ? 'Workout data not available' : undefined,
                    isSelected: basketIds.has(workout.id),
                    usedOutdoorData: workoutResult.usedOutdoor
                });
            }

            setWorkoutRows(rows);
            setLoading(false);

            // Generate optimal selections for quick picks
            const sortedWorkouts: SortedWorkout[] = rows
                .filter(row => row.metrics)
                .map(row => ({
                    id: row.id,
                    name: row.name,
                    tss: row.metrics!.tss,
                    duration: row.metrics!.duration,
                    intensityFactor: row.metrics!.intensityFactor,
                    normalizedPower: row.metrics!.normalizedPower
                }));

            const optimal = generateOptimalSelections(sortedWorkouts);
            setOptimalSelections(optimal);
        };

        loadAllWorkouts();
    }, [basket]);

    // Scroll detection for floating save button on mobile
    useEffect(() => {
        if (!viewport.isMobile) return;

        const handleScroll = () => {
            if (searchInputRef.current) {
                const searchRect = searchInputRef.current.getBoundingClientRect();
                const isSearchVisible = searchRect.bottom > 0;
                
                // Show floating button when search is scrolled out of view and basket is complete
                setShowFloatingSave(!isSearchVisible && basket.length === MAX_WORKOUTS);
            }
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll(); // Initial check

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [viewport.isMobile, basket.length, MAX_WORKOUTS]);

    const toggleWorkoutSelection = (workoutId: string) => {
        const workout = workoutRows.find(w => w.id === workoutId);
        if (!workout) return;

        const isCurrentlySelected = basket.some(w => w.id === workoutId);
        
        if (isCurrentlySelected) {
            // Remove from basket
            const newBasket = basket.filter(w => w.id !== workoutId);
            setBasket(newBasket);
            onBasketChange({
                selectedWorkouts: newBasket,
                isComplete: newBasket.length === MAX_WORKOUTS
            });
        } else {
            // Add to basket (if not full)
            if (basket.length < MAX_WORKOUTS && workout.metrics) {
                const newWorkout: WorkoutSelection = {
                    id: workout.id,
                    name: workout.name,
                    metrics: workout.metrics
                };
                const newBasket = [...basket, newWorkout];
                setBasket(newBasket);
                onBasketChange({
                    selectedWorkouts: newBasket,
                    isComplete: newBasket.length === MAX_WORKOUTS
                });
            }
        }
    };

    const clearBasket = () => {
        setBasket([]);
        onBasketChange({
            selectedWorkouts: [],
            isComplete: false
        });
    };

    const randomKnighthoodQuest = () => {
        // First clear all selections
        setBasket([]);
        
        // Get all workouts with valid metrics (excluding those with errors)
        const validWorkouts = workoutRows.filter(workout => 
            workout.metrics && !workout.error
        );
        
        // Randomly shuffle and select 10 workouts
        const shuffled = [...validWorkouts].sort(() => Math.random() - 0.5);
        const selectedWorkouts = shuffled.slice(0, Math.min(10, shuffled.length));
        
        // Convert to WorkoutSelection format
        const newBasket: WorkoutSelection[] = selectedWorkouts.map(workout => ({
            id: workout.id,
            name: workout.name,
            metrics: workout.metrics!,
            usedOutdoorData: workout.usedOutdoorData || false
        }));
        
        setBasket(newBasket);
        onBasketChange({
            selectedWorkouts: newBasket,
            isComplete: newBasket.length === MAX_WORKOUTS
        });
    };

    const filteredWorkouts = workoutRows.filter(workout => 
        workout.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedWorkouts = [...filteredWorkouts].sort((a, b) => {
        let aValue, bValue;
        
        switch (sortBy) {
            case 'name':
                aValue = a.name;
                bValue = b.name;
                break;
            case 'duration':
                aValue = a.metrics?.duration || 0;
                bValue = b.metrics?.duration || 0;
                break;
            case 'tss':
                aValue = a.metrics?.tss || 0;
                bValue = b.metrics?.tss || 0;
                break;
            case 'if':
                aValue = a.metrics?.intensityFactor || 0;
                bValue = b.metrics?.intensityFactor || 0;
                break;
            default:
                return 0;
        }
        
        if (typeof aValue === 'string') {
            return sortOrder === 'asc' 
                ? aValue.localeCompare(bValue as string)
                : (bValue as string).localeCompare(aValue);
        } else {
            return sortOrder === 'asc' 
                ? (aValue as number) - (bValue as number)
                : (bValue as number) - (aValue as number);
        }
    });

    const combinedMetrics = calculateCombinedMetrics(basket);
    
    // Calculate target intensity metrics
    const targetIntensity = userProfile.targetIntensity / 100;
    const targetMetrics = {
        totalTargetTSS: combinedMetrics.totalTSS * targetIntensity,
        averageTargetIF: combinedMetrics.averageIF * targetIntensity,
        totalTargetNP: combinedMetrics.totalNP * targetIntensity
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <h2 className={styles.loadingTitle}>Loading workouts...</h2>
            </div>
        );
    }

    // Mobile card layout
    const renderMobileLayout = () => (
        <div className={styles.containerMobile}>
            {/* Header Section */}
            <div className={styles.headerMobile}>
                <h1 className={styles.titleMobile}>
                    Plan Your Assault on the Castle
                </h1>
                <p className={styles.subtitleMobile}>
                    Assemble 10 instruments of Suffering for your siezing of the highest HONOUR in Sufferlandria
                </p>

                {/* Quick Selection Options - Mobile */}
                {optimalSelections && (
                    <div className={styles.quickSelectionMobile}>
                        <div className={styles.quickSelectionTitle}>
                            PATHS TO KNIGHTHOOD (Choose your destiny):
                        </div>
                        <div className={styles.quickSelectionGrid}>
                            <button
                                onClick={() => {
                                    const selections = convertToWorkoutSelections(optimalSelections.lowestTSS);
                                    setBasket(selections);
                                    onBasketChange({ selectedWorkouts: selections, isComplete: true });
                                }}
                                className={`${styles.quickSelectionButton} ${styles.pathMerciful}`}
                                title="For those new to SUFFERING"
                            >
                                🏃‍♂️ Merciful Path
                            </button>
                            <button
                                onClick={() => {
                                    const selections = convertToWorkoutSelections(optimalSelections.shortestDuration);
                                    setBasket(selections);
                                    onBasketChange({ selectedWorkouts: selections, isComplete: true });
                                }}
                                className={`${styles.quickSelectionButton} ${styles.pathSwift}`}
                                title="Get it over with quickly"
                            >
                                ⚡ Swift Strike
                            </button>
                            <button
                                onClick={() => {
                                    const selections = convertToWorkoutSelections(optimalSelections.lowestIF);
                                    setBasket(selections);
                                    onBasketChange({ selectedWorkouts: selections, isComplete: true });
                                }}
                                className={`${styles.quickSelectionButton} ${styles.pathGentle}`}
                                title="Less pain, more endurance"
                            >
                                💚 Gentle Suffering
                            </button>
                            <button
                                onClick={() => {
                                    const selections = convertToWorkoutSelections(optimalSelections.balanced);
                                    setBasket(selections);
                                    onBasketChange({ selectedWorkouts: selections, isComplete: true });
                                }}
                                className={`${styles.quickSelectionButton} ${styles.pathBalanced}`}
                                title="The way GvA intended"
                            >
                                ⚖️ True Sufferlandrian
                            </button>
                            <button
                                onClick={() => {
                                    const selections = convertToWorkoutSelections(optimalSelections.highestTSS);
                                    setBasket(selections);
                                    onBasketChange({ selectedWorkouts: selections, isComplete: true });
                                }}
                                className={`${styles.quickSelectionButton} ${styles.pathMaxSuffering}`}
                                title="Please see a doctor first"
                            >
                                🔥 Path of MAXIMUM SUFFERING
                            </button>
                            <button
                                onClick={() => {
                                    const selections = convertToWorkoutSelections(optimalSelections.longestDuration);
                                    setBasket(selections);
                                    onBasketChange({ selectedWorkouts: selections, isComplete: true });
                                }}
                                className={`${styles.quickSelectionButton} ${styles.pathEndurance}`}
                                title="Test your mental fortitude"
                            >
                                ⏰ Epic Endurance
                            </button>
                            <button
                                onClick={randomKnighthoodQuest}
                                className={`${styles.quickSelectionButton} ${styles.pathChaos}`}
                                title="Let fate decide your suffering"
                            >
                                🎲 Trial by Chaos
                            </button>
                        </div>
                    </div>
                )}

                {/* Basket Summary - Mobile */}
                <div className={`${styles.basketSummaryMobile} ${
                    basket.length === MAX_WORKOUTS ? styles.basketSummaryComplete : styles.basketSummaryIncomplete
                }`}>
                    <div className={styles.basketSummaryHeader}>
                        <h3 className={styles.basketTitle}>
                            Arsenal of SUFFERING ({basket.length}/{MAX_WORKOUTS})
                        </h3>
                        {basket.length === MAX_WORKOUTS && (
                            <>
                                <div className={styles.basketCompleteMessage}>
                                    ⚔️ Ready for KNIGHTHOOD! The Ministry of Madness awaits your Suffering!
                                </div>
                                {onSaveScenario && (
                                    <button
                                        data-testid="save-scenario-button"
                                        onClick={onSaveScenario}
                                        className={`${styles.saveButton} ${styles.saveButtonMobile} ${
                                            editingScenario ? styles.saveButtonEditMargin : styles.saveButtonNormalMargin
                                        }`}
                                    >
                                        {editingScenario ? 'Update Scenario' : 'Save Scenario'}
                                    </button>
                                )}
                            </>
                        )}
                        {editingScenario && onCancelEdit && (
                            <button
                                onClick={onCancelEdit}
                                id="cancel-edit-button"
                                data-testid="cancel-edit-button"
                                className={`${styles.cancelButton} ${styles.cancelButtonMobile}`}
                            >
                                Cancel Edit
                            </button>
                        )}
                        {basket.length > 0 && (
                            <button
                                onClick={clearBasket}
                                className={styles.clearAllButton}
                                id="clear-basket-button"
                            >
                                Clear All ({basket.length})
                            </button>
                        )}
                    </div>
                </div>
                
                {/* Search and Sort Controls */}
                <div className={styles.searchSortContainer}>
                    <input
                        ref={searchInputRef}
                        data-testid="workout-search"
                        type="text"
                        placeholder="Search workouts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                    />
                    
                    <div className={styles.sortContainer}>
                        <span className={styles.sortLabel}>Sort:</span>
                        {(['name', 'duration', 'tss', 'if'] as const).map(col => (
                            <button
                                key={col}
                                onClick={() => handleSort(col)}
                                className={`${styles.sortButton} ${
                                    sortBy === col ? styles.sortButtonActive : styles.sortButtonInactive
                                }`}
                            >
                                {col === 'name' ? 'Name' : 
                                 col === 'duration' ? 'Duration' :
                                 col === 'tss' ? 'TSS®' : 'IF®'}
                                {sortBy === col && getSortIcon(col)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Workout Cards */}
                <div className={styles.workoutCardsContainer}>
                    {sortedWorkouts.map((row, index) => {
                        const isSelected = row.isSelected;
                        const canSelect = !isSelected && basket.length < MAX_WORKOUTS && row.metrics;
                        const canDeselect = isSelected;
                        const isClickable = canSelect || canDeselect;

                        return (
                            <div 
                                key={row.id}
                                onClick={() => isClickable ? toggleWorkoutSelection(row.id) : undefined}
                                className={`${styles.workoutCard} ${
                                    isSelected ? styles.workoutCardSelected : ''
                                } ${
                                    !row.metrics ? styles.workoutCardDisabled : ''
                                } ${
                                    isClickable ? styles.workoutCardClickable : styles.workoutCardNotClickable
                                }`}
                            >
                                {/* Selection Indicator */}
                                <div 
                                    data-testid={`workout-checkbox-${row.id}`} 
                                    className={`${styles.workoutCheckbox} ${
                                        isSelected ? styles.workoutCheckboxSelected : ''
                                    }`}
                                >
                                    {isSelected && <span className={styles.workoutCheckboxIcon}>✓</span>}
                                </div>

                                {/* Workout Header */}
                                <div className={styles.workoutHeader}>
                                    <div className={styles.workoutNameContainer}>
                                        <strong className={styles.workoutName}>
                                            {row.name}
                                        </strong>
                                        {row.usedOutdoorData && (
                                            <span 
                                                className={styles.workoutOutdoorIcon}
                                                title="Using outdoor power profile data"
                                            >
                                                ⚠️
                                            </span>
                                        )}
                                    </div>
                                    <div className={styles.workoutId}>
                                        ID: {row.id}
                                    </div>
                                </div>

                                {/* Metrics Grid */}
                                {row.metrics && (
                                    <div className={styles.workoutMetricsGrid}>
                                        <div className={styles.workoutMetricItem}>
                                            <div className={`${styles.workoutMetricLabel} ${styles.metricDuration}`}>Duration</div>
                                            <div className={styles.workoutMetricValue}>
                                                {formatDuration(row.metrics.duration)}
                                            </div>
                                        </div>
                                        <div className={styles.workoutMetricItem}>
                                            <div className={`${styles.workoutMetricLabel} ${styles.metricTss}`}>TSS®</div>
                                            <div className={styles.workoutMetricValue}>
                                                {Math.round(row.metrics.tss)}
                                            </div>
                                        </div>
                                        <div className={styles.workoutMetricItem}>
                                            <div className={`${styles.workoutMetricLabel} ${styles.metricIf}`}>IF®</div>
                                            <div className={styles.workoutMetricValue}>
                                                {row.metrics.intensityFactor.toFixed(2)}
                                            </div>
                                        </div>
                                        <div className={styles.workoutMetricItem}>
                                            <div className={`${styles.workoutMetricLabel} ${styles.metricNp}`}>NP®</div>
                                            <div className={styles.workoutMetricValue}>
                                                {Math.round(row.metrics.normalizedPower)}W
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Workout Profile Chart */}
                                {row.workoutData && row.metrics && (
                                    <div className={styles.workoutChartContainer}>
                                        <WorkoutChart
                                            workoutData={row.workoutData}
                                            userProfile={userProfile}
                                            height={60}
                                        />
                                    </div>
                                )}

                                {!row.metrics && (
                                    <div className={styles.workoutErrorMessage}>
                                        {row.error || 'No workout data available'}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
            
            {/* Floating Save Button */}
            {showFloatingSave && onSaveScenario && (
                <div className={styles.floatingSaveContainer}>
                    <button
                        data-testid="floating-save-scenario-button"
                        onClick={onSaveScenario}
                        className={styles.floatingSaveButton}
                    >
                        💾 {editingScenario ? 'Update Scenario' : 'Save Scenario'}
                    </button>
                    {editingScenario && onCancelEdit && (
                        <button
                            onClick={onCancelEdit}
                            id="cancel-edit-button"
                            data-testid="cancel-edit-button"
                            className={styles.floatingCancelButton}
                        >
                            Cancel
                        </button>
                    )}
                </div>
            )}
        </div>
    );

    return viewport.isMobile ? renderMobileLayout() : (
        <div className={styles.desktopContainer}>
            {/* Header Section */}
            <div className={styles.desktopHeader}>
                <div className={styles.desktopHeaderInner}>
                    <h1 className={styles.desktopTitle}>
                        Plan Your Assault on the Castle
                    </h1>
                    <p className={styles.desktopSubtitle}>
                        Assemble 10 instruments of SUFFERING for your siezing of the highest HONOUR in Sufferlandria
                    </p>
                </div>
            </div>

            {/* Quick Selection Options */}
            {optimalSelections && (
                <div className={styles.quickSelectionDesktop}>
                    <div className={styles.quickSelectionTitleDesktop}>
                        PATHS TO KNIGHTHOOD (Choose your destiny of SUFFERING):
                    </div>
                    <div className={styles.quickSelectionButtonsDesktop}>
                        <button
                            onClick={() => {
                                const selections = convertToWorkoutSelections(optimalSelections.lowestTSS);
                                setBasket(selections);
                                onBasketChange({ selectedWorkouts: selections, isComplete: true });
                            }}
                            className={`${styles.quickSelectionButtonDesktop} ${styles.pathMercifulDesktop}`}
                            title="For those new to SUFFERING"
                        >
                            🏃‍♂️ Merciful Path
                        </button>
                        <button
                            onClick={() => {
                                const selections = convertToWorkoutSelections(optimalSelections.shortestDuration);
                                setBasket(selections);
                                onBasketChange({ selectedWorkouts: selections, isComplete: true });
                            }}
                            className={`${styles.quickSelectionButtonDesktop} ${styles.pathSwiftDesktop}`}
                            title="Get it over with quickly"
                        >
                            ⚡ Swift Strike
                        </button>
                        <button
                            onClick={() => {
                                const selections = convertToWorkoutSelections(optimalSelections.lowestIF);
                                setBasket(selections);
                                onBasketChange({ selectedWorkouts: selections, isComplete: true });
                            }}
                            className={`${styles.quickSelectionButtonDesktop} ${styles.pathGentleDesktop}`}
                            title="Less pain, more endurance"
                        >
                            💚 Gentle Suffering
                        </button>
                        <button
                            onClick={() => {
                                const selections = convertToWorkoutSelections(optimalSelections.balanced);
                                setBasket(selections);
                                onBasketChange({ selectedWorkouts: selections, isComplete: true });
                            }}
                            className={`${styles.quickSelectionButtonDesktop} ${styles.pathBalancedDesktop}`}
                            title="The way GvA intended"
                        >
                            ⚖️ True Sufferlandrian
                        </button>
                        <button
                            onClick={() => {
                                const selections = convertToWorkoutSelections(optimalSelections.highestTSS);
                                setBasket(selections);
                                onBasketChange({ selectedWorkouts: selections, isComplete: true });
                            }}
                            className={`${styles.quickSelectionButtonDesktop} ${styles.pathMaximumDesktop}`}
                            title="Please see a doctor first"
                        >
                            🔥 Path of MAXIMUM SUFFERING
                        </button>
                        <button
                            onClick={() => {
                                const selections = convertToWorkoutSelections(optimalSelections.longestDuration);
                                setBasket(selections);
                                onBasketChange({ selectedWorkouts: selections, isComplete: true });
                            }}
                            className={`${styles.quickSelectionButtonDesktop} ${styles.pathEnduranceDesktop}`}
                            title="Test your mental fortitude"
                        >
                            ⏰ Epic Endurance
                        </button>
                        <button
                            onClick={randomKnighthoodQuest}
                            className={`${styles.quickSelectionButtonDesktop} ${styles.pathChaosDesktop}`}
                            title="Let fate decide your suffering"
                        >
                            🎲 Trial by Chaos
                        </button>
                    </div>
                </div>
            )}

            {/* Sticky Controls Container */}
            <div className={styles.desktopControlsSticky}> ho
                <div className={styles.desktopControlsContainer}>
                    {/* Basket Summary */}
                    {basket.length > 0 && (
                        <div className={`${styles.basketSummaryWrapper}`}>  
                            <div className={`${styles.basketSummaryDesktop} ${
                                basket.length === MAX_WORKOUTS ? styles.basketSummaryDesktopComplete : ''
                            }`}>
                            <div className={styles.basketSummaryDesktopHeader}>
                                <div>
                                    <h3 className={styles.basketSummaryDesktopTitle}>
                                        Your Arsenal of SUFFERING ({basket.length}/{MAX_WORKOUTS})
                                    </h3>
                                    {basket.length === MAX_WORKOUTS && (
                                        <div className={styles.basketCompleteMessage}>
                                            ⚔️ Ready for KNIGHTHOOD! The Ministry of Madness acknowledges your commitment to SUFFERING!
                                        </div>
                                    )}
                                    {onSaveScenario && (
                                        <div className={styles.desktopSaveButtonContainer}>
                                            <button
                                                onClick={clearBasket}
                                                className={`${styles.clearBasketButton}`}
                                                id="clear-basket-button"
                                            >
                                                Clear All
                                            </button>
                                            <button
                                                data-testid="save-scenario-button"
                                                onClick={basket.length === MAX_WORKOUTS ? onSaveScenario : undefined}
                                                className={`${styles.saveButton} ${MAX_WORKOUTS > basket.length ? styles.saveBasketButtonDisabled : ''}`}
                                            >
                                                {editingScenario ? 'Update Scenario' : 'Save Scenario'}
                                            </button>
                                            {editingScenario && onCancelEdit && (
                                                <button
                                                    onClick={onCancelEdit}
                                                    id="cancel-edit-button"
                                                    data-testid="cancel-edit-button"
                                                    className={styles.cancelButton}
                                                >
                                                    Cancel Edit
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className={styles.basketMetricsGrid}>
                                <div className={`${styles.metricCard} ${styles.metricCardDuration}`}>
                                    <div className={`${styles.metricLabel} ${styles.colorDuration}`}>Workout Duration</div>
                                    <div className={styles.metricValue}>
                                        {formatDuration(combinedMetrics.totalDuration)}
                                    </div>
                                </div>
                                <div className={`${styles.metricCard} ${styles.metricCardElapsed}`}>
                                    <div className={`${styles.metricLabel} ${styles.colorElapsed}`}>Elapsed Duration</div>
                                    <div className={styles.metricValue}>
                                        {formatDuration(combinedMetrics.totalElapsedDuration)}
                                    </div>
                                    <div className={styles.metricSubtext}>
                                        +{Math.max(0, basket.length - 1) * 10}min rest
                                    </div>
                                </div>
                                <div className={`${styles.metricCard} ${styles.metricCardTss}`}>
                                    <div className={`${styles.metricLabel} ${styles.colorTss}`}>
                                        TSS® ({userProfile.targetIntensity}%)
                                    </div>
                                    <div className={styles.metricValue}>
                                        {Math.round(combinedMetrics.totalTSS)} ({Math.round(targetMetrics.totalTargetTSS)})
                                    </div>
                                </div>
                                <div className={`${styles.metricCard} ${styles.metricCardIf}`}>
                                    <div className={`${styles.metricLabel} ${styles.colorIf}`}>
                                        Avg IF® ({userProfile.targetIntensity}%)
                                    </div>
                                    <div className={styles.metricValue}>
                                        {combinedMetrics.averageIF.toFixed(2)} ({targetMetrics.averageTargetIF.toFixed(2)})
                                    </div>
                                </div>
                                <div className={`${styles.metricCard} ${styles.metricCardNp}`}>
                                    <div className={`${styles.metricLabel} ${styles.colorNp}`}>
                                        Avg NP® ({userProfile.targetIntensity}%)
                                    </div>
                                    <div className={styles.metricValue}>
                                        {Math.round(combinedMetrics.totalNP)}W ({Math.round(targetMetrics.totalTargetNP)}W)
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    )}

                    {/* Controls */}
                    <div className={styles.searchControlsDesktop}>
                        <div className={styles.searchLabelDesktop}>
                            SEARCH & FILTER:
                        </div>
                        <input
                            type="text"
                            data-testid="workout-search"
                            placeholder="Search workouts..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={styles.searchInputDesktop}
                        />
                    
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className={styles.sortSelectDesktop}
                        >
                            <option value="name">Sort by Name</option>
                            <option value="duration">Sort by Duration</option>
                            <option value="tss">Sort by TSS</option>
                            <option value="if">Sort by IF</option>
                        </select>
                        
                        <button
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            className={styles.sortOrderButtonDesktop}
                        >
                            {sortOrder === 'asc' ? '↑' : '↓'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className={styles.desktopContentArea}>
                <div className={styles.desktopContentWrapper}>
                    {/* Workout List */}
                    <div className={styles.tableScrollContainer}>
                        <table className={styles.workoutTable}>
                        <thead>
                            <tr className={styles.tableHeaderRow}>
                                <th className={`${styles.tableHeader} ${styles.selectColumn}`}>
                                    Select
                                </th>
                                <th 
                                    className={`${styles.tableHeader} ${styles.sortableColumn} ${styles.workoutColumn}`}
                                    onClick={() => handleSort('name')}
                                >
                                    Workout {getSortIcon('name')}
                                </th>
                                <th 
                                    className={`${styles.tableHeader} ${styles.sortableColumn} ${styles.centerColumn}`}
                                    onClick={() => handleSort('duration')}
                                >
                                    Duration {getSortIcon('duration')}
                                </th>
                                <th 
                                    className={`${styles.tableHeader} ${styles.sortableColumn} ${styles.centerColumn}`}
                                    onClick={() => handleSort('tss')}
                                >
                                    TSS® {getSortIcon('tss')}
                                </th>
                                <th 
                                    className={`${styles.tableHeader} ${styles.sortableColumn} ${styles.centerColumn}`}
                                    onClick={() => handleSort('if')}
                                >
                                    IF® {getSortIcon('if')}
                                </th>
                                <th className={`${styles.tableHeader} ${styles.centerColumn}`}>
                                    NP®
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedWorkouts.map((row, index) => {
                                const isSelected = row.isSelected;
                                const canSelect = !isSelected && basket.length < MAX_WORKOUTS && row.metrics;
                                const canDeselect = isSelected;
                                
                                return (
                                    <tr 
                                        key={row.id}
                                        onClick={(e) => {
                                            // Only trigger selection if clicking outside of interactive elements
                                            const target = e.target as HTMLElement;
                                            if (!target.closest('input') && !target.closest('a')) {
                                                toggleWorkoutSelection(row.id);
                                            }
                                        }}
                                        className={`${styles.tableRow} ${isSelected ? styles.selectedRow : (index % 2 === 0 ? styles.evenRow : styles.oddRow)} ${!row.metrics ? styles.disabledRow : ''} ${(canSelect || canDeselect) ? styles.selectableRow : styles.nonSelectableRow}`}
                                    >
                                        <td className={`${styles.tableCell} ${styles.checkboxCell}`}>
                                            <input
                                                data-testid={`workout-checkbox-${row.id}`}
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleWorkoutSelection(row.id)}
                                                disabled={!canSelect && !canDeselect}
                                                className={`${styles.workoutCheckboxDesktop} ${(canSelect || canDeselect) ? styles.enabledCheckbox : styles.disabledCheckbox}`}
                                            />
                                        </td>
                                        <td className={styles.tableCell}>
                                            <div>
                                                {/* Workout Details Container - Description and Chart side by side */}
                                                <div className={styles.workoutDescriptionFlexItem}>
                                                    <div className={styles.workoutNameCell}>
                                                        <span className={styles.workoutName}>{row.name}</span>
                                                        {row.usedOutdoorData && (
                                                            <span 
                                                                className={styles.outdoorDataWarning}
                                                                title="Indoor power profile data unavailable, using outdoor power profile."
                                                            >
                                                                ⚠️
                                                            </span>
                                                        )}
                                                        <a 
                                                            href={`https://systm.wahoofitness.com/content-details/${row.id}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={styles.workoutLink}
                                                            title={`View ${row.name} on SYSTM`}
                                                        >
                                                            ↗
                                                        </a>
                                                    </div>
                                                    
                                                    {/* Workout Profile Chart */}
                                                    {row.workoutData && row.metrics && (
                                                        <div className={styles.workoutChartContainerFlexItem}>
                                                            <WorkoutChart
                                                                workoutData={row.workoutData}
                                                                userProfile={userProfile}
                                                                height={60}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className={`${styles.tableCell} ${styles.centerColumn}`}>
                                            <span className={styles.workoutMetric}>
                                                {row.metrics ? formatDuration(row.metrics.duration) : 'N/A'}
                                            </span>
                                        </td>
                                        <td className={`${styles.tableCell} ${styles.centerColumn}`}>
                                            <span className={styles.workoutMetric}>
                                                {row.metrics ? Math.round(row.metrics.tss) : 'N/A'}
                                            </span>
                                        </td>
                                        <td className={`${styles.tableCell} ${styles.centerColumn}`}>
                                            <span className={styles.workoutMetric}>
                                                {row.metrics ? row.metrics.intensityFactor.toFixed(2) : 'N/A'}
                                            </span>
                                        </td>
                                        <td className={`${styles.tableCell} ${styles.centerColumn}`}>
                                            <span className={styles.workoutMetric}>
                                                {row.metrics ? Math.round(row.metrics.normalizedPower) : 'N/A'}
                                                <span className={styles.metricSuffix}>{row.metrics ? 'W' : ''}</span>
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        
    );
};

export default WorkoutSelector;