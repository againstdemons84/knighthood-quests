import React, { useState, useEffect } from 'react';
import { WorkoutSelection } from '../types/scenario';
import { UserPowerProfile } from '../types/userProfile';
import { calculateAllTrainingMetrics } from '../utils/trainingMetrics';
import { WorkoutData } from '../types/workout';
import { getBestWorkoutData } from '../utils/workoutDataHelpers';
import WorkoutChart from './WorkoutChart';
import allWorkouts from '../data/workouts.json';

interface ReorderableWorkoutListProps {
    workouts: WorkoutSelection[];
    userProfile: UserPowerProfile;
    onReorder: (reorderedWorkouts: WorkoutSelection[]) => void;
    title?: string;
    subtitle?: string;
}

interface WorkoutRowData {
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

const ReorderableWorkoutList: React.FC<ReorderableWorkoutListProps> = ({
    workouts,
    userProfile,
    onReorder,
    title = "Challenge Workouts",
    subtitle = "Drag and drop to reorder workouts • Click charts to see detailed workout profiles"
}) => {
    const [workoutRows, setWorkoutRows] = useState<WorkoutRowData[]>([]);
    const [loading, setLoading] = useState(true);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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
        const loadWorkoutDetails = async () => {
            const rows: WorkoutRowData[] = [];

            for (const workout of workouts) {
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

        loadWorkoutDetails();
    }, [workouts, userProfile]);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.currentTarget.outerHTML);
        e.currentTarget.style.opacity = '0.5';
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.style.opacity = '';
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
        setDragOverIndex(index);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
        e.preventDefault();
        
        if (draggedIndex === null || draggedIndex === dropIndex) {
            return;
        }

        const newWorkouts = [...workouts];
        const draggedWorkout = newWorkouts[draggedIndex];
        
        // Remove the dragged workout from its original position
        newWorkouts.splice(draggedIndex, 1);
        
        // Insert it at the new position
        newWorkouts.splice(dropIndex, 0, draggedWorkout);
        
        onReorder(newWorkouts);
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    if (loading) {
        return (
            <div style={{ 
                backgroundColor: '#2a2a2a', 
                padding: '20px', 
                borderRadius: '8px',
                textAlign: 'center'
            }}>
                <div style={{ color: '#999' }}>Loading workout details...</div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '20px' }}>
                <h2 style={{ color: 'white', margin: '0 0 5px 0' }}>{title}</h2>
                <p style={{ color: '#999', margin: 0, fontSize: '14px' }}>{subtitle}</p>
            </div>

