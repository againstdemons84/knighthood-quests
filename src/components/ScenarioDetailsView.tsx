import React, { useState, useEffect } from 'react';
import { Scenario, WorkoutSelection } from '../types/scenario';
import { UserPowerProfile } from '../types/userProfile';
import { formatDuration, calculateCombinedMetricsDynamic, loadScenarios, saveScenarios } from '../utils/scenarioHelpers';
import ReorderableWorkoutList from './ReorderableWorkoutList';

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
    const [loading, setLoading] = useState(true);
    const [dynamicMetrics, setDynamicMetrics] = useState({
        totalDuration: 0,
        totalElapsedDuration: 0,
        totalTSS: 0,
        averageIF: 0,
        totalNP: 0
    });



    const handleWorkoutReorder = (reorderedWorkouts: WorkoutSelection[]) => {
        const updatedScenario: Scenario = {
            ...scenario,
            workouts: reorderedWorkouts
        };

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
        const loadScenarioMetrics = async () => {
            // Calculate dynamic metrics for the scenario
            try {
                const calculatedMetrics = await calculateCombinedMetricsDynamic(scenario.workouts, userProfile);
                setDynamicMetrics(calculatedMetrics);
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
            <div style={{ backgroundColor: '#1a1a1a', minHeight: '100vh', padding: '20px' }}>
                <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', paddingTop: '100px' }}>
                    <h1 style={{ color: 'white', marginBottom: '20px' }}>Loading Scenario Details...</h1>
                    <p style={{ color: '#999' }}>Loading workout data for "{scenario.name}"...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: '#1a1a1a', minHeight: '100vh', padding: '20px' }}>
            {/* Header with Back Button */}
            <div style={{ maxWidth: '1400px', margin: '0 auto', marginBottom: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                    <button
                        onClick={onBack}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#555',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        ← Back to Scenarios
                    </button>
                    <div>
                        <h1 style={{ color: 'white', margin: 0, fontSize: '24px' }}>
                            {scenario.name}
                        </h1>
                        <div style={{ color: '#999', fontSize: '14px', marginTop: '5px' }}>
                            Created: {new Date(scenario.createdAt).toLocaleDateString()} • 
                            {scenario.workouts.length} workouts
                        </div>
                    </div>
                </div>

                {/* Scenario Summary Cards */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '20px',
                    marginBottom: '30px'
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

            {/* Reorderable Workout List */}
            <ReorderableWorkoutList
                workouts={scenario.workouts}
                userProfile={userProfile}
                onReorder={handleWorkoutReorder}
                title={`${scenario.name} - Challenge Workouts`}
                subtitle={`Drag and drop to reorder your ${scenario.workouts.length} Knight of Sufferlandria challenge workouts`}
            />
        </div>
    );
};

export default ScenarioDetailsView;