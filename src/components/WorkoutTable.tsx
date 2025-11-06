import React from 'react';
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
    title = "Workouts",
    subtitle = "",
    showWorkoutProfiles = true
}) => {
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
                            <th style={{ padding: '15px', color: 'white', textAlign: 'left', borderBottom: '2px solid #444' }}>
                                Workout
                            </th>
                            {showWorkoutProfiles && (
                                <th style={{ padding: '15px', color: 'white', textAlign: 'center', borderBottom: '2px solid #444', minWidth: '400px' }}>
                                    Workout Profile
                                </th>
                            )}
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