            {/* Reorderable Workout List */}
            <div style={{
                backgroundColor: '#2a2a2a',
                borderRadius: '8px',
                border: '1px solid #444'
            }}>
                {/* Column Headers */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '15px 20px',
                    backgroundColor: '#222',
                    borderRadius: '8px 8px 0 0',
                    fontSize: '14px',
                    color: '#999',
                    fontWeight: 'bold',
                    borderBottom: '1px solid #444'
                }}>
                    <div style={{ width: '28px' }}></div> {/* Drag handle space */}
                    <div style={{ width: '44px', marginRight: '16px' }}>#</div>
                    <div style={{ width: '300px', marginRight: '20px' }}>Workout</div>
                    <div style={{ flex: 1, marginRight: '20px' }}>Power Profile</div>
                    <div style={{ width: '100px', textAlign: 'center', marginRight: '15px' }}>Duration</div>
                    <div style={{ width: '80px', textAlign: 'center', marginRight: '15px' }}>TSS</div>
                    <div style={{ width: '60px', textAlign: 'center', marginRight: '15px' }}>IF</div>
                    <div style={{ width: '80px', textAlign: 'center' }}>NP</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '8px' }}>
                    {workoutRows.map((workout, index) => (
                        <div
                            key={workout.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragEnd={handleDragEnd}
                            onDragOver={handleDragOver}
                            onDragEnter={(e) => handleDragEnter(e, index)}
                            onDrop={(e) => handleDrop(e, index)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                backgroundColor: dragOverIndex === index ? '#444' : (index % 2 === 0 ? '#333' : '#2a2a2a'),
                                padding: '12px 15px',
                                borderRadius: '4px',
                                border: draggedIndex === index ? '2px dashed #4CAF50' : 'none',
                                cursor: 'grab',
                                transition: 'all 0.2s ease',
                                transform: draggedIndex === index ? 'rotate(1deg)' : 'none',
                                margin: '1px 0'
                            }}
                        >
                            {/* Drag Handle */}
                            <div style={{
                                color: '#999',
                                width: '28px',
                                fontSize: '16px',
                                cursor: 'grab',
                                textAlign: 'center'
                            }}>
                                ⋮⋮
                            </div>

                            {/* Order Number */}
                            <div style={{
                                backgroundColor: '#4CAF50',
                                color: 'white',
                                borderRadius: '50%',
                                width: '26px',
                                height: '26px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '13px',
                                fontWeight: 'bold',
                                marginRight: '16px'
                            }}>
                                {index + 1}
                            </div>

                            {/* Workout Name and Info */}
                            <div style={{ 
                                width: '300px', 
                                marginRight: '20px',
                                overflow: 'hidden'
                            }}>
                                <div style={{ 
                                    color: 'white', 
                                    fontWeight: 'bold', 
                                    fontSize: '14px',
                                    marginBottom: '4px',
                                    lineHeight: '1.3',
                                    wordWrap: 'break-word',
                                    overflowWrap: 'break-word',
                                    hyphens: 'auto'
                                }}>
                                    {workout.name}
                                    {workout.usedOutdoorData && (
                                        <span style={{ 
                                            color: '#FF9800',
                                            fontSize: '9px',
                                            marginLeft: '4px',
                                            padding: '1px 3px',
                                            backgroundColor: 'rgba(255,152,0,0.2)',
                                            borderRadius: '2px',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            OUTDOOR
                                        </span>
                                    )}
                                </div>
                                <div style={{ 
                                    color: '#999', 
                                    fontSize: '11px',
                                    wordWrap: 'break-word',
                                    overflowWrap: 'break-word'
                                }}>
                                    ID: {workout.id}
                                </div>
                            </div>

                            {/* Workout Chart */}
                            <div style={{ 
                                flex: 1,
                                marginRight: '20px',
                                minWidth: '300px'
                            }}>
                                {workout.workoutData ? (
                                    <WorkoutChart 
                                        workoutData={workout.workoutData}
                                        userProfile={userProfile}
                                        height={80}
                                    />
                                ) : (
                                    <div style={{
                                        height: '80px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#666',
                                        fontSize: '12px',
                                        fontStyle: 'italic'
                                    }}>
                                        {workout.error || 'No workout data available'}
                                    </div>
                                )}
                            </div>

                            {/* Metrics */}
                            <>
                                <div style={{ 
                                    color: 'white', 
                                    textAlign: 'center',
                                    width: '100px',
                                    marginRight: '15px',
                                    fontSize: '14px'
                                }}>
                                    {workout.metrics?.duration || '-'}
                                </div>
                                <div style={{ 
                                    color: 'white', 
                                    textAlign: 'center',
                                    width: '80px',
                                    marginRight: '15px',
                                    fontSize: '14px'
                                }}>
                                    {workout.metrics ? Math.round(workout.metrics.tss) : '-'}
                                </div>
                                <div style={{ 
                                    color: 'white', 
                                    textAlign: 'center',
                                    width: '60px',
                                    marginRight: '15px',
                                    fontSize: '14px'
                                }}>
                                    {workout.metrics ? workout.metrics.intensityFactor.toFixed(2) : '-'}
                                </div>
                                <div style={{ 
                                    color: 'white', 
                                    textAlign: 'center',
                                    width: '80px',
                                    fontSize: '14px'
                                }}>
                                    {workout.metrics ? `${Math.round(workout.metrics.normalizedPower)}W` : '-'}
                                </div>
                            </>
                        </div>
                    ))}
                </div>

                {/* Instructions */}
                <div style={{ 
                    marginTop: '20px', 
                    padding: '15px', 
                    backgroundColor: '#1a1a1a',
                    borderRadius: '6px',
                    border: '1px solid #333'
                }}>
                    <div style={{ color: '#4CAF50', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                        💡 Drag & Drop Instructions
                    </div>
                    <div style={{ color: '#999', fontSize: '12px' }}>
                        • Grab the ⋮⋮ handle or anywhere on a workout row to drag it<br/>
                        • Drop it at the desired position to reorder<br/>
                        • Hover over workout charts to see detailed power profiles<br/>
                        • Changes are automatically saved to your scenario
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReorderableWorkoutList;