import React, { useState, useEffect } from 'react';
import { Scenario } from '../types/scenario';
import { UserPowerProfile } from '../types/userProfile';
import { formatDuration } from '../utils/scenarioHelpers';

interface PrintQuestModalProps {
    scenario: Scenario;
    userProfile: UserPowerProfile;
    onClose: () => void;
}

const PrintQuestModal: React.FC<PrintQuestModalProps> = ({ scenario, userProfile, onClose }) => {
    console.log('PrintQuestModal rendered!', { scenario: scenario.name, viewport: window.innerWidth });
    
    const [startTime, setStartTime] = useState(() => {
        // Default to current time
        const now = new Date();
        return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    });

    interface ScheduleItem {
        type: 'workout' | 'break';
        index?: number;
        name?: string;
        id?: string;
        startTime: Date;
        endTime: Date;
        duration: number;
        tss?: number;
        intensityFactor?: number;
        normalizedPower?: number;
    }

    const calculateSchedule = (): ScheduleItem[] => {
        const [hours, minutes] = startTime.split(':').map(Number);
        const startDate = new Date();
        startDate.setHours(hours, minutes, 0, 0);

        let currentTime = new Date(startDate);
        const schedule: ScheduleItem[] = [];

        scenario.workouts.forEach((workout, index) => {
            const workoutStartTime = new Date(currentTime);
            
            // Add workout duration
            const durationMinutes = workout.metrics ? Math.ceil(workout.metrics.duration / 60) : 60;
            const workoutEndTime = new Date(currentTime.getTime() + (durationMinutes * 60 * 1000));
            
            schedule.push({
                type: 'workout',
                index: index + 1,
                name: workout.name,
                id: workout.id,
                startTime: workoutStartTime,
                endTime: workoutEndTime,
                duration: durationMinutes,
                tss: workout.metrics?.tss || 0,
                intensityFactor: workout.metrics?.intensityFactor || 0,
                normalizedPower: workout.metrics?.normalizedPower || 0
            });

            // Move to end of workout
            currentTime = new Date(workoutEndTime);

            // Add 10-minute break (except after last workout)
            if (index < scenario.workouts.length - 1) {
                const breakEndTime = new Date(currentTime.getTime() + (10 * 60 * 1000));
                schedule.push({
                    type: 'break',
                    startTime: new Date(currentTime),
                    endTime: breakEndTime,
                    duration: 10
                });
                currentTime = breakEndTime;
            }
        });

        return schedule;
    };

    const handlePrint = () => {
        const schedule = calculateSchedule();
        const totalTSS = scenario.workouts.reduce((sum, w) => sum + (w.metrics?.tss || 0), 0);
        const totalDuration = scenario.workouts.reduce((sum, w) => sum + (w.metrics?.duration || 0), 0);
        const avgIF = scenario.workouts.reduce((sum, w) => sum + (w.metrics?.intensityFactor || 0), 0) / scenario.workouts.length;
        
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Knight of Sufferlandria Quest Plan - ${scenario.name}</title>
                <style>
                    @page { margin: 1in; }
                    body { 
                        font-family: Arial, sans-serif; 
                        font-size: 12px; 
                        line-height: 1.4; 
                        color: #333;
                    }
                    .header { 
                        text-align: center; 
                        border-bottom: 2px solid #333; 
                        padding-bottom: 10px; 
                        margin-bottom: 20px; 
                    }
                    .title { 
                        font-size: 18px; 
                        font-weight: bold; 
                        margin: 0 0 5px 0; 
                    }
                    .subtitle { 
                        font-size: 14px; 
                        color: #666; 
                        margin: 0 0 10px 0; 
                    }
                    .summary { 
                        background: #f5f5f5; 
                        padding: 10px; 
                        margin-bottom: 20px; 
                        border-radius: 5px; 
                    }
                    .summary-row { 
                        display: flex; 
                        justify-content: flex-end; 
                        margin: 3px 0; 
                        gap: 10px;
                    }
                    .summary-label {
                        min-width: 160px;
                        text-align: right;
                    }
                    .summary-value {
                        font-weight: bold;
                        min-width: 300px;
                        text-align: right;
                    }
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin-bottom: 20px; 
                    }
                    th, td { 
                        border: 1px solid #ddd; 
                        padding: 8px; 
                        text-align: left; 
                    }
                    th { 
                        background-color: #f2f2f2; 
                        font-weight: bold; 
                        font-size: 11px; 
                    }
                    .workout-row { 
                        background-color: #fff; 
                    }
                    .break-row { 
                        background-color: #f9f9f9; 
                        font-style: italic; 
                    }
                    .center { 
                        text-align: center; 
                    }
                    .bold { 
                        font-weight: bold; 
                    }
                    .notes { 
                        margin-top: 20px; 
                        font-size: 11px; 
                        color: #666; 
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="title">⚔️ ASSAULT ON THE CASTLE ⚔️</div>
                    <div class="subtitle">Knight of Sufferlandria Quest Plan</div>
                    <div><strong>${scenario.name}</strong></div>
                    <div>Created: ${new Date(scenario.createdAt).toLocaleDateString()}</div>
                </div>

                <div class="summary">
                    <div class="summary-row">
                        <span class="summary-label"><strong>Total Quest Duration:</strong></span>
                        <span class="summary-value">${formatDuration(totalDuration)}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label"><strong>Total Elapsed Time:</strong></span>
                        <span class="summary-value">${formatDuration(totalDuration + (scenario.workouts.length - 1) * 10 * 60)} (including breaks)</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label"><strong>Total TSS®:</strong></span>
                        <span class="summary-value">${Math.round(totalTSS)}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label"><strong>Average IF®:</strong></span>
                        <span class="summary-value">${avgIF.toFixed(2)}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label"><strong>Power Profile:</strong></span>
                        <span class="summary-value">FTP: ${userProfile.ftp}W, AC: ${userProfile.ac}W, NM: ${userProfile.nm}W, MAP: ${userProfile.map}W</span>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="width: 8%">#</th>
                            <th style="width: 10%">Start</th>
                            <th style="width: 10%">End</th>
                            <th style="width: 32%">Workout / Break</th>
                            <th style="width: 8%">Duration</th>
                            <th style="width: 8%">TSS®</th>
                            <th style="width: 8%">IF®</th>
                            <th style="width: 8%">NP®</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${schedule.map((item, index) => {
                            if (item.type === 'workout') {
                                return `
                                    <tr class="workout-row">
                                        <td class="center bold">${item.index}</td>
                                        <td class="center">${item.startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                        <td class="center">${item.endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                        <td><strong>${item.name}</strong></td>
                                        <td class="center">${item.duration}min</td>
                                        <td class="center">${Math.round(item.tss || 0)}</td>
                                        <td class="center">${(item.intensityFactor || 0).toFixed(2)}</td>
                                        <td class="center">${Math.round(item.normalizedPower || 0)}W</td>
                                    </tr>
                                `;
                            } else {
                                return `
                                    <tr class="break-row">
                                        <td class="center">-</td>
                                        <td class="center">${item.startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                        <td class="center">${item.endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                        <td>🛑 Rest Break (Max 10 minutes allowed)</td>
                                        <td class="center">${item.duration}min</td>
                                        <td class="center">-</td>
                                        <td class="center">-</td>
                                        <td class="center">-</td>
                                    </tr>
                                `;
                            }
                        }).join('')}
                    </tbody>
                </table>

                <div class="notes">
                    <p><strong>Quest Rules (from the Ministry of Madness):</strong></p>
                    <ul>
                        <li>You must complete all 10 workouts back-to-back in the order listed above</li>
                        <li>Maximum 10 minutes rest between workouts - no more, but less is fine</li>
                        <li>All workouts must be completed in your Bicycle Torture Chamber (BTC)</li>
                        <li>No workout may be repeated or substituted during the quest</li>
                        <li>Upon completion, you must submit your ride to the Ministry of Madness for official KNIGHTHOOD recognition</li>
                    </ul>
                    <p><strong>Nutrition Strategy:</strong> Plan your fueling carefully - this is a long siege on the castle! Prepare adequate hydration and nutrition for ${Math.ceil(totalDuration / 3600)} hours of SUFFERING.</p>
                    <p><strong>May you find GLORY in your SUFFERING!</strong> - The Ministry of Madness</p>
                </div>
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
            }, 250);
        }
    };

    // Disable body scroll when modal is open
    useEffect(() => {
        const originalStyle = window.getComputedStyle(document.body).overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalStyle;
        };
    }, []);

    return (
        <>
            {/* Debug indicator */}
            <div style={{
                position: 'fixed',
                top: '10px',
                left: '10px',
                backgroundColor: 'red',
                color: 'white',
                padding: '5px',
                zIndex: 1000000,
                fontSize: '12px'
            }}>
                MODAL ACTIVE - {window.innerWidth}px
            </div>
            
            <div 
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    width: '100vw',
                    height: '100vh',
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 999999,
                    padding: '10px',
                    boxSizing: 'border-box',
                    WebkitOverflowScrolling: 'touch'
                }}
                onClick={(e) => {
                    if (e.target === e.currentTarget) {
                        onClose();
                    }
                }}
            >
            <div 
                style={{
                    backgroundColor: '#2a2a2a',
                    borderRadius: '8px',
                    padding: '15px',
                    maxWidth: '95vw',
                    width: '100%',
                    maxHeight: '95vh',
                    overflow: 'auto',
                    border: '2px solid #4CAF50',
                    boxSizing: 'border-box',
                    position: 'relative',
                    margin: 'auto',
                    WebkitOverflowScrolling: 'touch'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <h2 style={{ color: 'white', marginBottom: '20px', textAlign: 'center' }}>
                    🖨️ Print Quest Schedule
                </h2>
                
                <div style={{ marginBottom: '20px' }}>
                    <p style={{ color: '#ccc', marginBottom: '15px', textAlign: 'center' }}>
                        Generate a print-friendly assault plan for "<strong style={{ color: 'white' }}>{scenario.name}</strong>"
                    </p>
                    
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ 
                            color: 'white', 
                            display: 'block', 
                            marginBottom: '8px',
                            fontSize: '14px',
                            fontWeight: 'bold'
                        }}>
                            Quest Start Time:
                        </label>
                        <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                backgroundColor: '#333',
                                color: 'white',
                                border: '1px solid #555',
                                borderRadius: '4px',
                                fontSize: '16px'
                            }}
                        />
                    </div>
                    
                    <div style={{ 
                        backgroundColor: '#1a3d1a', 
                        padding: '12px', 
                        borderRadius: '4px',
                        marginBottom: '20px'
                    }}>
                        <p style={{ color: '#4CAF50', margin: 0, fontSize: '13px' }}>
                            📋 <strong>Your quest plan will include:</strong><br />
                            • Complete schedule with start/end times<br />
                            • 10-minute breaks between workouts<br />
                            • Workout metrics (TSS®, IF®, NP®)<br />
                            • Official rules from the Ministry of Madness
                        </p>
                    </div>
                </div>

                <div style={{ 
                    display: 'flex', 
                    gap: '15px', 
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#555',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            minWidth: '120px'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            handlePrint();
                            onClose();
                        }}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            minWidth: '160px'
                        }}
                    >
                        🖨️ Print Quest Plan
                    </button>
                </div>
            </div>
        </div>
        </>
    );
};

export default PrintQuestModal;