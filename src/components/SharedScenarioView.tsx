import React, { useState, useEffect } from 'react';
import { WorkoutSelection, Scenario } from '../types/scenario';
import { UserPowerProfile } from '../types/userProfile';
import ReorderableWorkoutList from './ReorderableWorkoutList';
import { calculateCombinedMetricsDynamic, formatDuration, generateScenarioId } from '../utils/scenarioHelpers';
import allWorkouts from '../data/workouts.json';
import styles from './SharedScenarioView.module.css';

interface SharedScenarioViewProps {
    workoutIds: string[];
    scenarioName: string;
    onSaveAsScenario?: (scenario: Scenario) => void;
    onBackToApp?: () => void;
    userProfile: UserPowerProfile;
}

const SharedScenarioView: React.FC<SharedScenarioViewProps> = ({
    workoutIds,
    scenarioName,
    onSaveAsScenario,
    onBackToApp,
    userProfile
}) => {
    const [workouts, setWorkouts] = useState<WorkoutSelection[]>([]);
    const [loading, setLoading] = useState(true);
    const [dynamicMetrics, setDynamicMetrics] = useState({
        totalDuration: 0,
        totalElapsedDuration: 0,
        totalTSS: 0,
        averageIF: 0,
        totalNP: 0
    });
    const [targetMetrics, setTargetMetrics] = useState({
        totalTargetTSS: 0,
        averageTargetIF: 0
    });
    const [saveAsName, setSaveAsName] = useState(scenarioName || 'Shared Challenge');

    const findWorkoutTitle = (contentId: string): string => {
        const workout = allWorkouts.data.library.content.find((item: any) => item.id === contentId);
        return workout?.name || 'Unknown Workout';
    };

    useEffect(() => {
        const loadSharedScenario = async () => {
            try {
                // Convert workout IDs to WorkoutSelection format
                const workoutSelections: WorkoutSelection[] = workoutIds.map(id => ({
                    id,
                    name: findWorkoutTitle(id),
                    metrics: null // These will be loaded dynamically
                }));

                setWorkouts(workoutSelections);

                // Calculate metrics dynamically
                const metrics = await calculateCombinedMetricsDynamic(workoutSelections, userProfile);
                setDynamicMetrics(metrics);

                // Calculate target metrics based on user's target intensity
                const targetIntensity = userProfile.targetIntensity / 100; // Convert percentage to decimal
                const totalTargetTSS = metrics.totalTSS * targetIntensity;
                const averageTargetIF = metrics.averageIF * targetIntensity;

                setTargetMetrics({
                    totalTargetTSS,
                    averageTargetIF
                });

                setLoading(false);
            } catch (error) {
                console.error('Error loading shared scenario:', error);
                setLoading(false);
            }
        };

        if (workoutIds.length > 0) {
            loadSharedScenario();
        }
    }, [workoutIds, userProfile]);

    const handleSaveAs = () => {
        if (!saveAsName.trim()) {
            alert('Please enter a name for your scenario');
            return;
        }

        const newScenario: Scenario = {
            id: generateScenarioId(),
            name: saveAsName.trim(),
            workouts,
            createdAt: new Date().toISOString()
        };

        onSaveAsScenario?.(newScenario);
        alert(`Scenario "${saveAsName}" has been saved to your collection!`);
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.loadingContent}>
                    <h2 className={styles.loadingTitle}>Loading shared challenge...</h2>
                </div>
            </div>
        );
    }

    if (workouts.length === 0) {
        return (
            <div className={styles.invalidContainer}>
                <div className={styles.invalidContent}>
                    <h2 className={styles.invalidTitle}>Invalid Share Link</h2>
                    <p className={styles.invalidText}>
                        This share link appears to be invalid or the workouts could not be loaded.
                    </p>
                    <button
                        onClick={onBackToApp}
                        className={`${styles.button} ${styles.primaryButton}`}
                    >
                        Back to App
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.headerSection}>
                <div className={styles.headerContainer}>
                    {/* Back Button */}
                    <button
                        onClick={onBackToApp}
                        className={styles.backButton}
                    >
                        ← Back to App
                    </button>

                    {/* Title and Share Info */}
                    <div className={styles.shareInfoCard}>
                        <div className={styles.shareInfoHeader}>
                            <div className={styles.shareInfoIcon}>🔗</div>
                            <h1 className={styles.shareInfoTitle}>Shared Challenge: {scenarioName}</h1>
                        </div>
                        <p className={styles.shareInfoDescription}>
                            Someone shared this Knight of Sufferlandria challenge with you. 
                            You can view the workout details and save it to your own collection.
                        </p>

                        {/* Save As Section */}
                        <div className={styles.saveAsSection}>
                            <label className={styles.saveAsLabel}>
                                Save as:
                            </label>
                            <input
                                type="text"
                                value={saveAsName}
                                onChange={(e) => setSaveAsName(e.target.value)}
                                placeholder="Enter scenario name"
                                className={styles.saveAsInput}
                            />
                            <button
                                onClick={handleSaveAs}
                                className={styles.saveAsButton}
                            >
                                💾 Save to My Scenarios
                            </button>
                        </div>
                    </div>

                    {/* Metrics Overview */}
                    <div className={styles.metricsGrid}>
                        <div className={`${styles.metricCard} ${styles.metricCardDuration}`}>
                            <div className={`${styles.metricLabel} ${styles.colorDuration}`}>
                                Total Duration
                            </div>
                            <div className={styles.metricValue}>
                                {formatDuration(dynamicMetrics.totalDuration)}
                            </div>
                        </div>

                        <div className={`${styles.metricCard} ${styles.metricCardElapsed}`}>
                            <div className={`${styles.metricLabel} ${styles.colorElapsed}`}>
                                Total Elapsed Duration
                            </div>
                            <div className={styles.metricValue}>
                                {formatDuration(dynamicMetrics.totalElapsedDuration)}
                            </div>
                            <div className={styles.metricSubtext}>
                                Includes rest periods
                            </div>
                        </div>

                        <div className={`${styles.metricCard} ${styles.metricCardTss}`}>
                            <div className={`${styles.metricLabel} ${styles.colorTss}`}>
                                Total TSS®
                            </div>
                            <div className={styles.metricValue}>
                                {Math.round(dynamicMetrics.totalTSS)}
                            </div>
                        </div>

                        <div className={`${styles.metricCard} ${styles.metricCardIf}`}>
                            <div className={`${styles.metricLabel} ${styles.colorIf}`}>
                                Average IF®
                            </div>
                            <div className={styles.metricValue}>
                                {dynamicMetrics.averageIF.toFixed(2)}
                            </div>
                        </div>

                        <div className={`${styles.metricCard} ${styles.metricCardNp}`}>
                            <div className={`${styles.metricLabel} ${styles.colorNp}`}>
                                Average NP®
                            </div>
                            <div className={styles.metricValue}>
                                {Math.round(dynamicMetrics.totalNP)}W
                            </div>
                        </div>

                        <div className={`${styles.metricCard} ${styles.metricCardTargetTss}`}>
                            <div className={`${styles.metricLabel} ${styles.colorTargetTss}`}>
                                Target TSS® ({userProfile.targetIntensity}%)
                            </div>
                            <div className={styles.metricValue}>
                                {Math.round(targetMetrics.totalTargetTSS)}
                            </div>
                        </div>

                        <div className={`${styles.metricCard} ${styles.metricCardTargetIf}`}>
                            <div className={`${styles.metricLabel} ${styles.colorTargetIf}`}>
                                Target IF® ({userProfile.targetIntensity}%)
                            </div>
                            <div className={styles.metricValue}>
                                {targetMetrics.averageTargetIF.toFixed(2)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Workout List */}
            <ReorderableWorkoutList
                title="Arsenal of SUFFERING"
                subtitle="The 10 instruments of pain in this shared quest (read-only)"
                workouts={workouts}
                onReorder={() => {}} // Read-only, no reordering
                userProfile={userProfile}
            />
        </div>
    );
};

export default SharedScenarioView;