import React, { useState, useEffect } from 'react';
import { Scenario } from '../types/scenario';
import { UserPowerProfile } from '../types/userProfile';
import { formatDuration } from '../utils/scenarioHelpers';
import styles from './PrintQuestModal.module.css';
import { printStyles } from './PrintQuestModal.print';

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
                <style>${printStyles}</style>
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
                            <th class="th-number">#</th>
                            <th class="th-start">Start</th>
                            <th class="th-end">End</th>
                            <th class="th-workout">Workout / Break</th>
                            <th class="th-duration">Duration</th>
                            <th class="th-tss">TSS®</th>
                            <th class="th-if">IF®</th>
                            <th class="th-np">NP®</th>
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
            <div 
                className={styles.modalOverlay}
                onClick={(e) => {
                    if (e.target === e.currentTarget) {
                        onClose();
                    }
                }}
            >
                <div 
                    className={styles.modalContainer}
                    onClick={(e) => e.stopPropagation()}
                >
                    <h2 className={styles.modalTitle}>
                        🖨️ Print Quest Schedule
                    </h2>
                    
                    <div className={styles.modalContent}>
                        <p className={styles.modalDescription}>
                            Generate a print-friendly assault plan for "<strong>{scenario.name}</strong>"
                        </p>
                    
                        <div className={styles.timeInputSection}>
                            <label className={styles.timeInputLabel}>
                                Quest Start Time:
                            </label>
                            <input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className={styles.timeInput}
                            />
                        </div>
                    
                        <div className={styles.infoBox}>
                            <p className={styles.infoText}>
                                📋 <strong>Your quest plan will include:</strong><br />
                                • Complete schedule with start/end times<br />
                                • 10-minute breaks between workouts<br />
                                • Workout metrics (TSS®, IF®, NP®)<br />
                                • Official rules from the Ministry of Madness
                            </p>
                        </div>
                    </div>

                    <div className={styles.buttonSection}>
                        <button
                            onClick={onClose}
                            className={styles.cancelButton}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                handlePrint();
                                onClose();
                            }}
                            className={styles.printButton}
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