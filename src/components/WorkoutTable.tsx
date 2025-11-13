import React, { useState, useMemo } from 'react';
import WorkoutChart from './WorkoutChart';
import { UserPowerProfile } from '../types/userProfile';
import { useViewport } from '../hooks/useViewport';
import styles from './WorkoutTable.module.css';

interface WorkoutTableRow {
    id: string;
    name: string;
    workoutData: any;
    metrics: {
        duration: string;
        tss: number;
        intensityFactor: number;
        normalizedPower: number;
    } | null;
    error?: string;
    usedOutdoorData?: boolean;
}

interface WorkoutTableProps {
    workoutRows: WorkoutTableRow[];
    userProfile: UserPowerProfile;
    title?: string;
    subtitle?: string;
    showWorkoutProfiles?: boolean;
}

const WorkoutTable: React.FC<WorkoutTableProps> = ({ 
    workoutRows, 
    userProfile, 
    title = "", 
    subtitle = "",
    showWorkoutProfiles = true
}) => {
    const viewport = useViewport();
    const [sortBy, setSortBy] = useState<'name' | 'duration' | 'tss' | 'if' | 'np'>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const convertDurationToMinutes = (duration: string): number => {
        // Handle formats like "1:30:00" (1h 30m) or "45:00" (45m)
        const parts = duration.split(':').map(p => parseInt(p, 10));
        if (parts.length === 3) {
            // HH:MM:SS format
            return parts[0] * 60 + parts[1] + parts[2] / 60;
        } else if (parts.length === 2) {
            // MM:SS format
            return parts[0] + parts[1] / 60;
        }
        return 0;
    };

    const handleSort = (column: 'name' | 'duration' | 'tss' | 'if' | 'np') => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('asc');
        }
    };

    const sortedWorkoutRows = useMemo(() => {
        return [...workoutRows].sort((a, b) => {
            let aValue: any, bValue: any;
            
            switch (sortBy) {
                case 'name':
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                    break;
                case 'duration':
                    aValue = a.metrics ? convertDurationToMinutes(a.metrics.duration) : 0;
                    bValue = b.metrics ? convertDurationToMinutes(b.metrics.duration) : 0;
                    break;
                case 'tss':
                    aValue = a.metrics?.tss || 0;
                    bValue = b.metrics?.tss || 0;
                    break;
                case 'if':
                    aValue = a.metrics?.intensityFactor || 0;
                    bValue = b.metrics?.intensityFactor || 0;
                    break;
                case 'np':
                    aValue = a.metrics?.normalizedPower || 0;
                    bValue = b.metrics?.normalizedPower || 0;
                    break;
                default:
                    return 0;
            }
            
            if (typeof aValue === 'string') {
                return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
            } else {
                return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
            }
        });
    }, [workoutRows, sortBy, sortOrder]);

    const getSortIcon = (column: string) => {
        if (sortBy !== column) return '↕️';
        return sortOrder === 'asc' ? '↑' : '↓';
    };

    // Mobile card layout for portrait mode
    const renderMobileLayout = () => (
        <div className={styles.container}>
            {title && (
                <h1 className={styles.mobileTitle}>
                    {title}
                </h1>
            )}
            {subtitle && (
                <p className={styles.mobileSubtitle}>
                    {subtitle}
                </p>
            )}

            {/* Sort Controls */}
            <div className={styles.sortControlsContainer}>
                <span className={styles.sortLabel}>Sort by:</span>
                <div className={styles.sortButtonsContainer}>
                    {(['name', 'duration', 'tss', 'if'] as const).map(col => (
                        <button
                            key={col}
                            onClick={() => handleSort(col)}
                            className={`${styles.sortButton} ${sortBy === col ? styles.sortButtonActive : styles.sortButtonInactive}`}
                        >
                            {col === 'name' ? 'Name' : 
                             col === 'duration' ? 'Duration' :
                             col === 'tss' ? 'TSS®' : 'IF®'}
                            {sortBy === col && (sortOrder === 'asc' ? '↑' : '↓')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Workout Cards */}
            <div className={styles.mobileCardsContainer}>
                {sortedWorkoutRows.map((row, index) => (
                    <div key={row.id} className={styles.workoutCard}>
                        {/* Workout Header */}
                        <div className={styles.workoutCardHeader}>
                            <div className={styles.workoutNameContainer}>
                                <strong className={styles.workoutName}>
                                    {row.name}
                                </strong>
                                {row.usedOutdoorData && (
                                    <span 
                                        className={styles.outdoorDataWarning}
                                        title="Using outdoor power profile data"
                                    >
                                        ⚠️
                                    </span>
                                )}
                            </div>
                            <div className={styles.workoutId}>
                                ID: {row.id}
                            </div>
                        </div>

                        {/* Metrics Grid */}
                        <div className={`${styles.workoutMetricsGrid} ${showWorkoutProfiles && row.workoutData ? styles.workoutMetricsGridShowProfiles : styles.workoutMetricsGridNoProfiles}`}>
                            <div className={styles.metricItem}>
                                <div className={styles.metricLabelDuration}>Duration</div>
                                <div className={styles.metricValue}>
                                    {row.metrics?.duration || 'N/A'}
                                </div>
                            </div>
                            <div className={styles.metricItem}>
                                <div className={styles.metricLabelTSS}>TSS®</div>
                                <div className={styles.metricValue}>
                                    {row.metrics?.tss || 'N/A'}
                                </div>
                            </div>
                            <div className={styles.metricItem}>
                                <div className={styles.metricLabelIF}>IF®</div>
                                <div className={styles.metricValue}>
                                    {row.metrics ? row.metrics.intensityFactor.toFixed(2) : 'N/A'}
                                </div>
                            </div>
                        </div>

                        {/* Workout Profile Chart (condensed) */}
                        {showWorkoutProfiles && row.workoutData && (
                            <div className={styles.workoutChartContainer}>
                                <WorkoutChart
                                    workoutData={row.workoutData}
                                    userProfile={userProfile}
                                    height={80}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className={`${styles.container} ${viewport.isMobile ? styles.mobileContainer : styles.responsiveContainer}`}>
            {viewport.isMobile ? renderMobileLayout() : (
                <>
                    <h1 className={styles.desktopTitle}>
                        {title}
                    </h1>
                    {subtitle && (
                        <p className={styles.desktopSubtitle}>
                            {subtitle}
                        </p>
                    )}
            
            <div className={styles.tableContainer}>
                <table className={styles.workoutTable}>
                    <thead className={styles.tableHeader}>
                        <tr>
                            <th 
                                className={`${styles.tableHeaderCell} ${styles.tableHeaderLeft}`}
                                onClick={() => handleSort('name')}
                            >
                                Workout {getSortIcon('name')}
                            </th>
                            {showWorkoutProfiles && (
                                <th className={`${styles.tableHeaderCell} ${styles.tableHeaderCenter} ${styles.tableWorkoutProfile}`}>
                                    Workout Profile
                                </th>
                            )}
                            <th 
                                className={`${styles.tableHeaderCell} ${styles.tableHeaderCenter}`}
                                onClick={() => handleSort('duration')}
                            >
                                Duration {getSortIcon('duration')}
                            </th>
                            <th 
                                className={`${styles.tableHeaderCell} ${styles.tableHeaderCenter}`}
                                onClick={() => handleSort('tss')}
                            >
                                TSS® {getSortIcon('tss')}
                            </th>
                            <th 
                                className={`${styles.tableHeaderCell} ${styles.tableHeaderCenter}`}
                                onClick={() => handleSort('if')}
                            >
                                IF® {getSortIcon('if')}
                            </th>
                            <th 
                                className={`${styles.tableHeaderCell} ${styles.tableHeaderCenter}`}
                                onClick={() => handleSort('np')}
                            >
                                NP® {getSortIcon('np')}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedWorkoutRows.map((row, index) => (
                            <tr 
                                key={row.id}
                                className={`${styles.tableRow} ${index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd} ${index >= sortedWorkoutRows.length - 1 ? styles.tableRowNoBorder : ''}`}
                            >
                                <td className={`${styles.tableCell} ${styles.workoutNameCell}`}>
                                    <div>
                                        <div className={styles.workoutNameHeader}>
                                            <a 
                                                href={`https://systm.wahoofitness.com/content-details/${row.id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`${styles.workoutNameTitle} ${styles.workoutNameLink}`}
                                            >
                                                {row.name}
                                            </a>
                                            {row.usedOutdoorData && (
                                                <span 
                                                    className={`${styles.outdoorDataWarning} ${styles.outdoorDataWarningSpaced}`}
                                                    title="Indoor power profile data unavailable, using outdoor power profile."
                                                >
                                                    ⚠️
                                                </span>
                                            )}
                                        </div>
                                        <div className={styles.workoutNameId}>
                                            ID: {row.id}
                                        </div>
                                    </div>
                                </td>
                                {showWorkoutProfiles && (
                                    <td className={`${styles.tableCell} ${styles.tableCellCenter}`}>
                                        {row.workoutData && userProfile ? (
                                            <div className={styles.desktopChartContainer}>
                                                <WorkoutChart
                                                    workoutData={row.workoutData}
                                                    userProfile={userProfile}
                                                    height={120}
                                                />
                                            </div>
                                        ) : (
                                            <div className={styles.errorMessage}>
                                                {row.error || 'No workout data available'}
                                            </div>
                                        )}
                                    </td>
                                )}
                                <td className={`${styles.tableCell} ${styles.tableCellCenter}`}>
                                    <span className={styles.metricCell}>
                                        {row.metrics?.duration || 'N/A'}
                                    </span>
                                </td>
                                <td className={`${styles.tableCell} ${styles.tableCellCenter}`}>
                                    <span className={styles.metricCell}>
                                        {row.metrics?.tss || 'N/A'}
                                    </span>
                                </td>
                                <td className={`${styles.tableCell} ${styles.tableCellCenter}`}>
                                    <span className={styles.metricCell}>
                                        {row.metrics ? row.metrics.intensityFactor.toFixed(2) : 'N/A'}
                                    </span>
                                </td>
                                <td className={`${styles.tableCell} ${styles.tableCellCenter}`}>
                                    <span className={styles.metricCell}>
                                        {row.metrics?.normalizedPower || 'N/A'}W
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

                    <div className={styles.aboutSection}>
                        <h3 className={styles.aboutTitle}>About These Workouts</h3>
                        <p>
                            These workouts have been analyzed using your power profile (FTP: {userProfile?.ftp}W, MAP: {userProfile?.map}W, 
                            AC: {userProfile?.ac}W, NM: {userProfile?.nm}W) to calculate Training Stress Score (TSS®), 
                            Intensity Factor (IF®), and Normalized Power (NP®).
                        </p>
                        {workoutRows.length === 10 && (
                            <p className={styles.questText}>
                                <strong>Quest for KNIGHTHOOD:</strong> Complete these 10 instruments of SUFFERING back-to-back to earn the highest HONOUR in Sufferlandria!
                            </p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default WorkoutTable;