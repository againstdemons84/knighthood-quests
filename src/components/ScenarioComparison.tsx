import React, { useEffect, useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    BarController,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    ChartOptions,
    ChartData
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Scenario } from '../types/scenario';
import { UserPowerProfile } from '../types/userProfile';
import { getWorkoutData } from '../data/workout-data';
import { getBestWorkoutData } from '../utils/workoutDataHelpers';
import { WorkoutData } from '../types/workout';
import styles from './ScenarioComparison.module.css';
import { getTargetIntensity } from '../utils/targetIntensityUtils';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    BarController,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

interface ScenarioComparisonProps {
    scenarios: Scenario[];
    userProfile: UserPowerProfile;
    onClearSelection?: () => void;
    singleScenarioView?: boolean; // When true, shows reduced height charts and pie chart for power zones
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

// Power zones definition (as % of FTP)
const POWER_ZONES = [
    { name: 'Recovery', min: 0, max: 55, color: '#b3c6ff' },
    { name: 'Endurance', min: 55, max: 75, color: '#a3e1a3' },
    { name: 'Tempo', min: 75, max: 90, color: '#ffe066' },
    { name: 'Threshold', min: 90, max: 105, color: '#ffb366' },
    { name: 'VO2max', min: 105, max: 120, color: '#ff6666' },
    { name: 'Anaerobic', min: 120, max: 200, color: '#c266ff' }
];

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
    onClearSelection,
    singleScenarioView = false
}) => {
    const [scenarioPowerProfiles, setScenarioPowerProfiles] = useState<ScenarioPowerProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [customIntensity, setCustomIntensity] = useState(getTargetIntensity(userProfile));

    // Reset custom intensity when user profile changes
    useEffect(() => {
        setCustomIntensity(getTargetIntensity(userProfile));
    }, [userProfile]);

    useEffect(() => {
        const calculatePowerProfiles = async () => {
            setLoading(true);
            setError(null);
            
            try {
                const profiles: ScenarioPowerProfile[] = [];
                const effectiveIntensity = customIntensity;
                
                for (let i = 0; i < scenarios.length; i++) {
                    const scenario = scenarios[i];
                    const color = CHART_COLORS[i % CHART_COLORS.length];
                    
                    const powerProfile = await calculateScenarioPowerProfile(scenario, userProfile, effectiveIntensity);
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
    }, [scenarios, userProfile, customIntensity]);

    const calculateScenarioPowerProfile = async (scenario: Scenario, profile: UserPowerProfile, effectiveIntensity: number) => {
        const allPowerData: PowerDataPoint[] = [];
        let currentTime = 0;

        for (const workout of scenario.workouts) {
            try {
                const rawData = getWorkoutData(workout.id);
                if (!rawData) continue;
                
                const { data } = getBestWorkoutData(rawData);
                if (!data) continue;

                const workoutPowerData = extractNormalizedPowerData(data, profile, currentTime, effectiveIntensity);
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

    const extractNormalizedPowerData = (workoutData: WorkoutData, profile: UserPowerProfile, startTime: number, effectiveIntensity: number) => {
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
                // Apply intensity adjustment when calculating absolute power
                const adjustedPower = lastValue * profile.ftp * (effectiveIntensity / 100);
                regularPower.push(adjustedPower);
            }
        } else {
            totalDuration = 3600;
            for (let t = 0; t <= totalDuration; t++) {
                const adjustedPower = 0.5 * profile.ftp * (effectiveIntensity / 100);
                regularPower.push(adjustedPower);
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

    // Calculate cumulative TSS over time for each scenario
    const cumulativeTSSData = scenarios.map((scenario: Scenario, scenarioIndex: number) => {
        let cumulativeTSS = 0;
        let currentTime = 0;
        const tssPoints: { time: number; tss: number }[] = [];
        
        scenario.workouts.forEach((workout: any) => {
            const rawData = getWorkoutData(workout.id);
            if (!rawData) return;
            const { data } = getBestWorkoutData(rawData);
            if (!data || !data.value || !data.time) return;
            
            // Calculate TSS for this workout
            let workoutTSS = 0;
            const duration = data.time[data.time.length - 1]; // workout duration in seconds
            
            // Calculate normalized power for the workout
            const powers = data.value.map((v: number) => {
                // Apply intensity adjustment when calculating absolute power
                const adjustedPower = v * userProfile.ftp * (customIntensity / 100);
                return adjustedPower;
            });
            let totalNP4 = 0;
            let count = 0;
            
            // Rolling 30s NP calculation
            for (let i = 0; i < powers.length; i++) {
                const startIdx = Math.max(0, i - 29);
                const window = powers.slice(startIdx, i + 1);
                const mean4th = window.reduce((sum: number, p: number) => sum + Math.pow(p, 4), 0) / window.length;
                const np = Math.pow(mean4th, 0.25);
                totalNP4 += Math.pow(np, 4);
                count++;
            }
            
            const workoutNP = count > 0 ? Math.pow(totalNP4 / count, 0.25) : 0;
            const intensityFactor = workoutNP / userProfile.ftp;
            
            // TSS = (duration in hours) × (IF^2) × 100
            workoutTSS = (duration / 3600) * Math.pow(intensityFactor, 2) * 100;
            cumulativeTSS += workoutTSS;
            
            // Add data points throughout the workout for smooth curve
            const timeStep = Math.max(1, Math.floor(duration / 20)); // 20 points per workout
            for (let t = 0; t <= duration; t += timeStep) {
                const progressTSS = cumulativeTSS - workoutTSS + (workoutTSS * t / duration);
                tssPoints.push({
                    time: (currentTime + t) / 60, // Convert to minutes
                    tss: progressTSS
                });
            }
            
            currentTime += duration;
        });
        
        return {
            scenario,
            data: tssPoints,
            color: CHART_COLORS[scenarioIndex % CHART_COLORS.length],
            finalTSS: cumulativeTSS
        };
    });

    // Prepare cumulative TSS chart data as bar chart
    const tssChartData = {
        labels: cumulativeTSSData.map(profile => profile.scenario.name),
        datasets: [{
            label: 'Total TSS',
            data: cumulativeTSSData.map(profile => Math.round(profile.finalTSS)),
            backgroundColor: cumulativeTSSData.map(profile => profile.color),
            borderColor: cumulativeTSSData.map(profile => profile.color),
            borderWidth: 1
        }]
    };

    const tssChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' as const },
            title: {
                display: true,
                text: 'Total Training Stress Score (TSS) Comparison',
                font: { size: 16, weight: 'bold' as const }
            }
        },
        scales: {
            x: {
                title: { 
                    display: true, 
                    text: 'Scenarios' 
                },
                ticks: {
                    maxRotation: 45,
                    minRotation: 0
                }
            },
            y: {
                beginAtZero: true,
                title: { 
                    display: true, 
                    text: 'Total TSS' 
                },
                ticks: {
                    callback: function(value: any) {
                        return Math.round(value);
                    }
                }
            }
        }
    };

    // Calculate effective intensity for zone calculations
    const effectiveIntensity = customIntensity;

    // Calculate power zone distribution using raw workout data
    const zoneDistributions = scenarios.map((scenario: Scenario) => {
        // Track time (in seconds) spent in each zone
        const zoneTimes = POWER_ZONES.map(() => 0);
        
        // Gather all raw power values with their time intervals from scenario workouts
        scenario.workouts.forEach((workout: any) => {
            const rawData = getWorkoutData(workout.id);
            if (!rawData) return;
            const { data } = getBestWorkoutData(rawData);
            if (!data || !data.value || !data.time) return;
            
            // Process each power value with its actual time interval
            for (let i = 0; i < data.value.length && i < data.time.length; i++) {
                let percentFTP = data.value[i] * 100; // Convert from decimal (0.5 = 50%, 1.0 = 100%)
                
                // Apply intensity adjustment - makes efforts appear easier relative to original FTP zones
                percentFTP = percentFTP * (effectiveIntensity / 100);
                
                // Calculate the duration of this interval
                let intervalDuration = 0;
                if (i < data.time.length - 1) {
                    // Duration is the difference between this time and the next
                    intervalDuration = data.time[i + 1] - data.time[i];
                } else {
                    // For the last interval, assume 1 second duration
                    intervalDuration = 1;
                }
                
                // Find which zone this power value belongs to and add the time interval
                for (let j = 0; j < POWER_ZONES.length; j++) {
                    if (percentFTP >= POWER_ZONES[j].min && percentFTP < POWER_ZONES[j].max) {
                        zoneTimes[j] += intervalDuration;
                        break;
                    }
                }
            }
        });
        
        // Convert seconds to minutes
        return zoneTimes.map(seconds => seconds / 60);
    });

    // Prepare zone chart data for grouped bar chart
    const zoneChartData = {
        labels: POWER_ZONES.map(zone => zone.name),
        datasets: scenarios.map((scenario: Scenario, idx: number) => ({
            label: scenario.name,
            data: zoneDistributions[idx],
            backgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
            borderColor: CHART_COLORS[idx % CHART_COLORS.length],
            borderWidth: 1
        }))
    };

    const zoneChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' as const },
            title: {
                display: true,
                text: 'Power Zone Distribution (Minutes)',
                font: { size: 16, weight: 'bold' as const }
            }
        },
        scales: {
            x: { 
                stacked: false,
                title: { display: true, text: 'Power Zones' },
                ticks: {
                    maxRotation: 45,
                    minRotation: 0
                }
            },
            y: {
                beginAtZero: true,
                title: { display: true, text: 'Time in Zone (minutes)' },
                ticks: {
                    callback: function(value: any) {
                        return `${Math.round(value * 10) / 10}m`;
                    }
                }
            }
        }
    };

    // Prepare pie chart data for single scenario view
    const zonePieChartData = singleScenarioView && scenarios.length === 1 ? {
        labels: POWER_ZONES.map(zone => zone.name),
        datasets: [{
            label: 'Time in Zone',
            data: zoneDistributions[0], // Only first scenario for single view
            backgroundColor: [
                '#22c55e', // Recovery - green
                '#3b82f6', // Endurance - blue  
                '#f59e0b', // Tempo - orange
                '#ef4444', // Threshold - red
                '#8b5cf6', // VO2max - purple
                '#ec4899'  // Anaerobic - pink
            ],
            borderWidth: 2,
            borderColor: '#ffffff'
        }]
    } : null;

    const zonePieChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { 
                position: 'right' as const,
                labels: {
                    generateLabels: function(chart: any) {
                        const data = chart.data;
                        if (data.labels.length && data.datasets.length) {
                            return data.labels.map((label: string, i: number) => {
                                const value = data.datasets[0].data[i];
                                return {
                                    text: `${label}: ${Math.round(value * 10) / 10}m`,
                                    fillStyle: data.datasets[0].backgroundColor[i],
                                    strokeStyle: data.datasets[0].borderColor,
                                    lineWidth: data.datasets[0].borderWidth,
                                    fontColor: '#eaeaea',
                                    index: i
                                };
                            });
                        }
                        return [];
                    }
                }
            },
            title: {
                display: true,
                text: 'Power Zone Distribution',
                font: { size: 16, weight: 'bold' as const }
            },
            tooltip: {
                callbacks: {
                    label: function(context: any) {
                        const label = context.label || '';
                        const value = Math.round(context.raw * 10) / 10;
                        const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                        const percentage = Math.round((context.raw / total) * 100);
                        return `${label}: ${value}m (${percentage}%)`;
                    }
                }
            }
        }
    };

    if (loading) {
        return (
            <div className={styles.comparisonSection}>
                <div className={styles.comparisonHeader}>
                    <h3 className={styles.comparisonTitle}>
                        Power Profile Analysis
                    </h3>
                    {onClearSelection && (
                        <button onClick={onClearSelection} className={styles.clearSelectionButton}>
                            Clear Selection
                        </button>
                    )}
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
                    {onClearSelection && (
                        <button onClick={onClearSelection} className={styles.clearSelectionButton}>
                            Clear Selection
                        </button>
                    )}
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
                <div className={styles.headerControls}>
                    <div className={styles.intensitySliderContainer}>
                        <label className={styles.sliderLabel}>
                            Training Intensity: {customIntensity}%
                        </label>
                        <input
                            type="range"
                            min="50"
                            max="120"
                            step="1"
                            value={customIntensity}
                            onChange={(e) => setCustomIntensity(Number(e.target.value))}
                            className={styles.intensitySlider}
                        />
                    </div>
                    
                    {onClearSelection && (
                        <button onClick={onClearSelection} className={styles.clearSelectionButton}>
                            Clear Selection
                        </button>
                    )}
                </div>
            </div>
            
            {singleScenarioView ? (
                // View Scenario Layout
                <>
                    {/* Row 1: Normalized Power and Power Zone side by side */}
                    <div className={styles.chartsRow}>
                        {/* First Half: Normalized Power Profile */}
                        <div className={`${styles.chartContainerHalf} ${styles.chartContainerHalfReduced}`}>
                            <Line 
                                key={`chart-half-${scenarios.length}-${scenarioPowerProfiles.length}`}
                                data={chartData} 
                                options={chartOptions} 
                            />
                        </div>
                        
                        {/* Second Half: Power Zone Distribution */}
                        <div className={`${styles.chartContainerHalf} ${styles.chartContainerHalfReduced}`}>
                            {zonePieChartData ? (
                                <Pie data={zonePieChartData} options={zonePieChartOptions} />
                            ) : (
                                <Bar data={zoneChartData} options={zoneChartOptions} />
                            )}
                        </div>
                    </div>
                </>
            ) : (
                // Scenario Comparison Layout
                <>
                    {/* Row 1: Full width Normalized Power Profile */}
                    <div className={styles.chartContainer}>
                        <Line 
                            key={`chart-${scenarios.length}-${scenarioPowerProfiles.length}`}
                            data={chartData} 
                            options={chartOptions} 
                        />
                    </div>
                    
                    {/* Row 2: TSS and Power Zone side by side */}
                    <div className={styles.chartsRow}>
                        {/* First Half: TSS comparison */}
                        <div className={styles.chartContainerHalf}>
                            <Bar data={tssChartData} options={tssChartOptions} />
                        </div>
                        
                        {/* Second Half: Power Zone Distribution */}
                        <div className={styles.chartContainerHalf}>
                            <Bar data={zoneChartData} options={zoneChartOptions} />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ScenarioComparison;