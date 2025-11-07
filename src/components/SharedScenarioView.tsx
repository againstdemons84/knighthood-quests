import React, { useState, useEffect } from 'react';
import { WorkoutSelection, Scenario } from '../types/scenario';
import { UserPowerProfile } from '../types/userProfile';
import ReorderableWorkoutList from './ReorderableWorkoutList';
import { calculateCombinedMetricsDynamic, formatDuration, generateScenarioId } from '../utils/scenarioHelpers';
import allWorkouts from '../data/workouts.json';

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
            <div style={{ backgroundColor: '#1a1a1a', minHeight: '100vh', padding: '20px' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto', textAlign: 'center' }}>
                    <h2 style={{ color: 'white' }}>Loading shared challenge...</h2>
                </div>
            </div>
        );
    }

    if (workouts.length === 0) {
        return (
            <div style={{ backgroundColor: '#1a1a1a', minHeight: '100vh', padding: '20px' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto', textAlign: 'center' }}>
                    <h2 style={{ color: 'white' }}>Invalid Share Link</h2>
                    <p style={{ color: '#999', marginBottom: '20px' }}>
                        This share link appears to be invalid or the workouts could not be loaded.
                    </p>
                    <button
                        onClick={onBackToApp}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '16px'
                        }}
                    >
                        Back to App
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: '#1a1a1a', minHeight: '100vh' }}>
            {/* Header */}
            <div style={{ padding: '20px' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    {/* Back Button */}
                    <button
                        onClick={onBackToApp}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#555',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginBottom: '20px',
                            fontSize: '14px'
                        }}
                    >
                        ← Back to App
                    </button>

                    {/* Title and Share Info */}
                    <div style={{
                        backgroundColor: '#2a2a2a',
                        padding: '20px',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        border: '2px solid #9C27B0'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                            <div style={{ fontSize: '24px' }}>🔗</div>
                            <h1 style={{ color: 'white', margin: 0 }}>Shared Challenge: {scenarioName}</h1>
                        </div>
                        <p style={{ color: '#999', margin: '0 0 16px 0' }}>
                            Someone shared this Knight of Sufferlandria challenge with you. 
                            You can view the workout details and save it to your own collection.
                        </p>

                        {/* Save As Section */}
                        <div style={{
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'center',
                            flexWrap: 'wrap'
                        }}>
                            <label style={{ color: 'white', fontSize: '14px' }}>
                                Save as:
                            </label>
                            <input
                                type="text"
                                value={saveAsName}
                                onChange={(e) => setSaveAsName(e.target.value)}
                                placeholder="Enter scenario name"
                                style={{
                                    padding: '8px 12px',
                                    backgroundColor: '#333',
                                    color: 'white',
                                    border: '1px solid #555',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    minWidth: '200px'
                                }}
                            />
                            <button
                                onClick={handleSaveAs}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#4CAF50',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: 'bold'
                                }}
                            >
                                💾 Save to My Scenarios
                            </button>
                        </div>
                    </div>

                    {/* Metrics Overview */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '16px',
                        marginBottom: '20px'
                    }}>
                        <div style={{
                            backgroundColor: '#2a2a2a',
                            padding: '20px',
                            borderRadius: '8px',
                            border: '2px solid #4CAF50',
                            textAlign: 'center'
                        }}>
                            <div style={{ color: '#4CAF50', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                                Total Duration
                            </div>
                            <div style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>
                                {formatDuration(dynamicMetrics.totalDuration)}
                            </div>
                        </div>

                        <div style={{
                            backgroundColor: '#2a2a2a',
                            padding: '20px',
                            borderRadius: '8px',
                            border: '2px solid #FF5722',
                            textAlign: 'center'
                        }}>
                            <div style={{ color: '#FF5722', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                                Total Elapsed Duration
                            </div>
                            <div style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>
                                {formatDuration(dynamicMetrics.totalElapsedDuration)}
                            </div>
                            <div style={{ color: '#999', fontSize: '12px', marginTop: '5px' }}>
                                Includes rest periods
                            </div>
                        </div>

                        <div style={{
                            backgroundColor: '#2a2a2a',
                            padding: '20px',
                            borderRadius: '8px',
                            border: '2px solid #2196F3',
                            textAlign: 'center'
                        }}>
                            <div style={{ color: '#2196F3', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                                Total TSS®
                            </div>
                            <div style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>
                                {Math.round(dynamicMetrics.totalTSS)}
                            </div>
                        </div>

                        <div style={{
                            backgroundColor: '#2a2a2a',
                            padding: '20px',
                            borderRadius: '8px',
                            border: '2px solid #FF9800',
                            textAlign: 'center'
                        }}>
                            <div style={{ color: '#FF9800', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                                Average IF®
                            </div>
                            <div style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>
                                {dynamicMetrics.averageIF.toFixed(2)}
                            </div>
                        </div>

                        <div style={{
                            backgroundColor: '#2a2a2a',
                            padding: '20px',
                            borderRadius: '8px',
                            border: '2px solid #9C27B0',
                            textAlign: 'center'
                        }}>
                            <div style={{ color: '#9C27B0', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                                Average NP®
                            </div>
                            <div style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>
                                {Math.round(dynamicMetrics.totalNP)}W
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Workout List */}
            <ReorderableWorkoutList
                title="Challenge Workouts"
                subtitle="The 10 workouts in this shared challenge (read-only)"
                workouts={workouts}
                onReorder={() => {}} // Read-only, no reordering
                userProfile={userProfile}
            />
        </div>
    );
};

export default SharedScenarioView;