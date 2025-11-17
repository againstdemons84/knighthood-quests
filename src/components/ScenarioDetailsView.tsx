import React, { useState, useEffect } from 'react';
import { Scenario, WorkoutSelection } from '../types/scenario';
import { UserPowerProfile } from '../types/userProfile';
import { formatDuration, calculateCombinedMetricsDynamic, loadScenarios, saveScenarios } from '../utils/scenarioHelpers';
import ReorderableWorkoutList from './ReorderableWorkoutList';
import ScenarioComparison from './ScenarioComparison';
import { useViewport } from '../hooks/useViewport';
import PrintQuestModal from './PrintQuestModal';
import WorkoutSchedulingModal from './WorkoutSchedulingModal';
import styles from './ScenarioDetailsView.module.css';
import { getTargetIntensity } from '../utils/targetIntensityUtils';
(window as any).DEBUG_TEST = 'ScenarioDetailsView loaded at ' + new Date().toISOString();

interface ScenarioDetailsViewProps {
    scenario: Scenario;
    userProfile: UserPowerProfile;
    onBack: () => void;
    onScenarioUpdate?: (updatedScenario: Scenario) => void;
}



const ScenarioDetailsView: React.FC<ScenarioDetailsViewProps> = ({
    scenario,
    userProfile,
    onBack,
    onScenarioUpdate
}) => {
    const viewport = useViewport();
    const [loading, setLoading] = useState(true);
    const [currentScenario, setCurrentScenario] = useState<Scenario>(scenario);
    const [dynamicMetrics, setDynamicMetrics] = useState({
        totalDuration: 0,
        totalElapsedDuration: 0,
        totalTSS: 0,
        averageIF: 0,
        totalNP: 0
    });
    const [targetMetrics, setTargetMetrics] = useState({
        totalTargetTSS: 0,
        averageTargetIF: 0,
        totalTargetNP: 0
    });
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [showSchedulingModal, setShowSchedulingModal] = useState(false);
    const [honourStage, setHonourStage] = useState(0); // 0: Honour, 1: Glory, 2: Victory, 3: trigger form
    
    // Computed value for target intensity display
    const targetIntensityValue = getTargetIntensity(userProfile);

    const handleHonourClick = () => {
        if (honourStage < 2) {
            setHonourStage(honourStage + 1);
        } else {
            // Stage 2 (Victory) -> trigger the form
            setShowSchedulingModal(true);
            setHonourStage(0); // Reset for next time
        }
    };

    const getHonourButtonText = () => {
        switch (honourStage) {
            case 0: return 'Honour!';
            case 1: return 'Glory!';
            case 2: return 'Victory!';
            default: return 'Honour!';
        }
    };

    const handleWorkoutReorder = (reorderedWorkouts: WorkoutSelection[]) => {
        const updatedScenario: Scenario = {
            ...scenario,
            workouts: reorderedWorkouts
        };

        // Update current scenario state for charts
        setCurrentScenario(updatedScenario);

        // Save to localStorage
        const allScenarios = loadScenarios();
        const scenarioIndex = allScenarios.findIndex(s => s.id === scenario.id);
        
        if (scenarioIndex >= 0) {
            allScenarios[scenarioIndex] = updatedScenario;
            saveScenarios(allScenarios);
            
            // Notify parent component if callback provided
            if (onScenarioUpdate) {
                onScenarioUpdate(updatedScenario);
            }
        }
    };

    useEffect(() => {
        setCurrentScenario(scenario);
    }, [scenario]);

    useEffect(() => {
        const loadScenarioMetrics = async () => {
            // Don't calculate metrics if userProfile isn't properly loaded yet
            if (!userProfile || !userProfile.ftp) {
                setLoading(false);
                return;
            }
            
            // Calculate dynamic metrics for the scenario
            try {
                const calculatedMetrics = await calculateCombinedMetricsDynamic(scenario.workouts, userProfile);
                

                
                setDynamicMetrics(calculatedMetrics);

                // Calculate target metrics using centralized utility
                const targetIntensityValue = getTargetIntensity(userProfile);
                const targetIntensityDecimal = targetIntensityValue / 100;
                

                
                // For target metrics, we need to recalculate with adjusted intensity
                // TSS = IF² × duration_hours × 100, so with target intensity:
                // Target IF = base IF × target intensity ratio
                const baseIF = isNaN(calculatedMetrics.averageIF) ? 0 : calculatedMetrics.averageIF;
                const baseNP = isNaN(calculatedMetrics.totalNP) ? 0 : calculatedMetrics.totalNP;
                const baseDuration = isNaN(calculatedMetrics.totalDuration) ? 0 : calculatedMetrics.totalDuration;
                
                const targetIF = baseIF * targetIntensityDecimal;
                const targetNP = baseNP * targetIntensityDecimal;
                const durationHours = baseDuration / 3600;
                const targetTSS = Math.pow(targetIF, 2) * durationHours * 100;

                const totalTargetTSS = !isFinite(targetTSS) ? 0 : Math.round(targetTSS);
                const averageTargetIF = !isFinite(targetIF) ? 0 : Math.round(targetIF * 100) / 100;
                const totalTargetNP = !isFinite(targetNP) ? 0 : Math.round(targetNP);
                


                setTargetMetrics({
                    totalTargetTSS,
                    averageTargetIF,
                    totalTargetNP
                });
            } catch (error) {
                console.error('Error calculating dynamic metrics:', error);
                // Keep default zero values on error
            }
            
            setLoading(false);
        };

        loadScenarioMetrics();
    }, [scenario, userProfile]);

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.loadingContent}>
                    <h1 className={styles.loadingTitle}>Loading Scenario Details...</h1>
                    <p className={styles.loadingText}>Loading workout data for "{scenario.name}"...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`${styles.container} ${viewport.isMobile ? styles.containerMobile : styles.containerDesktop}`}>
            {/* Header with Back Button */}
            <div className={`${styles.headerContainer} ${viewport.isMobile ? styles.headerContainerMobile : styles.headerContainerDesktop}`}>
                <div className={`${styles.buttonContainer} ${viewport.isMobile ? styles.buttonContainerMobile : styles.buttonContainerDesktop}`}>
                    <button 
                        data-testid="back-button"
                        onClick={onBack}
                        className={`${styles.button} ${styles.backButton} ${viewport.isMobile ? styles.buttonMobile : styles.buttonDesktop}`}
                    >
                        ← Back
                    </button>
                    <button
                        onClick={() => setShowPrintModal(true)}
                        className={`${styles.button} ${styles.printButton} ${viewport.isMobile ? styles.buttonMobile : styles.buttonDesktop}`}
                    >
                        🖨️ Print Quest Plan
                    </button>
                    <button
                        onClick={handleHonourClick}
                        className={`${styles.button} ${styles.honourButton} ${viewport.isMobile ? styles.buttonMobile : styles.buttonDesktop}`}
                    >
                        ⚔️ {getHonourButtonText()}
                    </button>
                </div>

                {/* Scenario Title and Description */}
                <div className={viewport.isMobile ? styles.titleSectionMobile : styles.titleSectionDesktop}>
                    <h1 className={`${styles.title} ${viewport.isMobile ? styles.titleMobile : styles.titleDesktop}`}>
                        {scenario.name} - Arsenal of SUFFERING
                    </h1>
                    <p className={`${styles.subtitle} ${viewport.isMobile ? styles.subtitleMobile : styles.subtitleDesktop}`}>
                        Drag and drop to reorder your {scenario.workouts.length} instruments of pain for KNIGHTHOOD
                    </p>
                </div>

                {/* Scenario Summary Cards */}
                <div className={`${styles.metricsGrid} ${viewport.isMobile ? styles.metricsGridMobile : styles.metricsGridDesktop}`}>
                    <div className={`${styles.metricCard} ${styles.metricCardDuration} ${viewport.isMobile ? styles.metricCardMobile : styles.metricCardDesktop}`}>
                        <div className={`${styles.metricLabel} ${styles.colorDuration} ${viewport.isMobile ? styles.metricLabelMobile : styles.metricLabelDesktop}`}>
                            Duration
                        </div>
                        <div className={`${styles.metricValue} ${viewport.isMobile ? styles.metricValueMobile : styles.metricValueDesktop}`}>
                            {formatDuration(dynamicMetrics.totalDuration)}
                        </div>
                    </div>

                    {!viewport.isMobile && (
                        <div className={`${styles.metricCard} ${styles.metricCardElapsed} ${styles.metricCardDesktop}`}>
                            <div className={`${styles.metricLabel} ${styles.colorElapsed} ${styles.metricLabelDesktop}`}>
                                Total Elapsed Duration
                            </div>
                            <div className={`${styles.metricValue} ${styles.metricValueDesktop}`}>
                                {formatDuration(dynamicMetrics.totalElapsedDuration)}
                            </div>
                            <div className={styles.metricSubtext}>
                                Includes rest periods
                            </div>
                        </div>
                    )}

                    <div className={`${styles.metricCard} ${styles.metricCardTss} ${viewport.isMobile ? styles.metricCardMobile : styles.metricCardDesktop}`}>
                        <div className={`${styles.metricLabel} ${styles.colorTss} ${viewport.isMobile ? styles.metricLabelMobile : styles.metricLabelDesktop}`}>
                            TSS® ({targetIntensityValue}%)
                        </div>
                        <div className={`${styles.metricValue} ${viewport.isMobile ? styles.metricValueMobile : styles.metricValueDesktop}`}>
                            {Math.round(dynamicMetrics.totalTSS)} ({Math.round(targetMetrics.totalTargetTSS)})
                        </div>
                    </div>

                    <div className={`${styles.metricCard} ${styles.metricCardIf} ${viewport.isMobile ? styles.metricCardMobile : styles.metricCardDesktop}`}>
                        <div className={`${styles.metricLabel} ${styles.colorIf} ${viewport.isMobile ? styles.metricLabelMobile : styles.metricLabelDesktop}`}>
                            Avg IF® ({targetIntensityValue}%)
                        </div>
                        <div className={`${styles.metricValue} ${viewport.isMobile ? styles.metricValueMobile : styles.metricValueDesktop}`}>
                            {dynamicMetrics.averageIF.toFixed(2)} ({targetMetrics.averageTargetIF.toFixed(2)})
                        </div>
                    </div>

                    <div className={`${styles.metricCard} ${styles.metricCardNp} ${viewport.isMobile ? styles.metricCardMobile : styles.metricCardDesktop}`}>
                        <div className={`${styles.metricLabel} ${styles.colorNp} ${viewport.isMobile ? styles.metricLabelMobile : styles.metricLabelDesktop}`}>
                            Avg NP® ({targetIntensityValue}%)
                        </div>
                        <div className={`${styles.metricValue} ${viewport.isMobile ? styles.metricValueMobile : styles.metricValueDesktop}`}>
                            {Math.round(dynamicMetrics.totalNP)}W ({Math.round(targetMetrics.totalTargetNP)}W)
                        </div>
                    </div>
                </div>
            </div>

            {/* Scenario Analysis Charts */}
            <div className={styles.chartsSection}>
                <ScenarioComparison
                    scenarios={[currentScenario]}
                    userProfile={userProfile}
                    singleScenarioView={true}
                />
            </div>

            {/* Reorderable Workout List */}
            <ReorderableWorkoutList
                workouts={scenario.workouts}
                userProfile={userProfile}
                onReorder={handleWorkoutReorder}
                title=""
                subtitle=""
            />
            
            {/* Print Modal */}
            {showPrintModal && (
                <PrintQuestModal
                    scenario={scenario}
                    userProfile={userProfile}
                    onClose={() => setShowPrintModal(false)}
                />
            )}

            {/* Workout Scheduling Modal */}
            <WorkoutSchedulingModal
                scenario={currentScenario}
                isOpen={showSchedulingModal}
                onClose={() => setShowSchedulingModal(false)}
            />
        </div>
    );
};

export default ScenarioDetailsView;