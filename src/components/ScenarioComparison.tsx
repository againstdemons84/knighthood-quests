import React, { useEffect, useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ChartOptions,
    ChartData
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Scenario } from '../types/scenario';
import { UserPowerProfile } from '../types/userProfile';
import { getWorkoutData } from '../data/workout-data';
import { getBestWorkoutData } from '../utils/workoutDataHelpers';
import { WorkoutData } from '../types/workout';
import styles from './ScenarioComparison.module.css';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

interface ScenarioComparisonProps {
    scenarios: Scenario[];
    userProfile: UserPowerProfile;
    onClearSelection: () => void;
}

interface PowerDataPoint {
    time: number; // in seconds
    power: number; // normalized power
}

interface ScenarioPowerProfile {
    scenario: Scenario;
    powerData: PowerDataPoint[];
    totalDuration: number;
    color: string;
}

const BUCKET_SIZE_MINUTES = 30;
const BUCKET_SIZE_SECONDS = BUCKET_SIZE_MINUTES * 60;

// Generate distinct colors for each scenario
const CHART_COLORS = [
    '#FF6384', // Red
    '#36A2EB', // Blue
    '#FFCE56', // Yellow
    '#4BC0C0', // Teal
    '#9966FF', // Purple
    '#FF9F40', // Orange
    '#FF6384', // Pink (repeat start)
    '#C9CBCF'  // Grey
];

