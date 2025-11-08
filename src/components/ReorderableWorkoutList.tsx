import React, { useState, useEffect } from 'react';
import { WorkoutSelection } from '../types/scenario';
import { UserPowerProfile } from '../types/userProfile';
import { calculateAllTrainingMetrics } from '../utils/trainingMetrics';
import { WorkoutData } from '../types/workout';
import { getBestWorkoutData } from '../utils/workoutDataHelpers';
import WorkoutChart from './WorkoutChart';
import allWorkouts from '../data/workouts.json';
import { getWorkoutData } from '../data/workout-data';
import { useViewport } from '../hooks/useViewport';
import { formatDuration } from '../utils/scenarioHelpers';

// Utility function to get color based on TSS value (red = high, green = low)
const getTSSColor = (tss: number, minTSS: number, maxTSS: number): string => {
    if (maxTSS === minTSS) return '#FFFFFF'; // All same TSS, use white
    
    const normalized = (tss - minTSS) / (maxTSS - minTSS);
    const red = Math.round(255 * normalized);
    const green = Math.round(255 * (1 - normalized));
    return `rgb(${red}, ${green}, 0)`;
};

// Utility function to get color based on variance from ideal 10% progression
const getVarianceColor = (variance: number): string => {
    // Variance is the difference from ideal (e.g. -4%, +5%, etc.)
    const absVariance = Math.abs(variance);
    
    // Scale: 0% variance = white, higher variance = more intense color
    // Cap at 20% variance for color scaling
    const normalized = Math.min(absVariance / 20, 1);
        
    const intensity = Math.round(255 * normalized);
    
    if (variance >= 0) {
        // Ahead of schedule = green spectrum (0, green, 0)
        return `rgb(0, ${255 - intensity + 128}, 0)`;
    } else {
        // Behind schedule = red spectrum (red, 0, 0)
        return `rgb(${255 - intensity + 128}, 0, 0)`;
    }
};

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
    cumulativeTSSPercentage?: number;
}

