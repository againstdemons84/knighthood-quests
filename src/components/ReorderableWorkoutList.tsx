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
import styles from './ReorderableWorkoutList.module.css';

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
        targetTss: number;
        intensityFactor: number;
        targetIntensityFactor: number;
        normalizedPower: number;
        targetNormalizedPower: number;
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
    const [totalTargetTSS, setTotalTargetTSS] = useState<number>(0);
    const [averageTargetIF, setAverageTargetIF] = useState<number>(0);
    const [totalDuration, setTotalDuration] = useState<number>(0);
    const [averageIF, setAverageIF] = useState<number>(0);
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

    const formatTotalDuration = (totalSeconds: number): string => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
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
                            targetTss: calculatedMetrics.trainingStressScore * (userProfile.targetIntensity / 100),
                            intensityFactor: calculatedMetrics.intensityFactor,
                            targetIntensityFactor: calculatedMetrics.intensityFactor * (userProfile.targetIntensity / 100),
                            normalizedPower: calculatedMetrics.normalizedPower,
                            targetNormalizedPower: calculatedMetrics.normalizedPower * (userProfile.targetIntensity / 100)
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

                // Calculate target TSS and average target IF
                const validTargetTSSValues = rows.filter(row => row.metrics?.targetTss).map(row => row.metrics!.targetTss);
                const validTargetIFValues = rows.filter(row => row.metrics?.targetIntensityFactor).map(row => row.metrics!.targetIntensityFactor);
                
                if (validTargetTSSValues.length > 0) {
                    const totalTargetTSSValue = validTargetTSSValues.reduce((sum, targetTss) => sum + targetTss, 0);
                    setTotalTargetTSS(totalTargetTSSValue);
                }
                
                if (validTargetIFValues.length > 0) {
                    const averageTargetIFValue = validTargetIFValues.reduce((sum, targetIf) => sum + targetIf, 0) / validTargetIFValues.length;
                    setAverageTargetIF(averageTargetIFValue);
                }

                // Calculate total duration and average IF
                const validDurationValues = rows.filter(row => row.metrics?.duration).map(row => {
                    const duration = row.metrics!.duration;
                    // Convert duration string (HH:MM:SS or MM:SS) to seconds
                    const parts = duration.split(':').map(Number);
                    if (parts.length === 3) {
                        return parts[0] * 3600 + parts[1] * 60 + parts[2];
                    } else if (parts.length === 2) {
                        return parts[0] * 60 + parts[1];
                    }
                    return 0;
                });
                
                const validIFValues = rows.filter(row => row.metrics?.intensityFactor).map(row => row.metrics!.intensityFactor);
                
                if (validDurationValues.length > 0) {
                    const totalDurationValue = validDurationValues.reduce((sum, duration) => sum + duration, 0);
                    setTotalDuration(totalDurationValue);
                }
                
                if (validIFValues.length > 0) {
                    const averageIFValue = validIFValues.reduce((sum, if_val) => sum + if_val, 0) / validIFValues.length;
                    setAverageIF(averageIFValue);
                }

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
            alert(`Workout: ${workoutRow.name}\nDuration: ${workoutRow.metrics?.duration || 'N/A'}\nFull TSS: ${workoutRow.metrics ? Math.round(workoutRow.metrics.tss) : 'N/A'}\nTarget TSS: ${workoutRow.metrics ? Math.round(workoutRow.metrics.targetTss) : 'N/A'} (${userProfile.targetIntensity}%)\nFull IF: ${workoutRow.metrics ? workoutRow.metrics.intensityFactor.toFixed(2) : 'N/A'}\nTarget IF: ${workoutRow.metrics ? workoutRow.metrics.targetIntensityFactor.toFixed(2) : 'N/A'} (${userProfile.targetIntensity}%)\nFull NP: ${workoutRow.metrics ? Math.round(workoutRow.metrics.normalizedPower) : 'N/A'}W\nTarget NP: ${workoutRow.metrics ? Math.round(workoutRow.metrics.targetNormalizedPower) : 'N/A'}W (${userProfile.targetIntensity}%)`);
        }
    };

    const renderMobileLayout = () => (
        <div data-testid="reorderable-workout-list" className={styles.container}>
            {(title || subtitle) && (
                <div className={styles.headerSection}>
                    {title && <h2 className={styles.title}>{title}</h2>}
                    {subtitle && (
                        <p className={styles.subtitle}>
                            Tap and hold to reorder • Tap charts to see detailed workout profiles
                        </p>
                    )}
                </div>
            )}
            
            {loading ? (
                <div className={styles.loadingContainer}>
                    Loading workouts...
                </div>
            ) : (
                <>
                    {/* Combined Scenario Power Profile */}
                    {combinedWorkoutData && (
                        <div className={styles.combinedProfile}>
                            <h3 className={`${styles.combinedProfileTitle} ${styles.combinedProfileTitleMobile}`}>
                                Complete Challenge Profile
                            </h3>
                            <p className={styles.combinedProfileSubtitle}>
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

                    <div className={styles.mobileContainer}>
                        {workoutRows.map((row, index) => (
                        <div
                            key={`${row.name}-${index}`}
                            data-testid={`workout-item-${index}`}
                            data-workout-id={row.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragEnd={handleDragEnd}
                            onDragOver={handleDragOver}
                            onDragEnter={(e) => handleDragEnter(e, index)}
                            onDrop={(e) => handleDrop(e, index)}
                            className={[
                                styles.mobileWorkoutItem,
                                draggedIndex === index ? styles.mobileWorkoutItemDragging : '',
                                dragOverIndex === index ? styles.mobileWorkoutItemDragOver : ''
                            ].filter(Boolean).join(' ')}
                        >
                            {/* Order Number and Drag Handle */}
                            <div className={styles.mobileHeader}>
                                <div 
                                    data-testid={`order-number-${index}`}
                                    className={styles.mobileIndex}
                                >
                                    {index + 1}
                                </div>
                                <div 
                                    data-testid={`drag-handle-${index}`}
                                    className={styles.mobileDragHandle}
                                >
                                    ⋮⋮
                                </div>
                            </div>

                            {/* Workout Name */}
                            <h3 className={styles.mobileWorkoutName}>
                                {row.name}
                                {row.usedOutdoorData && (
                                    <span className={styles.outdoorBadge}>
                                        OUTDOOR
                                    </span>
                                )}
                                <a 
                                    href={`https://systm.wahoofitness.com/content-details/${row.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onTouchStart={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => e.stopPropagation()}
                                    className={styles.systmLink}
                                    onTouchEnd={(e) => {
                                        e.currentTarget.style.backgroundColor = 'rgba(76, 175, 80, 0.2)';
                                        setTimeout(() => {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                        }, 150);
                                    }}
                                    title={`View ${row.name} on SYSTM`}
                                >
                                    ↗
                                </a>
                            </h3>

                            {/* Metrics Grid - Row 1: Duration, Full TSS, Target TSS */}
                            <div className={styles.mobileMetricsRowOne}>
                                <div className={styles.mobileMetricItem}>
                                    <div className={styles.mobileMetricValue}>
                                        {row.metrics?.duration || '-'}
                                    </div>
                                    <div className={styles.mobileMetricLabel}>
                                        Duration
                                    </div>
                                </div>
                                <div className={styles.mobileMetricItem}>
                                    <div className={styles.mobileMetricValue}>
                                        {row.metrics ? `${Math.round(row.metrics.normalizedPower)}W` : '-'}&nbsp;
                                        ({row.metrics ? `${Math.round(row.metrics.targetNormalizedPower)}W` : '-'})
                                    </div>
                                    <div className={styles.mobileMetricLabel}>
                                        NP® ({userProfile.targetIntensity}%)
                                    </div>
                                </div>
                                <div className={styles.mobileMetricItem}>
                                    <div 
                                        className={styles.mobileMetricValue}
                                        style={{ 
                                            color: row.metrics ? getTSSColor(row.metrics.tss, minTSS, maxTSS) : "white"
                                        }}>
                                        {row.metrics ? Math.round(row.metrics.tss) : '-'}&nbsp;
                                        ({row.metrics ? Math.round(row.metrics.targetTss) : '-'})
                                    </div>
                                    <div className={styles.mobileMetricLabel}>
                                        TSS ({userProfile.targetIntensity}%)
                                    </div>
                                </div>
                                <div className={styles.mobileMetricItem}>
                                    <div className={styles.mobileMetricValue}>
                                        {row.metrics ? row.metrics.intensityFactor.toFixed(2) : '-'}&nbsp;
                                        ({row.metrics ? `${row.metrics.targetIntensityFactor.toFixed(2)}` : '-'})
                                    </div>
                                    <div className={styles.mobileMetricLabel}>
                                        IF® ({userProfile.targetIntensity}%)
                                    </div>
                                </div>
                            </div>

                            {/* Workout Chart */}
                            {row.workoutData && (
                                <div 
                                    className={styles.mobileChartContainer}
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
            <div className={styles.loadingDesktop}>
                <div className={styles.loadingText}>Loading workout details...</div>
            </div>
        );
    }

    // Use mobile layout for mobile screens
    if (viewport.isMobile || viewport.isTablet) {
        return renderMobileLayout();
    }

    return (
        <div className={styles.desktopContainer}>
            {/* Header */}
            {(title || subtitle) && (
                <div className={styles.desktopHeader}>
                    {title && <h2 className={styles.desktopTitle}>{title}</h2>}
                    {subtitle && <p className={styles.desktopSubtitle}>{subtitle}</p>}
                </div>
            )}

            {/* Combined Scenario Power Profile */}
            {combinedWorkoutData && (
                <div className={styles.combinedScenarioProfile}>
                    <h3 className={styles.combinedScenarioTitle}>
                        Complete Challenge Profile
                    </h3>
                    <p className={styles.combinedScenarioSubtitle}>
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
            <div data-testid="reorderable-workout-list" className={styles.desktopTable}>
                {/* Column Headers */}
                <div className={styles.desktopTableHeader}>
                    <div className={styles.headerDragSpace}></div> {/* Drag handle space */}
                    <div className={styles.headerOrderCol}>#</div>
                    <div className={styles.headerWorkoutCol}>Workout</div>
                    <div className={styles.headerProfileCol}>Profile</div>
                    <div className={styles.headerDurationCol}>Duration</div>
                    <div className={styles.headerFullTssCol}>Full TSS</div>
                    <div className={styles.headerTargetTssCol}>Target TSS  ({userProfile.targetIntensity}%)</div>
                    <div className={styles.headerCumTssCol}>Cum TSS%</div>
                    <div className={styles.headerFullIfCol}>Full IF</div>
                    <div className={styles.headerTargetIfCol}>Target IF  ({userProfile.targetIntensity}%)</div>
                    <div className={styles.headerNpCol}>NP® ({userProfile.targetIntensity}%)</div>
                </div>

                <div className={styles.desktopTableBody}>
                    {workoutRows.map((workout, index) => (
                        <div
                            key={workout.id}
                            data-testid={`workout-item-${index}`}
                            data-workout-id={workout.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragEnd={handleDragEnd}
                            onDragOver={handleDragOver}
                            onDragEnter={(e) => handleDragEnter(e, index)}
                            onDrop={(e) => handleDrop(e, index)}
                            className={`${styles.desktopTableRow} ${
                                dragOverIndex === index ? styles.dragOver : 
                                (index % 2 === 0 ? styles.evenRow : styles.oddRow)
                            } ${draggedIndex === index ? styles.dragging : ''}`}
                        >
                            {/* Drag Handle */}
                            <div 
                                data-testid={`drag-handle-${index}`}
                                className={styles.desktopDragHandle}
                            >
                                ⋮⋮
                            </div>

                            {/* Order Number */}
                            <div 
                                data-testid={`order-number-${index}`}
                                className={styles.desktopOrderNumber}
                            >
                                {index + 1}
                            </div>

                            {/* Workout Info Column */}
                            <div className={styles.desktopWorkoutInfo}>
                                <div className={styles.desktopWorkoutNameSection}>
                                    <div className={styles.desktopWorkoutName}>
                                        {workout.name}
                                        {workout.usedOutdoorData && (
                                            <span className={styles.desktopOutdoorBadge}>
                                                OUTDOOR
                                            </span>
                                        )}
                                        <a 
                                            href={`https://systm.wahoofitness.com/content-details/${workout.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onClick={(e) => e.stopPropagation()}
                                            className={styles.desktopSystmLink}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = 'rgba(76, 175, 80, 0.2)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                            }}
                                            title={`View ${workout.name} on SYSTM`}
                                        >
                                            ↗
                                        </a>
                                    </div>
                                    <div className={styles.desktopWorkoutId}>
                                        ID: {workout.id}
                                    </div>
                                </div>
                            </div>

                            {/* Profile Chart Column */}
                            <div className={styles.desktopProfileColumn}>
                                <div className={styles.desktopChartSection}>
                                    {workout.workoutData ? (
                                        <div 
                                            className={styles.desktopChartContainer}
                                            onClick={() => handleChartClick(workout)}
                                        >
                                            <WorkoutChart 
                                                workoutData={workout.workoutData}
                                                userProfile={userProfile}
                                                height={50}
                                            />
                                        </div>
                                    ) : (
                                        <div className={styles.desktopNoChart}>
                                            {workout.error || 'No workout data available'}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Metrics */}
                            <>
                                <div className={styles.desktopDurationCol}>
                                    {workout.metrics?.duration || '-'}
                                </div>
                                <div 
                                    className={styles.desktopTssCol}
                                    style={{ 
                                        color: workout.metrics ? getTSSColor(workout.metrics.tss, minTSS, maxTSS) : 'white'
                                    }}>
                                    {workout.metrics ? Math.round(workout.metrics.tss) : '-'}
                                </div>
                                <div className={styles.desktopTargetTssCol}>
                                    {workout.metrics ? `${Math.round(workout.metrics.targetTss)}` : '-'}
                                </div>
                                <div 
                                    className={styles.desktopCumTssCol}
                                    style={{ 
                                        color: workout.cumulativeTSSPercentage ? getVarianceColor(workout.cumulativeTSSPercentage - (index + 1) * 10) : 'white'
                                    }}>
                                    {workout.cumulativeTSSPercentage ? 
                                        `${Math.round(workout.cumulativeTSSPercentage)}% (${(workout.cumulativeTSSPercentage - (index + 1) * 10) >= 0 ? '+' : ''}${Math.round(workout.cumulativeTSSPercentage - (index + 1) * 10)}%)` 
                                        : '-'
                                    }
                                </div>
                                <div className={styles.desktopIfCol}>
                                    {workout.metrics ? workout.metrics.intensityFactor.toFixed(2) : '-'}
                                </div>
                                <div className={styles.desktopTargetIfCol}>
                                    {workout.metrics ? `${workout.metrics.targetIntensityFactor.toFixed(2)}` : '-'}
                                </div>
                                <div className={styles.desktopNpCol}>
                                    {workout.metrics ? `${Math.round(workout.metrics.normalizedPower)}W (${Math.round(workout.metrics.targetNormalizedPower)}W)` : '-'}
                                </div>
                            </>
                        </div>
                    ))}
                </div>

                {/* Instructions */}
                <div className={styles.instructionsContainer}>
                    <div className={styles.instructionsTitle}>
                        💡 Drag & Drop Instructions
                    </div>
                    <div className={styles.instructionsText}>
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