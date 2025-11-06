import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import WorkoutChart from './components/WorkoutChart';
import knighthoodWorkouts from './data/knighthood-workouts.json';
import allWorkouts from './data/workouts.json';
import userData from './data/user.json';
import { calculateAllTrainingMetrics } from './utils/trainingMetrics';
import { WorkoutData } from './types/workout';

interface KnighthoodWorkout {
    id: string;
    name: string;
}

interface WorkoutTableRow {
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
}

const App = () => {
    const [workoutRows, setWorkoutRows] = useState<WorkoutTableRow[]>([]);
    const [loading, setLoading] = useState(true);
    const userProfile = userData.data.impersonateUser.user.profiles.riderProfile;

    const formatDuration = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
    };

    const findWorkoutTitle = (contentId: string): string => {
        const workout = allWorkouts.data.library.content.find((item: any) => item.id === contentId);
        return workout?.name || 'Unknown Workout';
    };

    const loadWorkoutData = async (workoutId: string): Promise<WorkoutData | null> => {
        try {
            // Try to load the workout data from the public directory
            const response = await fetch(`/data/workouts/${workoutId}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load workout data for ${workoutId}`);
            }
            const data = await response.json();
            return data.data?.workoutGraphTriggers?.indoor || null;
        } catch (error) {
            console.error(`Error loading workout ${workoutId}:`, error);
            return null;
        }
    };

    useEffect(() => {
        const loadAllWorkouts = async () => {
            const rows: WorkoutTableRow[] = [];

            for (const workout of knighthoodWorkouts.workouts) {
                const title = findWorkoutTitle(workout.id);
                const workoutData = await loadWorkoutData(workout.id);
                
                let metrics = null;
                if (workoutData) {
                    try {
                        const calculatedMetrics = calculateAllTrainingMetrics(workoutData, userProfile);
                        metrics = {
                            duration: formatDuration(calculatedMetrics.duration),
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
                    workoutData,
                    metrics,
                    error: !workoutData ? 'Workout data not available' : undefined
                });
            }

            setWorkoutRows(rows);
            setLoading(false);
        };

        loadAllWorkouts();
    }, [userProfile]);

    if (loading) {
        return (
            <div style={{ backgroundColor: '#1a1a1a', minHeight: '100vh', padding: '20px' }}>
                <h1 style={{ color: 'white', marginBottom: '20px' }}>Loading Knighthood Workouts...</h1>
                <p style={{ color: '#999' }}>Loading workout data and calculating metrics...</p>
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: '#1a1a1a', minHeight: '100vh', padding: '20px' }}>
            <h1 style={{ color: 'white', marginBottom: '30px', textAlign: 'center' }}>
                Knighthood Workouts ({workoutRows.length} Total)
            </h1>
            
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
                            <th style={{ padding: '15px', color: 'white', textAlign: 'left', borderBottom: '2px solid #444' }}>
                                Workout
                            </th>
                            <th style={{ padding: '15px', color: 'white', textAlign: 'center', borderBottom: '2px solid #444', minWidth: '400px' }}>
                                Workout Profile
                            </th>
                            <th style={{ padding: '15px', color: 'white', textAlign: 'center', borderBottom: '2px solid #444' }}>
                                Duration
                            </th>
                            <th style={{ padding: '15px', color: 'white', textAlign: 'center', borderBottom: '2px solid #444' }}>
                                TSS®
                            </th>
                            <th style={{ padding: '15px', color: 'white', textAlign: 'center', borderBottom: '2px solid #444' }}>
                                IF®
                            </th>
                            <th style={{ padding: '15px', color: 'white', textAlign: 'center', borderBottom: '2px solid #444' }}>
                                NP®
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {workoutRows.map((row, index) => (
                            <tr 
                                key={row.id}
                                style={{ 
                                    borderBottom: index < workoutRows.length - 1 ? '1px solid #333' : 'none',
                                    backgroundColor: index % 2 === 0 ? '#2a2a2a' : '#252525'
                                }}
                            >
                                <td style={{ padding: '15px', color: 'white', verticalAlign: 'top' }}>
                                    <div>
                                        <strong>{row.name}</strong>
                                        <div style={{ color: '#999', fontSize: '12px', marginTop: '4px' }}>
                                            ID: {row.id}
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '15px', verticalAlign: 'middle' }}>
                                    {row.workoutData ? (
                                        <WorkoutChart
                                            workoutData={row.workoutData}
                                            userProfile={userProfile}
                                            height={120}
                                        />
                                    ) : (
                                        <div style={{ 
                                            color: '#999', 
                                            textAlign: 'center',
                                            padding: '40px',
                                            fontStyle: 'italic'
                                        }}>
                                            {row.error || 'No workout data available'}
                                        </div>
                                    )}
                                </td>
                                <td style={{ padding: '15px', color: 'white', textAlign: 'center', verticalAlign: 'middle' }}>
                                    {row.metrics?.duration || 'N/A'}
                                </td>
                                <td style={{ padding: '15px', color: 'white', textAlign: 'center', verticalAlign: 'middle' }}>
                                    {row.metrics?.tss || 'N/A'}
                                </td>
                                <td style={{ padding: '15px', color: 'white', textAlign: 'center', verticalAlign: 'middle' }}>
                                    {row.metrics ? row.metrics.intensityFactor.toFixed(2) : 'N/A'}
                                </td>
                                <td style={{ padding: '15px', color: 'white', textAlign: 'center', verticalAlign: 'middle' }}>
                                    {row.metrics?.normalizedPower || 'N/A'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={{ 
                marginTop: '30px', 
                padding: '20px', 
                backgroundColor: '#2a2a2a', 
                borderRadius: '8px',
                color: '#999'
            }}>
                <h3 style={{ color: 'white', marginBottom: '10px' }}>About Knighthood Workouts</h3>
                <p>
                    These are the official Knighthood workouts from Wahoo SYSTM. Each workout has been analyzed 
                    using your rider profile (FTP: {userProfile.ftp}W, MAP: {userProfile.map}W, 
                    AC: {userProfile.ac}W, NM: {userProfile.nm}W) to calculate Training Stress Score (TSS®), 
                    Intensity Factor (IF®), and Normalized Power (NP®).
                </p>
                <p style={{ marginTop: '10px', fontSize: '14px' }}>
                    <strong>Note:</strong> Workouts without data have not been fetched yet. Run the fetch-workouts script to download workout profiles.
                </p>
            </div>
        </div>
    );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);