const ScenarioComparison: React.FC<ScenarioComparisonProps> = ({
    scenarios,
    userProfile,
    onClearSelection
}) => {
    const [scenarioPowerProfiles, setScenarioPowerProfiles] = useState<ScenarioPowerProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const calculatePowerProfiles = async () => {
            setLoading(true);
            setError(null);
            
            try {
                const profiles: ScenarioPowerProfile[] = [];
                
                for (let i = 0; i < scenarios.length; i++) {
                    const scenario = scenarios[i];
                    const color = CHART_COLORS[i % CHART_COLORS.length];
                    
                    const powerProfile = await calculateScenarioPowerProfile(scenario, userProfile);
                    profiles.push({
                        scenario,
                        powerData: powerProfile.powerData,
                        totalDuration: powerProfile.totalDuration,
                        color
                    });
                }
                
                setScenarioPowerProfiles(profiles);
            } catch (err) {
                setError('Failed to calculate power profiles');
                console.error('Error calculating power profiles:', err);
            } finally {
                setLoading(false);
            }
        };

        calculatePowerProfiles();
    }, [scenarios, userProfile]);

    const calculateScenarioPowerProfile = async (scenario: Scenario, profile: UserPowerProfile) => {
        const allPowerData: PowerDataPoint[] = [];
        let currentTime = 0;

        for (const workout of scenario.workouts) {
            try {
                const rawData = getWorkoutData(workout.id);
                if (!rawData) continue;
                
                const { data } = getBestWorkoutData(rawData);
                if (!data) continue;

                const workoutPowerData = extractNormalizedPowerData(data, profile, currentTime);
                allPowerData.push(...workoutPowerData.powerData);
                currentTime += workoutPowerData.duration;
            } catch (error) {
                console.error(`Error processing workout ${workout.id}:`, error);
                // Continue with other workouts
            }
        }

        // Bucket the power data into time segments
        const bucketedData = bucketPowerData(allPowerData, BUCKET_SIZE_SECONDS);
        
        return {
            powerData: bucketedData,
            totalDuration: currentTime
        };
    };

    const extractNormalizedPowerData = (workoutData: WorkoutData, profile: UserPowerProfile, startTime: number) => {
        // Interpolate to a regular 1-second time series
        let totalDuration = 0;
        const regularPower: number[] = [];
        if (workoutData.time && workoutData.value && workoutData.time.length > 0) {
            // Build a map of time to value
            const timeArr = workoutData.time;
            const valueArr = workoutData.value;
            totalDuration = timeArr[timeArr.length - 1];
            let lastValue = valueArr[0];
            let nextIdx = 1;
            for (let t = 0; t <= totalDuration; t++) {
                // Find the closest time/value
                if (nextIdx < timeArr.length && t >= timeArr[nextIdx]) {
                    lastValue = valueArr[nextIdx];
                    nextIdx++;
                }
                regularPower.push(lastValue * profile.ftp); // convert to watts
            }
        } else {
            totalDuration = 3600;
            for (let t = 0; t <= totalDuration; t++) {
                regularPower.push(0.5 * profile.ftp);
            }
        }

        // Calculate rolling 30s NP for each second
        const npSeries: number[] = [];
        for (let i = 0; i < regularPower.length; i++) {
            // 30s window
            const startIdx = Math.max(0, i - 29);
            const window = regularPower.slice(startIdx, i + 1);
            // NP formula: 4th root of mean of 4th powers
            const mean4th = window.reduce((sum, p) => sum + Math.pow(p, 4), 0) / window.length;
            const np = Math.pow(mean4th, 0.25);
            npSeries.push(np);
        }

        // Return as PowerDataPoint[] (time in seconds, power as % FTP)
        const powerData: PowerDataPoint[] = npSeries.map((np, i) => ({
            time: startTime + i,
            power: (np / profile.ftp) * 100
        }));

        return { powerData, duration: totalDuration };
    };

    const bucketPowerData = (powerData: PowerDataPoint[], bucketSize: number): PowerDataPoint[] => {
        if (powerData.length === 0) return [];
        
        const buckets: { [key: number]: number[] } = {};
        
        powerData.forEach(point => {
            const bucketIndex = Math.floor(point.time / bucketSize);
            if (!buckets[bucketIndex]) {
                buckets[bucketIndex] = [];
            }
            buckets[bucketIndex].push(point.power);
        });
        
        // Calculate average power for each bucket
        return Object.keys(buckets)
            .map(Number)
            .sort((a, b) => a - b)
            .map(bucketIndex => ({
                time: bucketIndex * bucketSize,
                power: buckets[bucketIndex].reduce((sum, p) => sum + p, 0) / buckets[bucketIndex].length
            }));
    };

    const formatTime = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
        }
        return `${minutes}m`;
    };

    const formatDuration = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:00`;
        }
        return `${minutes.toString().padStart(2, '0')}:00`;
    };

    // Prepare chart data
    const chartData: ChartData<'line'> = {
        labels: [], // Will be filled dynamically
        datasets: scenarioPowerProfiles.map(profile => {
            // Convert time to minutes for x-axis
            const dataPoints = profile.powerData.map(point => ({
                x: point.time / 60, // Convert to minutes
                y: point.power
            }));
            
            return {
                label: profile.scenario.name,
                data: dataPoints,
                borderColor: profile.color,
                backgroundColor: profile.color + '20', // 20% opacity
                borderWidth: 2,
                fill: false,
                pointRadius: 0, // Hide individual points for cleaner look
                pointHoverRadius: 4,
                tension: 0.1 // Slight curve for smoother lines
            };
        })
    };

    const chartOptions: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        aspectRatio: 2.2, // less wide
        scales: {
            x: {
                type: 'linear',
                title: {
                    display: true,
                    text: `Time (${BUCKET_SIZE_MINUTES} min intervals)`
                },
                ticks: {
                    callback: function(value) {
                        return formatTime((value as number) * 60);
                    }
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Normalized Power (% of FTP)'
                },
                ticks: {
                    callback: function(value) {
                        return `${value}%`;
                    }
                },
                beginAtZero: false,
                min: Math.floor(Math.min(...scenarioPowerProfiles.flatMap(p => p.powerData.map(d => d.power))) * 0.95),
                max: Math.ceil(Math.max(...scenarioPowerProfiles.flatMap(p => p.powerData.map(d => d.power))) * 1.05)
            }
        },
        plugins: {
            title: {
                display: true,
                text: 'Normalized Power Profile Comparison',
                font: {
                    size: 16,
                    weight: 'bold'
                }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                callbacks: {
                    title: function(tooltipItems) {
                        const minutes = tooltipItems[0].parsed.x ?? 0;
                        return `Time: ${formatTime(minutes * 60)}`;
                    },
                    label: function(context) {
                        const yValue = context.parsed.y ?? 0;
                        return `${context.dataset.label}: ${Math.round(yValue)}% FTP`;
                    }
                }
            },
            legend: {
                position: 'top' as const,
                align: 'start' as const
            }
        },
        interaction: {
            mode: 'index' as const,
            intersect: false
        }
    };

    if (loading) {
        return (
            <div className={styles.comparisonSection}>
                <div className={styles.comparisonHeader}>
                    <h3 className={styles.comparisonTitle}>
                        Power Profile Analysis
                    </h3>
                    <button onClick={onClearSelection} className={styles.clearSelectionButton}>
                        Clear Selection
                    </button>
                </div>
                <div className={styles.loadingContainer}>
                    <div className={styles.loadingText}>
                        📊 Analyzing power profiles...
                    </div>
                    <div className={styles.loadingSubtext}>
                        Processing workout data and calculating normalized power curves
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.comparisonSection}>
                <div className={styles.comparisonHeader}>
                    <h3 className={styles.comparisonTitle}>
                        Power Profile Analysis
                    </h3>
                    <button onClick={onClearSelection} className={styles.clearSelectionButton}>
                        Clear Selection
                    </button>
                </div>
                <div className={styles.errorContainer}>
                    <div className={styles.errorText}>❌ {error}</div>
                    <div className={styles.errorSubtext}>
                        Unable to generate power profile comparison
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.comparisonSection}>
            <div className={styles.comparisonHeader}>
                <h3 className={styles.comparisonTitle}>
                    Power Profile Analysis - {scenarios.length} Scenario{scenarios.length > 1 ? 's' : ''}
                </h3>
                <button onClick={onClearSelection} className={styles.clearSelectionButton}>
                    Clear Selection
                </button>
            </div>
            
            {/* Chart Container */}
            <div className={styles.chartContainer}>
                <Line data={chartData} options={chartOptions} />
            </div>
        </div>
    );
};

export default ScenarioComparison;