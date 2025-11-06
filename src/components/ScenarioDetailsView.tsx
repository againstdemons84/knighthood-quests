import React, { useState, useEffect } from 'react';
import { Scenario } from '../types/scenario';
import { UserPowerProfile } from '../types/userProfile';
import { formatDuration } from '../utils/scenarioHelpers';
import { calculateAllTrainingMetrics } from '../utils/trainingMetrics';
import { WorkoutData } from '../types/workout';
import WorkoutTable from './WorkoutTable';
import allWorkouts from '../data/workouts.json';
import { getBestWorkoutData } from '../utils/workoutDataHelpers';

interface ScenarioDetailsViewProps {
    scenario: Scenario;
    userProfile: UserPowerProfile;
    onBack: () => void;
}

interface ScenarioWorkoutRow {
    id: string;
    name: string;
    workoutData: WorkoutData | null;
    metrics: {
        duration: string;
        tss: number;
        intensityFactor: number;
        normalizedPower: number;
    } | null;
    error?: string;
    usedOutdoorData?: boolean;
}

const ScenarioDetailsView: React.FC<ScenarioDetailsViewProps> = ({
    scenario,
    userProfile,
    onBack
}) => {
    const [workoutRows, setWorkoutRows] = useState<ScenarioWorkoutRow[]>([]);
    const [loading, setLoading] = useState(true);

    const findWorkoutTitle = (contentId: string): string => {
        const workout = allWorkouts.data.library.content.find((item: any) => item.id === contentId);
        return workout?.name || 'Unknown Workout';
    };

    const loadWorkoutData = async (workoutId: string): Promise<{ data: WorkoutData | null; usedOutdoor: boolean }> => {
        try {
            const response = await fetch(`/data/workouts/${workoutId}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load workout data for ${workoutId}`);
            }
            const rawData = await response.json();
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

    const formatDurationFromSeconds = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
    };

    useEffect(() => {
        const loadScenarioWorkouts = async () => {
            const rows: ScenarioWorkoutRow[] = [];

            for (const workout of scenario.workouts) {
                const title = findWorkoutTitle(workout.id);
                const workoutResult = await loadWorkoutData(workout.id);
                
                let metrics = null;
                if (workoutResult.data) {
                    try {
                        const calculatedMetrics = calculateAllTrainingMetrics(workoutResult.data, userProfile);
                        metrics = {
                            duration: formatDurationFromSeconds(calculatedMetrics.duration),
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
                    usedOutdoorData: workoutResult.usedOutdoor
                });
            }

            setWorkoutRows(rows);
            setLoading(false);
        };

        loadScenarioWorkouts();
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
                            {formatDuration(scenario.combinedMetrics.totalDuration)}
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
                            {Math.round(scenario.combinedMetrics.totalTSS)}
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
                            {scenario.combinedMetrics.averageIF.toFixed(2)}
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
                            {Math.round(scenario.combinedMetrics.totalNP)}W
                        </div>
                    </div>
                </div>
            </div>

            {/* Workout Table */}
            <WorkoutTable
                workoutRows={workoutRows}
                userProfile={userProfile}
                title={`${scenario.name} - Challenge Workouts`}
                subtitle={`${scenario.workouts.length} workouts selected for your Knight of Sufferlandria challenge`}
                showWorkoutProfiles={true}
            />
        </div>
    );
};

export default ScenarioDetailsView;