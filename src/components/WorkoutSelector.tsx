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
                                        className={styles.saveButton}
                                        style={{
                                            minHeight: '48px',
                                            marginBottom: editingScenario ? '8px' : '12px',
                                            width: '100%'
                                        }}
                                    >
                                        {editingScenario ? 'Update Scenario' : 'Save Scenario'}
                                    </button>
                                )}
                                {editingScenario && onCancelEdit && (
                                    <button
                                        onClick={onCancelEdit}
                                        className={styles.cancelButton}
                                        style={{
                                            marginBottom: '8px',
                                            width: '100%'
                                        }}
                                    >
                                        Cancel Edit
                                    </button>
                                )}
                            </>
                        )}
                        {basket.length > 0 && (
                            <button
                                onClick={clearBasket}
                                className={styles.clearAllButton}
                            >
                                Clear All ({basket.length})
                            </button>
                        )}
                    </div>
                </div>

                {/* Quick Selection Options - Mobile */}
                {optimalSelections && (
                    <div style={{
                        backgroundColor: '#333',
                        padding: '15px',
                        borderRadius: '8px',
                        marginBottom: '16px',
                        border: '1px solid #444'
                    }}>
                        <div style={{ color: '#999', fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>
                            PATHS TO KNIGHTHOOD (Choose your destiny):
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                            <button
                                onClick={() => {
                                    const selections = convertToWorkoutSelections(optimalSelections.lowestTSS);
                                    setBasket(selections);
                                    onBasketChange({ selectedWorkouts: selections, isComplete: true });
                                }}
                                style={{
                                    padding: '10px 8px',
                                    backgroundColor: '#2196F3',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                    textAlign: 'center'
                                }}
                            >
                                🏃‍♂️ Merciful Path
                                <br />
                                <span style={{ fontSize: '10px', opacity: 0.8 }}>(For those new to SUFFERING)</span>
                            </button>
                            <button
                                onClick={() => {
                                    const selections = convertToWorkoutSelections(optimalSelections.shortestDuration);
                                    setBasket(selections);
                                    onBasketChange({ selectedWorkouts: selections, isComplete: true });
                                }}
                                style={{
                                    padding: '10px 8px',
                                    backgroundColor: '#FF9800',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                    textAlign: 'center'
                                }}
                            >
                                ⚡ Swift Strike
                                <br />
                                <span style={{ fontSize: '10px', opacity: 0.8 }}>(Get it over with quickly)</span>
                            </button>
                            <button
                                onClick={() => {
                                    const selections = convertToWorkoutSelections(optimalSelections.lowestIF);
                                    setBasket(selections);
                                    onBasketChange({ selectedWorkouts: selections, isComplete: true });
                                }}
                                style={{
                                    padding: '10px 8px',
                                    backgroundColor: '#4CAF50',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                    textAlign: 'center'
                                }}
                            >
                                💚 Gentle Suffering
                                <br />
                                <span style={{ fontSize: '10px', opacity: 0.8 }}>(Less pain, more endurance)</span>
                            </button>
                            <button
                                onClick={() => {
                                    const selections = convertToWorkoutSelections(optimalSelections.balanced);
                                    setBasket(selections);
                                    onBasketChange({ selectedWorkouts: selections, isComplete: true });
                                }}
                                style={{
                                    padding: '10px 8px',
                                    backgroundColor: '#9C27B0',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                    textAlign: 'center'
                                }}
                            >
                                ⚖️ True Sufferlandrian
                                <br />
                                <span style={{ fontSize: '10px', opacity: 0.8 }}>(The way GvA intended)</span>
                            </button>
                            <button
                                onClick={() => {
                                    const selections = convertToWorkoutSelections(optimalSelections.highestTSS);
                                    setBasket(selections);
                                    onBasketChange({ selectedWorkouts: selections, isComplete: true });
                                }}
                                style={{
                                    padding: '10px 8px',
                                    backgroundColor: '#d32f2f',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                    textAlign: 'center'
                                }}
                            >
                                🔥 Path of MAXIMUM SUFFERING
                                <br />
                                <span style={{ fontSize: '10px', opacity: 0.8 }}>(Please see a doctor first)</span>
                            </button>
                            <button
                                onClick={() => {
                                    const selections = convertToWorkoutSelections(optimalSelections.longestDuration);
                                    setBasket(selections);
                                    onBasketChange({ selectedWorkouts: selections, isComplete: true });
                                }}
                                style={{
                                    padding: '10px 8px',
                                    backgroundColor: '#795548',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                    textAlign: 'center'
                                }}
                            >
                                ⏰ Epic Endurance
                                <br />
                                <span style={{ fontSize: '10px', opacity: 0.8 }}>(Test your mental fortitude)</span>
                            </button>
                        </div>
                    </div>
                )}
                
                {/* Search and Sort Controls */}
                <div style={{ marginBottom: '16px' }}>
                    <input
                        ref={searchInputRef}
                        data-testid="workout-search"
                        type="text"
                        placeholder="Search workouts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: '#333',
                            color: 'white',
                            border: '1px solid #555',
                            borderRadius: '8px',
                            marginBottom: '12px',
                            fontSize: '16px'
                        }}
                    />
                    
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px',
                        alignItems: 'center'
                    }}>
                        <span style={{ color: 'white', fontSize: '14px', minWidth: '60px' }}>Sort:</span>
                        {(['name', 'duration', 'tss', 'if'] as const).map(col => (
                            <button
                                key={col}
                                onClick={() => handleSort(col)}
                                style={{
                                    padding: '8px 12px',
                                    backgroundColor: sortBy === col ? '#4CAF50' : '#555',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {sortedWorkouts.map((row, index) => {
                        const isSelected = row.isSelected;
                        const canSelect = !isSelected && basket.length < MAX_WORKOUTS && row.metrics;
                        const canDeselect = isSelected;
                        const isClickable = canSelect || canDeselect;

                        return (
                            <div 
                                key={row.id}
                                onClick={() => isClickable ? toggleWorkoutSelection(row.id) : undefined}
                                style={{
                                    backgroundColor: isSelected ? '#1e4d1e' : '#2a2a2a',
                                    borderRadius: '8px',
                                    padding: '15px',
                                    border: isSelected ? '2px solid #4CAF50' : '1px solid #333',
                                    opacity: row.metrics ? 1 : 0.6,
                                    cursor: isClickable ? 'pointer' : 'not-allowed',
                                    transition: 'all 0.2s ease',
                                    position: 'relative'
                                }}
                            >
                                {/* Selection Indicator */}
                                <div 
                                    data-testid={`workout-checkbox-${row.id}`} 
                                    className={`workout-checkbox ${isSelected ? 'selected' : 'unselected'}`}
                                    style={{
                                        position: 'absolute',
                                        top: '12px',
                                        right: '12px',
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '4px',
                                        border: '2px solid #555',
                                        backgroundColor: isSelected ? '#4CAF50' : 'transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    {isSelected && <span style={{ color: 'white', fontSize: '16px' }}>✓</span>}
                                </div>

                                {/* Workout Header */}
                                <div style={{ marginBottom: '12px', paddingRight: '40px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                        <strong style={{ color: 'white', fontSize: '16px', flex: 1 }}>
                                            {row.name}
                                        </strong>
                                        {row.usedOutdoorData && (
                                            <span 
                                                style={{ 
                                                    color: '#FFA726',
                                                    fontSize: '16px'
                                                }}
                                                title="Using outdoor power profile data"
                                            >
                                                ⚠️
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ color: '#999', fontSize: '12px' }}>
                                        ID: {row.id}
                                    </div>
                                </div>

                                {/* Metrics Grid */}
                                {row.metrics && (
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(4, 1fr)',
                                        gap: '8px'
                                    }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ color: '#4CAF50', fontSize: '10px', marginBottom: '2px' }}>Duration</div>
                                            <div style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>
                                                {formatDuration(row.metrics.duration)}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ color: '#2196F3', fontSize: '10px', marginBottom: '2px' }}>TSS®</div>
                                            <div style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>
                                                {Math.round(row.metrics.tss)}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ color: '#FF9800', fontSize: '10px', marginBottom: '2px' }}>IF®</div>
                                            <div style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>
                                                {row.metrics.intensityFactor.toFixed(2)}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ color: '#9C27B0', fontSize: '10px', marginBottom: '2px' }}>NP®</div>
                                            <div style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>
                                                {Math.round(row.metrics.normalizedPower)}W
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Workout Profile Chart */}
                                {row.workoutData && row.metrics && (
                                    <div style={{
                                        backgroundColor: '#1a1a1a',
                                        borderRadius: '6px',
                                        padding: '8px',
                                        marginTop: '12px'
                                    }}>
                                        <WorkoutChart
                                            workoutData={row.workoutData}
                                            userProfile={userProfile}
                                            height={60}
                                        />
                                    </div>
                                )}

                                {!row.metrics && (
                                    <div style={{ 
                                        color: '#999', 
                                        textAlign: 'center',
                                        padding: '20px',
                                        fontStyle: 'italic'
                                    }}>
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
                <div style={{
                    position: 'fixed',
                    bottom: '16px',
                    left: '16px',
                    right: '16px',
                    zIndex: 1000,
                    display: 'flex',
                    gap: '8px'
                }}>
                    <button
                        data-testid="floating-save-scenario-button"
                        onClick={onSaveScenario}
                        style={{
                            flex: 1,
                            padding: '16px 24px',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                        }}
                    >
                        💾 {editingScenario ? 'Update Scenario' : 'Save Scenario'}
                    </button>
                    {editingScenario && onCancelEdit && (
                        <button
                            onClick={onCancelEdit}
                            style={{
                                padding: '16px 20px',
                                backgroundColor: '#666',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '16px',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                            }}
                        >
                            Cancel
                        </button>
                    )}
                </div>
            )}
        </div>
    );

    return viewport.isMobile ? renderMobileLayout() : (
        <div style={{ backgroundColor: '#1a1a1a', minHeight: '100vh' }}>
            {/* Header Section */}
            <div style={{ padding: '20px 20px 0 20px' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    <h1 style={{ color: 'white', marginBottom: '10px' }}>
                        Plan Your Assault on the Castle
                    </h1>
                    <p style={{ color: '#999', marginBottom: '30px' }}>
                        Assemble 10 instruments of SUFFERING for your siezing of the highest HONOUR in Sufferlandria
                    </p>
                </div>
            </div>

            {/* Sticky Controls Container */}
            <div style={{
                position: viewport.isMobile ? 'relative' : 'sticky',
                top: viewport.isMobile ? 'auto' : 0,
                zIndex: 100,
                backgroundColor: '#1a1a1a',
                borderBottom: '2px solid #333',
                paddingTop: viewport.isMobile ? '0' : '10px',
                paddingBottom: '10px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
            }}>
                <div style={{ padding: '0 20px', maxWidth: '1400px', margin: '0 auto' }}>
                    {/* Basket Summary */}
                    <div style={{ 
                        backgroundColor: basket.length === MAX_WORKOUTS ? '#1e3a1e' : '#2a2a2a', 
                        padding: '20px', 
                        borderRadius: '8px',
                        marginBottom: '20px',
                        border: basket.length === MAX_WORKOUTS ? '2px solid #4CAF50' : '1px solid #333',
                        transition: 'all 0.3s ease'
                    }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ color: 'white', margin: '0 0 10px 0' }}>
                                Your Arsenal of SUFFERING ({basket.length}/{MAX_WORKOUTS})
                            </h3>
                            {basket.length === MAX_WORKOUTS && (
                                <div style={{ color: '#4CAF50', fontWeight: 'bold', marginBottom: '15px' }}>
                                    ⚔️ Ready for KNIGHTHOOD! The Ministry of Madness acknowledges your commitment to SUFFERING!
                                </div>
                            )}
                            {basket.length === MAX_WORKOUTS && onSaveScenario && (
                                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                    <button
                                        data-testid="save-scenario-button"
                                        onClick={onSaveScenario}
                                        style={{
                                            padding: '12px 24px',
                                            backgroundColor: '#4CAF50',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            fontSize: '16px'
                                        }}
                                    >
                                        {editingScenario ? 'Update Scenario' : 'Save Scenario'}
                                    </button>
                                    {editingScenario && onCancelEdit && (
                                        <button
                                            onClick={onCancelEdit}
                                            style={{
                                                padding: '12px 24px',
                                                backgroundColor: '#666',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '14px'
                                            }}
                                        >
                                            Cancel Edit
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={clearBasket}
                            disabled={basket.length === 0}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: basket.length === 0 ? '#555' : '#d32f2f',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: basket.length === 0 ? 'not-allowed' : 'pointer'
                            }}
                        >
                            Clear All
                        </button>
                    </div>
                    
                    {basket.length > 0 && (
                        <div style={{ marginTop: '15px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                            <div style={{ backgroundColor: '#333', padding: '15px', borderRadius: '4px' }}>
                                <div style={{ color: '#999', fontSize: '14px' }}>Workout Duration</div>
                                <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
                                    {formatDuration(combinedMetrics.totalDuration)}
                                </div>
                            </div>
                            <div style={{ backgroundColor: '#333', padding: '15px', borderRadius: '4px' }}>
                                <div style={{ color: '#999', fontSize: '14px' }}>Elapsed Duration</div>
                                <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
                                    {formatDuration(combinedMetrics.totalElapsedDuration)}
                                </div>
                                <div style={{ color: '#999', fontSize: '12px', marginTop: '4px' }}>
                                    +{Math.max(0, basket.length - 1) * 10}min rest
                                </div>
                            </div>
                            <div style={{ backgroundColor: '#333', padding: '15px', borderRadius: '4px' }}>
                                <div style={{ color: '#999', fontSize: '14px' }}>Total TSS®</div>
                                <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
                                    {Math.round(combinedMetrics.totalTSS)}
                                </div>
                            </div>
                            <div style={{ backgroundColor: '#333', padding: '15px', borderRadius: '4px' }}>
                                <div style={{ color: '#999', fontSize: '14px' }}>Average IF®</div>
                                <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
                                    {combinedMetrics.averageIF.toFixed(2)}
                                </div>
                            </div>
                            <div style={{ backgroundColor: '#333', padding: '15px', borderRadius: '4px' }}>
                                <div style={{ color: '#999', fontSize: '14px' }}>Average NP®</div>
                                <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
                                    {Math.round(combinedMetrics.totalNP)}W
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                    {/* Quick Selection Options */}
                    {optimalSelections && (
                        <div style={{
                            backgroundColor: '#333',
                            padding: '15px',
                            borderRadius: '8px',
                            marginBottom: '15px',
                            border: '1px solid #444'
                        }}>
                            <div style={{ color: '#999', fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>
                                PATHS TO KNIGHTHOOD (Choose your destiny of SUFFERING):
                            </div>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <button
                                    onClick={() => {
                                        const selections = convertToWorkoutSelections(optimalSelections.lowestTSS);
                                        setBasket(selections);
                                        onBasketChange({ selectedWorkouts: selections, isComplete: true });
                                    }}
                                    style={{
                                        padding: '8px 12px',
                                        backgroundColor: '#2196F3',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                    }}
                                >
                                    🏃‍♂️ Merciful Path (For Suffering Beginners)
                                </button>
                                <button
                                    onClick={() => {
                                        const selections = convertToWorkoutSelections(optimalSelections.shortestDuration);
                                        setBasket(selections);
                                        onBasketChange({ selectedWorkouts: selections, isComplete: true });
                                    }}
                                    style={{
                                        padding: '8px 12px',
                                        backgroundColor: '#FF9800',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                    }}
                                >
                                    ⚡ Swift Strike (Get it over with quickly)
                                </button>
                                <button
                                    onClick={() => {
                                        const selections = convertToWorkoutSelections(optimalSelections.lowestIF);
                                        setBasket(selections);
                                        onBasketChange({ selectedWorkouts: selections, isComplete: true });
                                    }}
                                    style={{
                                        padding: '8px 12px',
                                        backgroundColor: '#4CAF50',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                    }}
                                >
                                    💚 Gentle Suffering (Less pain, more endurance)
                                </button>
                                <button
                                    onClick={() => {
                                        const selections = convertToWorkoutSelections(optimalSelections.balanced);
                                        setBasket(selections);
                                        onBasketChange({ selectedWorkouts: selections, isComplete: true });
                                    }}
                                    style={{
                                        padding: '8px 12px',
                                        backgroundColor: '#9C27B0',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                    }}
                                >
                                    ⚖️ True Sufferlandrian (The way GvA intended)
                                </button>
                                <button
                                    onClick={() => {
                                        const selections = convertToWorkoutSelections(optimalSelections.highestTSS);
                                        setBasket(selections);
                                        onBasketChange({ selectedWorkouts: selections, isComplete: true });
                                    }}
                                    style={{
                                        padding: '8px 12px',
                                        backgroundColor: '#d32f2f',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                    }}
                                >
                                    🔥 Path of MAXIMUM SUFFERING (Please see a doctor first)
                                </button>
                                <button
                                    onClick={() => {
                                        const selections = convertToWorkoutSelections(optimalSelections.longestDuration);
                                        setBasket(selections);
                                        onBasketChange({ selectedWorkouts: selections, isComplete: true });
                                    }}
                                    style={{
                                        padding: '8px 12px',
                                        backgroundColor: '#795548',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                    }}
                                >
                                    ⏰ Epic Endurance (Test your mental fortitude)
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Controls */}
                    <div style={{ 
                        display: 'flex', 
                        gap: '20px', 
                        marginBottom: '20px',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        backgroundColor: '#333',
                        padding: '15px',
                        borderRadius: '8px',
                        border: '1px solid #444'
                    }}>
                        <div style={{ color: '#999', fontSize: '14px', fontWeight: 'bold' }}>
                            SEARCH & FILTER:
                        </div>
                        <input
                            type="text"
                            data-testid="workout-search"
                            placeholder="Search workouts..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                padding: '10px',
                                backgroundColor: '#444',
                                color: 'white',
                                border: '1px solid #555',
                                borderRadius: '4px',
                                minWidth: '250px',
                                fontSize: '14px'
                            }}
                        />
                    
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        style={{
                            padding: '10px',
                            backgroundColor: '#333',
                            color: 'white',
                            border: '1px solid #555',
                            borderRadius: '4px'
                        }}
                    >
                        <option value="name">Sort by Name</option>
                        <option value="duration">Sort by Duration</option>
                        <option value="tss">Sort by TSS</option>
                        <option value="if">Sort by IF</option>
                    </select>
                    
                    <button
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        style={{
                            padding: '10px 15px',
                            backgroundColor: '#444',
                            color: 'white',
                            border: '1px solid #555',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        {sortOrder === 'asc' ? '↑' : '↓'}
                    </button>
                    </div>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div style={{ padding: '0 20px 20px 20px' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    {/* Workout List */}
                    <div style={{ overflowX: 'auto' }}>
                    <table style={{ 
                        width: '100%', 
                        borderCollapse: 'collapse',
                        backgroundColor: '#2a2a2a',
                        borderRadius: '8px',
                        overflow: 'hidden'
                    }}>
                        <thead>
                            <tr style={{ backgroundColor: '#333' }}>
                                <th style={{ padding: '15px', color: 'white', textAlign: 'center', borderBottom: '2px solid #444', width: '60px' }}>
                                    Select
                                </th>
                                <th 
                                    style={{ 
                                        padding: '15px', 
                                        color: 'white', 
                                        textAlign: 'left', 
                                        borderBottom: '2px solid #444',
                                        cursor: 'pointer',
                                        userSelect: 'none',
                                        transition: 'background-color 0.2s'
                                    }}
                                    onClick={() => handleSort('name')}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#444'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#333'}
                                >
                                    Workout {getSortIcon('name')}
                                </th>
                                <th 
                                    style={{ 
                                        padding: '15px', 
                                        color: 'white', 
                                        textAlign: 'center', 
                                        borderBottom: '2px solid #444',
                                        cursor: 'pointer',
                                        userSelect: 'none',
                                        transition: 'background-color 0.2s'
                                    }}
                                    onClick={() => handleSort('duration')}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#444'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#333'}
                                >
                                    Duration {getSortIcon('duration')}
                                </th>
                                <th 
                                    style={{ 
                                        padding: '15px', 
                                        color: 'white', 
                                        textAlign: 'center', 
                                        borderBottom: '2px solid #444',
                                        cursor: 'pointer',
                                        userSelect: 'none',
                                        transition: 'background-color 0.2s'
                                    }}
                                    onClick={() => handleSort('tss')}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#444'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#333'}
                                >
                                    TSS® {getSortIcon('tss')}
                                </th>
                                <th 
                                    style={{ 
                                        padding: '15px', 
                                        color: 'white', 
                                        textAlign: 'center', 
                                        borderBottom: '2px solid #444',
                                        cursor: 'pointer',
                                        userSelect: 'none',
                                        transition: 'background-color 0.2s'
                                    }}
                                    onClick={() => handleSort('if')}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#444'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#333'}
                                >
                                    IF® {getSortIcon('if')}
                                </th>
                                <th style={{ padding: '15px', color: 'white', textAlign: 'center', borderBottom: '2px solid #444' }}>
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
                                        style={{ 
                                            borderBottom: index < sortedWorkouts.length - 1 ? '1px solid #333' : 'none',
                                            backgroundColor: isSelected ? '#1e4d1e' : (index % 2 === 0 ? '#2a2a2a' : '#252525'),
                                            opacity: row.metrics ? 1 : 0.6,
                                            cursor: (canSelect || canDeselect) ? 'pointer' : 'not-allowed',
                                            transition: 'background-color 0.2s ease',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (canSelect || canDeselect) {
                                                const currentBg = isSelected ? '#1e4d1e' : (index % 2 === 0 ? '#2a2a2a' : '#252525');
                                                e.currentTarget.style.backgroundColor = isSelected ? '#2a5a2a' : '#333333';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            const originalBg = isSelected ? '#1e4d1e' : (index % 2 === 0 ? '#2a2a2a' : '#252525');
                                            e.currentTarget.style.backgroundColor = originalBg;
                                        }}
                                    >
                                        <td style={{ padding: '15px', textAlign: 'center' }}>
                                            <input
                                                data-testid={`workout-checkbox-${row.id}`}
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleWorkoutSelection(row.id)}
                                                disabled={!canSelect && !canDeselect}
                                                style={{
                                                    transform: 'scale(1.2)',
                                                    cursor: (canSelect || canDeselect) ? 'pointer' : 'not-allowed'
                                                }}
                                            />
                                        </td>
                                        <td style={{ padding: '15px', color: 'white', verticalAlign: 'top' }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <strong>{row.name}</strong>
                                                    {row.usedOutdoorData && (
                                                        <span 
                                                            style={{ 
                                                                color: '#FFA726',
                                                                fontSize: '16px',
                                                                cursor: 'help'
                                                            }}
                                                            title="Indoor power profile data unavailable, using outdoor power profile."
                                                        >
                                                            ⚠️
                                                        </span>
                                                    )}
                                                    <a 
                                                        href={`https://systm.wahoofitness.com/content-details/${row.id}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{
                                                            color: '#4CAF50',
                                                            textDecoration: 'none',
                                                            fontSize: '14px',
                                                            padding: '2px 4px',
                                                            borderRadius: '3px',
                                                            transition: 'background-color 0.2s',
                                                            display: 'inline-flex',
                                                            alignItems: 'center'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.backgroundColor = 'rgba(76, 175, 80, 0.2)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.backgroundColor = 'transparent';
                                                        }}
                                                        title={`View ${row.name} on SYSTM`}
                                                    >
                                                        ↗
                                                    </a>
                                                </div>
                                                <div style={{ color: '#999', fontSize: '12px', marginTop: '4px' }}>
                                                    ID: {row.id}
                                                </div>
                                                
                                                {/* Workout Profile Chart */}
                                                {row.workoutData && row.metrics && (
                                                    <div style={{
                                                        backgroundColor: '#1a1a1a',
                                                        borderRadius: '6px',
                                                        padding: '8px',
                                                        marginTop: '12px'
                                                    }}>
                                                        <WorkoutChart
                                                            workoutData={row.workoutData}
                                                            userProfile={userProfile}
                                                            height={60}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ padding: '15px', color: 'white', textAlign: 'center', verticalAlign: 'middle' }}>
                                            {row.metrics ? formatDuration(row.metrics.duration) : 'N/A'}
                                        </td>
                                        <td style={{ padding: '15px', color: 'white', textAlign: 'center', verticalAlign: 'middle' }}>
                                            {row.metrics ? Math.round(row.metrics.tss) : 'N/A'}
                                        </td>
                                        <td style={{ padding: '15px', color: 'white', textAlign: 'center', verticalAlign: 'middle' }}>
                                            {row.metrics ? row.metrics.intensityFactor.toFixed(2) : 'N/A'}
                                        </td>
                                        <td style={{ padding: '15px', color: 'white', textAlign: 'center', verticalAlign: 'middle' }}>
                                            {row.metrics ? Math.round(row.metrics.normalizedPower) + 'W' : 'N/A'}
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