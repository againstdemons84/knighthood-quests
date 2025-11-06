import React, { useState, useMemo } from 'react';
import WorkoutChart from './WorkoutChart';
import { UserPowerProfile } from '../types/userProfile';

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

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <h1 style={{ color: 'white', marginBottom: '10px', textAlign: 'center' }}>
                {title}
            </h1>
            {subtitle && (
                <p style={{ color: '#999', marginBottom: '30px', textAlign: 'center' }}>
                    {subtitle}
                </p>
            )}
            
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
                            <th 
                                style={{ 
                                    padding: '15px', 
                                    color: 'white', 
                                    textAlign: 'left', 
                                    borderBottom: '2px solid #444',
                                    cursor: 'pointer',
                                    userSelect: 'none',
                                    transition: 'background-color 0.2s'
                                }}
                                onClick={() => handleSort('name')}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#444'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#333'}
                            >
                                Workout {getSortIcon('name')}
                            </th>
                            {showWorkoutProfiles && (
                                <th style={{ padding: '15px', color: 'white', textAlign: 'center', borderBottom: '2px solid #444', minWidth: '400px' }}>
                                    Workout Profile
                                </th>
                            )}
                            <th 
                                style={{ 
                                    padding: '15px', 
                                    color: 'white', 
                                    textAlign: 'center', 
                                    borderBottom: '2px solid #444',
                                    cursor: 'pointer',
                                    userSelect: 'none',
                                    transition: 'background-color 0.2s'
                                }}
                                onClick={() => handleSort('duration')}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#444'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#333'}
                            >
                                Duration {getSortIcon('duration')}
                            </th>
                            <th 
                                style={{ 
                                    padding: '15px', 
                                    color: 'white', 
                                    textAlign: 'center', 
                                    borderBottom: '2px solid #444',
                                    cursor: 'pointer',
                                    userSelect: 'none',
                                    transition: 'background-color 0.2s'
                                }}
                                onClick={() => handleSort('tss')}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#444'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#333'}
                            >
                                TSS® {getSortIcon('tss')}
                            </th>
                            <th 
                                style={{ 
                                    padding: '15px', 
                                    color: 'white', 
                                    textAlign: 'center', 
                                    borderBottom: '2px solid #444',
                                    cursor: 'pointer',
                                    userSelect: 'none',
                                    transition: 'background-color 0.2s'
                                }}
                                onClick={() => handleSort('if')}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#444'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#333'}
                            >
                                IF® {getSortIcon('if')}
                            </th>
                            <th 
                                style={{ 
                                    padding: '15px', 
                                    color: 'white', 
                                    textAlign: 'center', 
                                    borderBottom: '2px solid #444',
                                    cursor: 'pointer',
                                    userSelect: 'none',
                                    transition: 'background-color 0.2s'
                                }}
                                onClick={() => handleSort('np')}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#444'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#333'}
                            >
                                NP® {getSortIcon('np')}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedWorkoutRows.map((row, index) => (
                            <tr 
                                key={row.id}
                                style={{ 
                                    borderBottom: index < sortedWorkoutRows.length - 1 ? '1px solid #333' : 'none',
                                    backgroundColor: index % 2 === 0 ? '#2a2a2a' : '#252525'
                                }}
                            >
                                <td style={{ padding: '15px', color: 'white', verticalAlign: 'top' }}>
                                    <div>
                                        <strong>
                                            <a 
                                                href={`https://systm.wahoofitness.com/content-details/${row.id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    color: '#4CAF50',
                                                    textDecoration: 'none',
                                                    borderBottom: '1px solid transparent',
                                                    transition: 'border-bottom-color 0.2s'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.borderBottomColor = '#4CAF50';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.borderBottomColor = 'transparent';
                                                }}
                                            >
                                                {row.name}
                                            </a>
                                        </strong>
                                        <div style={{ color: '#999', fontSize: '12px', marginTop: '4px' }}>
                                            ID: {row.id}
                                        </div>
                                    </div>
                                </td>
                                {showWorkoutProfiles && (
                                    <td style={{ padding: '15px', verticalAlign: 'middle' }}>
                                        {row.workoutData && userProfile ? (
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
                                )}
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
                <h3 style={{ color: 'white', marginBottom: '10px' }}>About These Workouts</h3>
                <p>
                    These workouts have been analyzed using your power profile (FTP: {userProfile?.ftp}W, MAP: {userProfile?.map}W, 
                    AC: {userProfile?.ac}W, NM: {userProfile?.nm}W) to calculate Training Stress Score (TSS®), 
                    Intensity Factor (IF®), and Normalized Power (NP®).
                </p>
                {workoutRows.length === 10 && (
                    <p style={{ marginTop: '10px', fontSize: '14px' }}>
                        <strong>Knight of Sufferlandria Challenge:</strong> Complete these 10 workouts back-to-back to earn your knighthood!
                    </p>
                )}
            </div>
        </div>
    );
};

export default WorkoutTable;