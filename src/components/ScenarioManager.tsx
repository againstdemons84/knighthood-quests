import React, { useState, useEffect } from 'react';
import { Scenario } from '../types/scenario';
import { UserPowerProfile } from '../types/userProfile';
import { loadScenarios, saveScenarios, formatDuration, calculateCombinedMetricsDynamic } from '../utils/scenarioHelpers';
import { useViewport } from '../hooks/useViewport';
import PrintQuestModal from './PrintQuestModal';
import styles from './ScenarioManager.module.css';
import ScenarioComparison from './ScenarioComparison';

interface ScenarioManagerProps {
    onEditScenario: (scenario: Scenario) => void;
    onViewScenario?: (scenario: Scenario) => void;
    onScenariosChange?: (scenarios: Scenario[]) => void;
    userProfile: UserPowerProfile;
}

interface ScenarioWithMetrics extends Scenario {
    dynamicMetrics: {
        totalDuration: number;
        totalElapsedDuration: number;
        totalTSS: number;
        averageIF: number;
        totalNP: number;
    };
}

const ScenarioManager: React.FC<ScenarioManagerProps> = ({ onEditScenario, onViewScenario, onScenariosChange, userProfile }) => {
    const viewport = useViewport();
    const [scenarios, setScenarios] = useState<Scenario[]>([]);
    const [scenariosWithMetrics, setScenariosWithMetrics] = useState<ScenarioWithMetrics[]>([]);
    const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
    const [selectedScenarios, setSelectedScenarios] = useState<Set<string>>(new Set());
    const [sortBy, setSortBy] = useState<'name' | 'created' | 'duration' | 'elapsed' | 'tss' | 'if'>('created');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [showPrintModal, setShowPrintModal] = useState<Scenario | null>(null);

    useEffect(() => {
        const loadScenariosWithDynamicMetrics = async () => {
            setIsLoadingMetrics(true);
            const savedScenarios = loadScenarios();
            setScenarios(savedScenarios);
            
            // Calculate dynamic metrics for each scenario
            const scenariosWithDynamics: ScenarioWithMetrics[] = [];
            
            for (const scenario of savedScenarios) {
                try {
                    const dynamicMetrics = await calculateCombinedMetricsDynamic(scenario.workouts, userProfile);
                    scenariosWithDynamics.push({
                        ...scenario,
                        dynamicMetrics
                    });
                } catch (error) {
                    console.error(`Failed to calculate metrics for scenario ${scenario.id}:`, error);
                    // Use zero metrics as fallback
                    scenariosWithDynamics.push({
                        ...scenario,
                        dynamicMetrics: {
                            totalDuration: 0,
                            totalElapsedDuration: 0,
                            totalTSS: 0,
                            averageIF: 0,
                            totalNP: 0
                        }
                    });
                }
            }
            
            setScenariosWithMetrics(scenariosWithDynamics);
            setIsLoadingMetrics(false);
        };
        
        loadScenariosWithDynamicMetrics();
    }, [userProfile]);

    const handleSort = (column: 'name' | 'created' | 'duration' | 'elapsed' | 'tss' | 'if') => {
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

    const deleteScenario = (scenarioId: string) => {
        if (window.confirm('Are you sure you want to delete this scenario?')) {
            const updatedScenarios = scenarios.filter(s => s.id !== scenarioId);
            const updatedScenariosWithMetrics = scenariosWithMetrics.filter(s => s.id !== scenarioId);
            
            setScenarios(updatedScenarios);
            setScenariosWithMetrics(updatedScenariosWithMetrics);
            saveScenarios(updatedScenarios);
            onScenariosChange?.(updatedScenarios);
            setSelectedScenarios(prev => {
                const newSet = new Set(prev);
                newSet.delete(scenarioId);
                return newSet;
            });
        }
    };

    const duplicateScenario = async (scenario: Scenario | ScenarioWithMetrics) => {
        const duplicatedScenario: Scenario = {
            id: `scenario_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            name: `${scenario.name} (Copy)`,
            createdAt: new Date().toISOString(),
            workouts: scenario.workouts,
            combinedMetrics: scenario.combinedMetrics
        };
        
        const updatedScenarios = [...scenarios, duplicatedScenario];
        setScenarios(updatedScenarios);
        saveScenarios(updatedScenarios);
        onScenariosChange?.(updatedScenarios);
        
        // Also calculate metrics for the duplicated scenario and update the metrics state
        try {
            const dynamicMetrics = await calculateCombinedMetricsDynamic(duplicatedScenario.workouts, userProfile);
            const duplicatedScenarioWithMetrics: ScenarioWithMetrics = {
                ...duplicatedScenario,
                dynamicMetrics
            };
            
            setScenariosWithMetrics(prev => [...prev, duplicatedScenarioWithMetrics]);
        } catch (error) {
            console.error('Error calculating metrics for duplicated scenario:', error);
            // Fallback: add scenario with zero metrics
            const duplicatedScenarioWithMetrics: ScenarioWithMetrics = {
                ...duplicatedScenario,
                dynamicMetrics: {
                    totalDuration: 0,
                    totalElapsedDuration: 0,
                    totalTSS: 0,
                    averageIF: 0,
                    totalNP: 0
                }
            };
            setScenariosWithMetrics(prev => [...prev, duplicatedScenarioWithMetrics]);
        }
    };

    const shareScenario = (scenario: Scenario) => {
        const workoutIds = scenario.workouts.map(w => w.id).join(',');
        const shareUrl = `${window.location.origin}${window.location.pathname}#shared/${workoutIds}/${encodeURIComponent(scenario.name)}`;
        
        // Copy to clipboard
        navigator.clipboard.writeText(shareUrl).then(() => {
            // Show temporary success message
            alert(`Share link copied to clipboard!\n\nAnyone with this link can view and save "${scenario.name}" to their own scenarios.`);
        }).catch(() => {
            // Fallback: show the URL in a prompt for manual copying
            prompt('Copy this link to share your scenario:', shareUrl);
        });
    };

    const toggleScenarioSelection = (scenarioId: string) => {
        setSelectedScenarios(prev => {
            const newSet = new Set(prev);
            if (newSet.has(scenarioId)) {
                newSet.delete(scenarioId);
            } else {
                newSet.add(scenarioId);
            }
            return newSet;
        });
    };

    const clearSelection = () => {
        setSelectedScenarios(new Set());
    };

    const sortedScenarios = [...scenariosWithMetrics].sort((a, b) => {
        let aValue, bValue;
        
        switch (sortBy) {
            case 'name':
                aValue = a.name;
                bValue = b.name;
                break;
            case 'created':
                aValue = new Date(a.createdAt).getTime();
                bValue = new Date(b.createdAt).getTime();
                break;
            case 'duration':
                aValue = a.dynamicMetrics.totalDuration;
                bValue = b.dynamicMetrics.totalDuration;
                break;
            case 'elapsed':
                aValue = a.dynamicMetrics.totalElapsedDuration;
                bValue = b.dynamicMetrics.totalElapsedDuration;
                break;
            case 'tss':
                aValue = a.dynamicMetrics.totalTSS;
                bValue = b.dynamicMetrics.totalTSS;
                break;
            case 'if':
                aValue = a.dynamicMetrics.averageIF;
                bValue = b.dynamicMetrics.averageIF;
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

    const selectedScenariosList = scenariosWithMetrics.filter(s => selectedScenarios.has(s.id));

    // Mobile card layout
    const renderMobileLayout = () => (
        <div className={styles.containerMobile}>
                <h1 className={styles.titleMobile}>
                    My Paths to KNIGHTHOOD
                </h1>
                <p className={styles.subtitleMobile}>
                    Manage your various quests and recipes for SUFFERING
                </p>            {isLoadingMetrics && (
                <div className={styles.loadingContainerMobile}>
                    <div className={styles.loadingTextLarge}>
                        📊 Calculating metrics...
                    </div>
                    <div className={styles.loadingTextSmall}>
                        Loading workout data
                    </div>
                </div>
            )}

            {scenariosWithMetrics.length === 0 && !isLoadingMetrics ? (
                <div className={styles.emptyStateMobile}>
                    <div className={styles.emptyIcon}>🏆</div>
                    <h3 className={styles.emptyTitle}>No Scenarios Yet</h3>
                    <p className={styles.emptyDescription}>
                        Create your first Knighthood challenge by selecting 10 workouts in the "Plan Challenge" tab.
                    </p>
                </div>
            ) : (
                <>
                    {/* Sort Controls */}
                    <div className={styles.controlsMobile}>
                        <div className={styles.sortControls}>
                            <span className={styles.sortLabel}>Sort:</span>
                            {(['name', 'created', 'duration', 'tss'] as const).map(col => (
                                <button
                                    key={col}
                                    onClick={() => handleSort(col)}
                                    className={`${styles.sortButton} ${
                                        sortBy === col ? styles.sortButtonActive : styles.sortButtonInactive
                                    }`}
                                >
                                    {col === 'name' ? 'Name' : 
                                     col === 'created' ? 'Date' :
                                     col === 'duration' ? 'Duration' : 'TSS®'}
                                    {sortBy === col && getSortIcon(col)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Scenario Cards */}
                    <div className={styles.scenarioListMobile}>
                        {sortedScenarios.map((scenario, index) => (
                            <div key={scenario.id} className={styles.scenarioCardMobile}>
                                {/* Header */}
                                <div className={styles.scenarioHeader}>
                                    <h3 className={styles.scenarioTitle}>
                                        {scenario.name}
                                    </h3>
                                    <div className={styles.scenarioDate}>
                                        Created: {new Date(scenario.createdAt).toLocaleDateString()}
                                    </div>
                                </div>

                                {/* Metrics Grid */}
                                <div className={styles.metricsGrid}>
                                    <div className={styles.metricItem}>
                                        <div className={styles.metricLabelDuration}>Duration</div>
                                        <div className={styles.metricValue}>
                                            {formatDuration(scenario.dynamicMetrics.totalDuration)}
                                        </div>
                                    </div>
                                    <div className={styles.metricItem}>
                                        <div className={styles.metricLabelTSS}>TSS®</div>
                                        <div className={styles.metricValue}>
                                            {Math.round(scenario.dynamicMetrics.totalTSS)}
                                        </div>
                                    </div>
                                    <div className={styles.metricItem}>
                                        <div className={styles.metricLabelIF}>Avg IF®</div>
                                        <div className={styles.metricValue}>
                                            {scenario.dynamicMetrics.averageIF.toFixed(2)}
                                        </div>
                                    </div>
                                    <div className={styles.metricItem}>
                                        <div className={styles.metricLabelWorkouts}>Workouts</div>
                                        <div className={styles.metricValue}>
                                            {scenario.workouts.length}/10
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className={styles.actionButtonsMobile}>
                                    <button
                                        data-testid={`view-scenario-${scenario.id}`}
                                        onClick={() => onViewScenario?.(scenario)}
                                        className={`${styles.actionButtonMobile} ${styles.viewButtonMobile}`}
                                    >
                                        👁️ View
                                    </button>
                                    <button
                                        data-testid={`edit-scenario-${scenario.id}`}
                                        onClick={() => onEditScenario(scenario)}
                                        className={`${styles.actionButtonMobile} ${styles.editButtonMobile}`}
                                    >
                                        ✏️ Edit
                                    </button>
                                    <button
                                        data-testid={`print-scenario-${scenario.id}`}
                                        onClick={() => setShowPrintModal(scenario)}
                                        className={`${styles.actionButtonMobile} ${styles.printButtonMobile}`}
                                    >
                                        🖨️ Print
                                    </button>
                                    <button
                                        data-testid={`share-scenario-${scenario.id}`}
                                        onClick={() => shareScenario(scenario)}
                                        className={`${styles.actionButtonMobile} ${styles.shareButtonMobile}`}
                                    >
                                        🔗 Share
                                    </button>
                                    <button
                                        data-testid={`duplicate-scenario-${scenario.id}`}
                                        onClick={() => duplicateScenario(scenario)}
                                        className={`${styles.actionButtonMobile} ${styles.duplicateButtonMobile}`}
                                    >
                                        📋 Copy
                                    </button>
                                    <button
                                        data-testid={`delete-scenario-${scenario.id}`}
                                        onClick={() => deleteScenario(scenario.id)}
                                        className={`${styles.actionButtonMobile} ${styles.deleteButtonMobile}`}
                                    >
                                        🗑️ Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
            
            {/* Print Modal */}
            {showPrintModal && (
                <PrintQuestModal
                    scenario={showPrintModal}
                    userProfile={userProfile}
                    onClose={() => setShowPrintModal(null)}
                />
            )}
        </div>
    );

    return viewport.isMobile ? renderMobileLayout() : (
        <div className={styles.containerDesktop}>
            <div className={styles.containerInner}>
                <h1 className={styles.titleDesktop}>
                    Your Arsenal of KNIGHTHOOD Quests
                </h1>
                <p className={styles.subtitleDesktop}>
                    Manage and compare your different recipes for SUFFERING in pursuit of the highest HONOUR in Sufferlandria
                </p>

                {isLoadingMetrics && (
                    <div className={styles.loadingContainerDesktop}>
                        <div className={styles.loadingTextLargeDesktop}>
                            📊 Calculating workout metrics dynamically...
                        </div>
                        <div className={styles.loadingTextSmallDesktop}>
                            Loading duration, TSS, and intensity data from workout files
                        </div>
                    </div>
                )}

                {/* Enhanced Comparison Section with Chart */}
                {selectedScenarios.size > 0 && (
                    <>
                        {/* Chart-based comparison */}
                        <ScenarioComparison
                            scenarios={selectedScenariosList}
                            userProfile={userProfile}
                            onClearSelection={clearSelection}
                        />
                        {/* Legacy table comparison for reference (optional, can remove later) */}
                        <div className={styles.comparisonTableContainer}>
                            <table className={styles.comparisonTable}>
                                <thead>
                                    <tr className={styles.comparisonTableHeader}>
                                        <th className={styles.comparisonTableHeaderCell}>Scenario</th>
                                        <th className={`${styles.comparisonTableHeaderCell} ${styles.comparisonTableHeaderCellCenter}`}>Duration</th>
                                        <th className={`${styles.comparisonTableHeaderCell} ${styles.comparisonTableHeaderCellCenter}`}>TSS®</th>
                                        <th className={`${styles.comparisonTableHeaderCell} ${styles.comparisonTableHeaderCellCenter}`}>Avg IF®</th>
                                        <th className={`${styles.comparisonTableHeaderCell} ${styles.comparisonTableHeaderCellCenter}`}>Avg NP®</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedScenariosList.map((scenario, index) => (
                                        <tr 
                                            key={scenario.id}
                                            className={`${styles.comparisonTableRow} ${
                                                index % 2 === 0 ? styles.comparisonTableRowEven : styles.comparisonTableRowOdd
                                            }`}
                                        >
                                            <td className={styles.comparisonTableCell}>
                                                <strong>{scenario.name}</strong>
                                            </td>
                                            <td className={`${styles.comparisonTableCell} ${styles.comparisonTableCellCenter}`}>
                                                {formatDuration(scenario.dynamicMetrics.totalDuration)}
                                            </td>
                                            <td className={`${styles.comparisonTableCell} ${styles.comparisonTableCellCenter}`}>
                                                {Math.round(scenario.dynamicMetrics.totalTSS)}
                                            </td>
                                            <td className={`${styles.comparisonTableCell} ${styles.comparisonTableCellCenter}`}>
                                                {scenario.dynamicMetrics.averageIF.toFixed(2)}
                                            </td>
                                            <td className={`${styles.comparisonTableCell} ${styles.comparisonTableCellCenter}`}>
                                                {Math.round(scenario.dynamicMetrics.totalNP)}W
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* Controls */}
                <div className={styles.controlsSection}>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className={styles.sortSelect}
                    >
                        <option value="created">Sort by Created Date</option>
                        <option value="name">Sort by Name</option>
                        <option value="duration">Sort by Duration</option>
                        <option value="elapsed">Sort by Elapsed Duration</option>
                        <option value="tss">Sort by TSS</option>
                        <option value="if">Sort by IF</option>
                    </select>
                    
                    <button
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className={styles.sortOrderButton}
                    >
                        {sortOrder === 'asc' ? '↑' : '↓'}
                    </button>

                    {selectedScenarios.size > 0 && (
                        <div className={styles.selectionInfo}>
                            {selectedScenarios.size} scenario{selectedScenarios.size > 1 ? 's' : ''} selected for comparison
                        </div>
                    )}
                </div>

                {/* Scenarios List */}
                {scenarios.length === 0 ? (
                    <div className={styles.emptyStateDesktopAlt}>
                        <h3 className={styles.emptyTitleDesktop}>No Scenarios Yet</h3>
                        <p className={styles.emptyDescriptionDesktop}>
                            Forge your first path to KNIGHTHOOD by assembling an arsenal of 10 instruments of SUFFERING.
                        </p>
                    </div>
                ) : (
                    <div className={styles.mainTableContainer}>
                        <table className={styles.mainTable}>
                            <thead>
                                <tr className={styles.mainTableHeader}>
                                    <th className={`${styles.mainTableHeaderCell} ${styles.mainTableHeaderCellCenter} ${styles.mainTableHeaderCellCheckbox}`}>
                                        Compare
                                    </th>
                                    <th 
                                        className={`${styles.mainTableHeaderCell} ${styles.mainTableHeaderCellSortable}`}
                                        onClick={() => handleSort('name')}
                                    >
                                        Scenario {getSortIcon('name')}
                                    </th>
                                    <th className={`${styles.mainTableHeaderCell} ${styles.mainTableHeaderCellCenter}`}>
                                        Workouts
                                    </th>
                                    <th 
                                        className={`${styles.mainTableHeaderCell} ${styles.mainTableHeaderCellCenter} ${styles.mainTableHeaderCellSortable}`}
                                        onClick={() => handleSort('duration')}
                                    >
                                        Workout Duration {getSortIcon('duration')}
                                    </th>
                                    <th 
                                        className={`${styles.mainTableHeaderCell} ${styles.mainTableHeaderCellCenter} ${styles.mainTableHeaderCellSortable}`}
                                        onClick={() => handleSort('elapsed')}
                                    >
                                        Elapsed Duration {getSortIcon('elapsed')}
                                    </th>
                                    <th 
                                        className={`${styles.mainTableHeaderCell} ${styles.mainTableHeaderCellCenter} ${styles.mainTableHeaderCellSortable}`}
                                        onClick={() => handleSort('tss')}
                                    >
                                        TSS® {getSortIcon('tss')}
                                    </th>
                                    <th 
                                        className={`${styles.mainTableHeaderCell} ${styles.mainTableHeaderCellCenter} ${styles.mainTableHeaderCellSortable}`}
                                        onClick={() => handleSort('if')}
                                    >
                                        Avg IF® {getSortIcon('if')}
                                    </th>
                                    <th className={`${styles.mainTableHeaderCell} ${styles.mainTableHeaderCellCenter}`}>
                                        Avg NP®
                                    </th>
                                    <th className={`${styles.mainTableHeaderCell} ${styles.mainTableHeaderCellCenter}`}>
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedScenarios.map((scenario, index) => {
                                    const isSelected = selectedScenarios.has(scenario.id);
                                    const isLastRow = index >= sortedScenarios.length - 1;
                                    
                                    return (
                                        <tr 
                                            key={scenario.id}
                                            className={`${styles.mainTableRow} ${
                                                isSelected ? styles.mainTableRowSelected : 
                                                (index % 2 === 0 ? styles.mainTableRowEven : styles.mainTableRowOdd)
                                            } ${isLastRow ? styles.mainTableRowLast : ''}`}
                                        >
                                            <td className={`${styles.mainTableCell} ${styles.mainTableCellCenter}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleScenarioSelection(scenario.id)}
                                                    className={styles.scenarioCheckbox}
                                                />
                                            </td>
                                            <td className={`${styles.mainTableCell} ${styles.mainTableCellTop}`}>
                                                <div>
                                                    <div className={styles.scenarioNameDesktop}>{scenario.name}</div>
                                                    <div className={styles.scenarioDateDesktop}>
                                                        Created: {new Date(scenario.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={`${styles.mainTableCell} ${styles.mainTableCellCenter}`}>
                                                {scenario.workouts.length}/10
                                            </td>
                                            <td className={`${styles.mainTableCell} ${styles.mainTableCellCenter}`}>
                                                {formatDuration(scenario.dynamicMetrics.totalDuration)}
                                            </td>
                                            <td className={`${styles.mainTableCell} ${styles.mainTableCellCenter}`}>
                                                {formatDuration(scenario.dynamicMetrics.totalElapsedDuration)}
                                            </td>
                                            <td className={`${styles.mainTableCell} ${styles.mainTableCellCenter}`}>
                                                {Math.round(scenario.dynamicMetrics.totalTSS)}
                                            </td>
                                            <td className={`${styles.mainTableCell} ${styles.mainTableCellCenter}`}>
                                                {scenario.dynamicMetrics.averageIF.toFixed(2)}
                                            </td>
                                            <td className={`${styles.mainTableCell} ${styles.mainTableCellCenter}`}>
                                                {Math.round(scenario.dynamicMetrics.totalNP)}W
                                            </td>
                                            <td className={`${styles.mainTableCell} ${styles.mainTableCellCenter}`}>
                                                <div className={styles.actionButtonsDesktopContainer}>
                                                    <button
                                                        data-testid={`view-scenario-${scenario.id}`}
                                                        onClick={() => onViewScenario?.(scenario)}
                                                        className={`${styles.actionButtonDesktop} ${styles.viewButtonDesktop}`}
                                                    >
                                                        View
                                                    </button>
                                                    <button
                                                        onClick={() => onEditScenario(scenario)}
                                                        data-testid={`edit-scenario-${scenario.id}`}
                                                        className={`${styles.actionButtonDesktop} ${styles.editButtonDesktop}`}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => duplicateScenario(scenario)}
                                                        data-testid={`duplicate-scenario-${scenario.id}`}
                                                        className={`${styles.actionButtonDesktop} ${styles.copyButtonDesktop}`}
                                                    >
                                                        Copy
                                                    </button>
                                                    <button
                                                        onClick={() => setShowPrintModal(scenario)}
                                                        data-testid={`print-scenario-${scenario.id}`}
                                                        className={`${styles.actionButtonDesktop} ${styles.printButtonDesktop}`}
                                                    >
                                                        Print
                                                    </button>
                                                    <button
                                                        onClick={() => shareScenario(scenario)}
                                                        data-testid={`share-scenario-${scenario.id}`}
                                                        className={`${styles.actionButtonDesktop} ${styles.shareButtonDesktop}`}
                                                    >
                                                        Share
                                                    </button>
                                                    <button
                                                        onClick={() => deleteScenario(scenario.id)}
                                                        data-testid={`delete-scenario-${scenario.id}`}
                                                        className={`${styles.actionButtonDesktop} ${styles.deleteButtonDesktop}`}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            
            {/* Print Modal */}
            {showPrintModal && (
                <PrintQuestModal
                    scenario={showPrintModal}
                    userProfile={userProfile}
                    onClose={() => setShowPrintModal(null)}
                />
            )}
        </div>
    );
};

export default ScenarioManager;