const ReorderableWorkoutList: React.FC<ReorderableWorkoutListProps> = ({
    workouts,
    userProfile,
    onReorder,
    title = "Challenge Workouts",
    subtitle = "Drag and drop to reorder workouts • Click charts to see detailed workout profiles"
}) => {
    const viewport = useViewport();
    const [workoutRows, setWorkoutRows] = useState<WorkoutRowData[]>([]);
    const [loading, setLoading] = useState(true);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [minTSS, setMinTSS] = useState<number>(0);
    const [maxTSS, setMaxTSS] = useState<number>(0);
    const [totalTSS, setTotalTSS] = useState<number>(0);
    const [combinedWorkoutData, setCombinedWorkoutData] = useState<WorkoutData | null>(null);


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

    const combineWorkoutDataWithRest = (workoutRows: WorkoutRowData[]): WorkoutData | null => {
        const validWorkouts = workoutRows.filter(row => row.workoutData);
        if (validWorkouts.length === 0) return null;

        let combinedTime: number[] = [];
        let combinedValue: number[] = [];
        let combinedType: string[] = [];
        let currentTime = 0;

        validWorkouts.forEach((workout, index) => {
            if (!workout.workoutData) return;

            // Add the workout data, adjusting timestamps
            const workoutData = workout.workoutData;
            const adjustedTime = workoutData.time.map(t => t + currentTime);
            
            combinedTime = combinedTime.concat(adjustedTime);
            combinedValue = combinedValue.concat(workoutData.value);
            combinedType = combinedType.concat(workoutData.type);
            
            // Update current time to end of this workout
            const lastTime = workoutData.time[workoutData.time.length - 1];
            if (lastTime !== undefined) {
                currentTime += lastTime;
            }

            // Add 10-minute rest period between workouts (except after the last one)
            if (index < validWorkouts.length - 1) {
                const restDuration = 10 * 60; // 10 minutes in seconds
                
                // Add rest period data points (every 30 seconds for efficiency)
                for (let i = 0; i <= restDuration; i += 30) {
                    combinedTime.push(currentTime + i);
                    combinedValue.push(0); // Zero power during rest
                    combinedType.push('power'); // Assume power type
                }
                
                currentTime += restDuration;
            }
        });

        return {
            time: combinedTime,
            value: combinedValue,
            type: combinedType,
            __typename: validWorkouts[0].workoutData?.__typename || 'WorkoutData'
        };
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

            // Calculate TSS statistics and cumulative percentages
            const validTSSValues = rows.filter(row => row.metrics?.tss).map(row => row.metrics!.tss);
            if (validTSSValues.length > 0) {
                const minTSSValue = Math.min(...validTSSValues);
                const maxTSSValue = Math.max(...validTSSValues);
                const totalTSSValue = validTSSValues.reduce((sum, tss) => sum + tss, 0);
                
                setMinTSS(minTSSValue);
                setMaxTSS(maxTSSValue);
                setTotalTSS(totalTSSValue);

                // Calculate cumulative TSS percentages
                let cumulativeTSS = 0;
                rows.forEach(row => {
                    if (row.metrics?.tss) {
                        cumulativeTSS += row.metrics.tss;
                        row.cumulativeTSSPercentage = (cumulativeTSS / totalTSSValue) * 100;
                    }
                });
            }

            setWorkoutRows(rows);
            
            // Generate combined workout data
            const combined = combineWorkoutDataWithRest(rows);
            setCombinedWorkoutData(combined);
            
            setLoading(false);
        };

        loadWorkoutDetails();
    }, [workouts, userProfile]);

    // Update combined workout data when rows change (for drag and drop reordering)
    useEffect(() => {
        if (workoutRows.length > 0) {
            const combined = combineWorkoutDataWithRest(workoutRows);
            setCombinedWorkoutData(combined);
        }
    }, [workoutRows]);

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

    const handleChartClick = (workoutRow: WorkoutRowData) => {
        // For now, just show an alert with workout info
        if (workoutRow.workoutData) {
            alert(`Workout: ${workoutRow.name}\nDuration: ${workoutRow.metrics?.duration || 'N/A'}\nTSS: ${workoutRow.metrics ? Math.round(workoutRow.metrics.tss) : 'N/A'}`);
        }
    };

    const renderMobileLayout = () => (
        <div style={{ margin: "20px 0" }}>
            <div style={{ marginBottom: "16px" }}>
                <h2 style={{ margin: "0 0 8px 0", fontSize: "24px", fontWeight: "600", color: "white" }}>{title}</h2>
                {subtitle && (
                    <p style={{ margin: 0, color: "#999", fontSize: "14px" }}>
                        Tap and hold to reorder • Tap charts to see detailed workout profiles
                    </p>
                )}
            </div>
            
            {loading ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>
                    Loading workouts...
                </div>
            ) : (
                <>
                    {/* Combined Scenario Power Profile */}
                    {combinedWorkoutData && (
                        <div style={{
                            backgroundColor: "#2a2a2a",
                            border: "2px solid #4CAF50",
                            borderRadius: "12px",
                            padding: "16px",
                            marginBottom: "20px"
                        }}>
                            <h3 style={{
                                margin: "0 0 12px 0",
                                fontSize: "18px",
                                fontWeight: "600",
                                color: "#4CAF50",
                                textAlign: "center"
                            }}>
                                Complete Challenge Profile
                            </h3>
                            <p style={{
                                margin: "0 0 12px 0",
                                fontSize: "12px",
                                color: "#999",
                                textAlign: "center"
                            }}>
                                Full power profile with 10-minute rest periods between workouts
                            </p>
                            <WorkoutChart
                                workoutData={combinedWorkoutData}
                                userProfile={userProfile}
                                width={viewport.width - 80}
                                height={120}
                            />
                        </div>
                    )}

                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {workoutRows.map((row, index) => (
                        <div
                            key={`${row.name}-${index}`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragEnd={handleDragEnd}
                            onDragOver={handleDragOver}
                            onDragEnter={(e) => handleDragEnter(e, index)}
                            onDrop={(e) => handleDrop(e, index)}
                            style={{
                                backgroundColor: "#2a2a2a",
                                border: "1px solid #444",
                                borderRadius: "12px",
                                padding: "16px",
                                cursor: "grab",
                                transform: draggedIndex === index ? "rotate(3deg)" : "none",
                                opacity: draggedIndex === index ? 0.7 : 1,
                                transition: "transform 0.2s ease, opacity 0.2s ease",
                                touchAction: "manipulation"
                            }}
                        >
                            {/* Order Number and Drag Handle */}
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: "12px"
                            }}>
                                <div style={{
                                    backgroundColor: "#4CAF50",
                                    color: "white",
                                    borderRadius: "50%",
                                    width: "32px",
                                    height: "32px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "16px",
                                    fontWeight: "bold"
                                }}>
                                    {index + 1}
                                </div>
                                <div style={{
                                    color: "#999",
                                    fontSize: "20px",
                                    cursor: "grab"
                                }}>
                                    ⋮⋮
                                </div>
                            </div>

                            {/* Workout Name */}
                            <h3 style={{
                                margin: "0 0 12px 0",
                                fontSize: "18px",
                                fontWeight: "600",
                                color: "white",
                                lineHeight: "1.3"
                            }}>
                                {row.name}
                                {row.usedOutdoorData && (
                                    <span style={{ 
                                        color: '#FF9800',
                                        fontSize: '10px',
                                        marginLeft: '8px',
                                        padding: '2px 6px',
                                        backgroundColor: 'rgba(255,152,0,0.2)',
                                        borderRadius: '4px'
                                    }}>
                                        OUTDOOR
                                    </span>
                                )}
                            </h3>

                            {/* Metrics Grid */}
                            {/* First Row: Duration and TSS */}
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(2, 1fr)",
                                gap: "8px",
                                marginBottom: "12px"
                            }}>
                                <div style={{ textAlign: "center" }}>
                                    <div style={{ fontSize: "16px", fontWeight: "600", color: "white" }}>
                                        {row.metrics?.duration || '-'}
                                    </div>
                                    <div style={{ fontSize: "10px", color: "#999", marginTop: "2px" }}>
                                        Duration
                                    </div>
                                </div>
                                <div style={{ textAlign: "center" }}>
                                    <div style={{ 
                                        fontSize: "16px", 
                                        fontWeight: "600", 
                                        color: row.metrics ? getTSSColor(row.metrics.tss, minTSS, maxTSS) : "white"
                                    }}>
                                        {row.metrics ? Math.round(row.metrics.tss) : '-'}
                                    </div>
                                    <div style={{ fontSize: "10px", color: "#999", marginTop: "2px" }}>
                                        TSS
                                    </div>
                                </div>
                            </div>

                            {/* Second Row: Cumulative TSS and Power metrics */}
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(3, 1fr)",
                                gap: "8px",
                                marginBottom: "16px"
                            }}>
                                <div style={{ textAlign: "center" }}>
                                    <div style={{ 
                                        fontSize: "14px", 
                                        fontWeight: "600", 
                                        color: row.cumulativeTSSPercentage ? getVarianceColor(row.cumulativeTSSPercentage - (index + 1) * 10) : "white",
                                        whiteSpace: "nowrap"
                                    }}>
                                        {row.cumulativeTSSPercentage ? 
                                            `${Math.round(row.cumulativeTSSPercentage)}% (${(row.cumulativeTSSPercentage - (index + 1) * 10) >= 0 ? '+' : ''}${Math.round(row.cumulativeTSSPercentage - (index + 1) * 10)}%)` 
                                            : '-'
                                        }
                                    </div>
                                    <div style={{ 
                                        fontSize: "8px", 
                                        color: "#999", 
                                        marginTop: "2px" 
                                    }}>
                                        Cum TSS%
                                    </div>
                                </div>
                                <div style={{ textAlign: "center" }}>
                                    <div style={{ fontSize: "14px", fontWeight: "600", color: "white" }}>
                                        {row.metrics ? `${Math.round(row.metrics.normalizedPower)}W` : '-'}
                                    </div>
                                    <div style={{ fontSize: "9px", color: "#999", marginTop: "2px" }}>
                                        NP®
                                    </div>
                                </div>
                                <div style={{ textAlign: "center" }}>
                                    <div style={{ fontSize: "14px", fontWeight: "600", color: "white" }}>
                                        {row.metrics ? row.metrics.intensityFactor.toFixed(2) : '-'}
                                    </div>
                                    <div style={{ fontSize: "9px", color: "#999", marginTop: "2px" }}>
                                        IF®
                                    </div>
                                </div>
                            </div>

                            {/* Workout Chart */}
                            {row.workoutData && (
                                <div 
                                    style={{ 
                                        marginTop: "12px",
                                        cursor: "pointer",
                                        touchAction: "manipulation"
                                    }}
                                    onClick={() => handleChartClick(row)}
                                >
                                    <WorkoutChart
                                        workoutData={row.workoutData}
                                        userProfile={userProfile}
                                        width={viewport.width - 80}
                                        height={60}
                                    />
                                </div>
                            )}
                        </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );

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

    // Use mobile layout for mobile screens
    if (viewport.isMobile || viewport.isTablet) {
        return renderMobileLayout();
    }

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '20px' }}>
                <h2 style={{ color: 'white', margin: '0 0 5px 0' }}>{title}</h2>
                <p style={{ color: '#999', margin: 0, fontSize: '14px' }}>{subtitle}</p>
            </div>

            {/* Combined Scenario Power Profile */}
            {combinedWorkoutData && (
                <div style={{
                    backgroundColor: '#2a2a2a',
                    border: '2px solid #4CAF50',
                    borderRadius: '8px',
                    padding: '20px',
                    marginBottom: '30px'
                }}>
                    <h3 style={{
                        margin: '0 0 8px 0',
                        fontSize: '20px',
                        fontWeight: '600',
                        color: '#4CAF50',
                        textAlign: 'center'
                    }}>
                        Complete Challenge Profile
                    </h3>
                    <p style={{
                        margin: '0 0 15px 0',
                        fontSize: '14px',
                        color: '#999',
                        textAlign: 'center'
                    }}>
                        Full power profile showing all workouts in sequence with 10-minute rest periods between each workout
                    </p>
                    <WorkoutChart
                        workoutData={combinedWorkoutData}
                        userProfile={userProfile}
                        height={150}
                    />
                </div>
            )}

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
                    <div style={{ width: '280px', marginRight: '20px' }}>Workout</div>
                    <div style={{ flex: 1, marginRight: '20px' }}>Power Profile</div>
                    <div style={{ width: '90px', textAlign: 'center', marginRight: '12px' }}>Duration</div>
                    <div style={{ width: '70px', textAlign: 'center', marginRight: '12px' }}>TSS</div>
                    <div style={{ width: '80px', textAlign: 'center', marginRight: '12px' }}>Cum TSS%</div>
                    <div style={{ width: '50px', textAlign: 'center', marginRight: '12px' }}>IF</div>
                    <div style={{ width: '70px', textAlign: 'center' }}>NP</div>
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
                                width: '280px', 
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
                                    <div 
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleChartClick(workout)}
                                    >
                                        <WorkoutChart 
                                            workoutData={workout.workoutData}
                                            userProfile={userProfile}
                                            height={80}
                                        />
                                    </div>
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
                                    width: '90px',
                                    marginRight: '12px',
                                    fontSize: '14px'
                                }}>
                                    {workout.metrics?.duration || '-'}
                                </div>
                                <div style={{ 
                                    color: workout.metrics ? getTSSColor(workout.metrics.tss, minTSS, maxTSS) : 'white', 
                                    textAlign: 'center',
                                    width: '70px',
                                    marginRight: '12px',
                                    fontSize: '14px',
                                    fontWeight: 'bold'
                                }}>
                                    {workout.metrics ? Math.round(workout.metrics.tss) : '-'}
                                </div>
                                <div style={{ 
                                    color: workout.cumulativeTSSPercentage ? getVarianceColor(workout.cumulativeTSSPercentage - (index + 1) * 10) : 'white', 
                                    textAlign: 'center',
                                    width: '80px',
                                    marginRight: '12px',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {workout.cumulativeTSSPercentage ? 
                                        `${Math.round(workout.cumulativeTSSPercentage)}% (${(workout.cumulativeTSSPercentage - (index + 1) * 10) >= 0 ? '+' : ''}${Math.round(workout.cumulativeTSSPercentage - (index + 1) * 10)}%)` 
                                        : '-'
                                    }
                                </div>
                                <div style={{ 
                                    color: 'white', 
                                    textAlign: 'center',
                                    width: '50px',
                                    marginRight: '12px',
                                    fontSize: '14px'
                                }}>
                                    {workout.metrics ? workout.metrics.intensityFactor.toFixed(2) : '-'}
                                </div>
                                <div style={{ 
                                    color: 'white', 
                                    textAlign: 'center',
                                    width: '70px',
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