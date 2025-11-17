import React, { useState } from 'react';
import { Scenario, WorkoutSelection } from '../types/scenario';
import { systmApi, SystmApiError } from '../services/systmApi';
import { generateScheduleItems, formatTime, formatDate } from '../utils/workoutScheduling';
import PrivacyPolicyModal from './PrivacyPolicyModal';
import styles from './WorkoutSchedulingModal.module.css';

interface WorkoutSchedulingModalProps {
    scenario: Scenario;
    isOpen: boolean;
    onClose: () => void;
}

interface FormData {
    username: string;
    password: string;
    startDate: string;
}

interface ScheduleItem {
    workout: WorkoutSelection;
    contentId: string;
    scheduledTime: string;
    rank: number;
}

type ModalStep = 'form' | 'validating' | 'confirmation' | 'scheduling' | 'results';

interface ScheduleResult {
    workout: WorkoutSelection;
    success: boolean;
    error?: string;
    agendaId?: string;
}

const WorkoutSchedulingModal: React.FC<WorkoutSchedulingModalProps> = ({
    scenario,
    isOpen,
    onClose
}) => {
    const [currentStep, setCurrentStep] = useState<ModalStep>('form');
    const [formData, setFormData] = useState<FormData>({
        username: '',
        password: '',
        startDate: ''
    });
    const [authToken, setAuthToken] = useState<string>('');
    const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
    const [results, setResults] = useState<ScheduleResult[]>([]);
    const [error, setError] = useState<string>('');
    const [showPrivacyPolicy, setShowPrivacyPolicy] = useState<boolean>(false);



    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.username || !formData.password || !formData.startDate) {
            setError('Please fill in all fields');
            return;
        }

        setError('');
        setCurrentStep('validating');

        try {
            // Authenticate with Wahoo Systm
            const token = await systmApi.authenticate({
                username: formData.username,
                password: formData.password
            });
            setAuthToken(token);
            
            // Generate schedule items with real contentIds
            const timeZone = systmApi.getUserTimeZone();
            console.log('Generating schedule items for date:', formData.startDate, 'timezone:', timeZone);
            const items = await generateScheduleItems(scenario.workouts, formData.startDate, timeZone);
            console.log('Generated schedule items:', items);
            setScheduleItems(items);
            
            if (items.length === 0) {
                throw new Error('No workouts could be scheduled. Please check that workout data is available.');
            }
            
            setCurrentStep('confirmation');
        } catch (err) {
            const errorMessage = err instanceof SystmApiError 
                ? err.message 
                : err instanceof Error 
                ? err.message
                : 'Authentication failed. Please check your credentials.';
            setError(errorMessage);
            setCurrentStep('form');
        }
    };

    const handleConfirmScheduling = async () => {
        setCurrentStep('scheduling');
        const scheduleResults: ScheduleResult[] = [];
        const timeZone = systmApi.getUserTimeZone();

        for (const item of scheduleItems) {
            try {
                const agendaId = await systmApi.scheduleWorkout(authToken, {
                    contentId: item.contentId,
                    date: item.scheduledTime,
                    timeZone: timeZone,
                    rank: item.rank
                });
                
                scheduleResults.push({
                    workout: item.workout,
                    success: true,
                    agendaId: agendaId
                });
            } catch (err) {
                const errorMessage = err instanceof SystmApiError 
                    ? err.message 
                    : 'Unknown scheduling error';
                    
                scheduleResults.push({
                    workout: item.workout,
                    success: false,
                    error: errorMessage
                });
            }
        }

        setResults(scheduleResults);
        setCurrentStep('results');
        
        // Clear sensitive data from memory
        setFormData(prev => ({ ...prev, password: '' }));
        setAuthToken('');
    };

    const handleClose = () => {
        // Clear all data including sensitive information
        setFormData({ username: '', password: '', startDate: '' });
        setAuthToken('');
        setScheduleItems([]);
        setResults([]);
        setError('');
        setCurrentStep('form');
        onClose();
    };



    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2 className={styles.title}>
                        Schedule Workouts in Wahoo Systm
                    </h2>
                    <button onClick={handleClose} className={styles.closeButton}>
                        ×
                    </button>
                </div>

                <div className={styles.content}>
                    {currentStep === 'form' && (
                        <form onSubmit={handleFormSubmit} className={styles.form}>
                            <p className={styles.description}>
                                Schedule your "{scenario.name}" workouts in your Wahoo Systm calendar.
                            </p>
                            
                            {error && (
                                <div className={styles.error}>
                                    {error}
                                </div>
                            )}

                            <div className={styles.field}>
                                <label htmlFor="username" className={styles.label}>
                                    Wahoo Systm Username (Email)
                                </label>
                                <input
                                    type="email"
                                    id="username"
                                    value={formData.username}
                                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                                    className={styles.input}
                                    required
                                    autoComplete="email"
                                />
                            </div>

                            <div className={styles.field}>
                                <label htmlFor="password" className={styles.label}>
                                    Wahoo Systm Password
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                    className={styles.input}
                                    required
                                    autoComplete="current-password"
                                />
                            </div>

                            <div className={styles.privacyNotice}>
                                <p className={styles.privacyText}>
                                    🔒 Your credentials are sent directly to Wahoo Systm and never stored on our servers.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setShowPrivacyPolicy(true)}
                                    className={styles.privacyLink}
                                >
                                    Learn more about our privacy practices
                                </button>
                            </div>

                            <div className={styles.field}>
                                <label htmlFor="startDate" className={styles.label}>
                                    Schedule Date
                                </label>
                                <input
                                    type="date"
                                    id="startDate"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                                    className={styles.input}
                                    required
                                />
                            </div>

                            <div className={styles.actions}>
                                <button type="button" onClick={handleClose} className={styles.cancelButton}>
                                    Cancel
                                </button>
                                <button type="submit" className={styles.submitButton}>
                                    Validate & Continue
                                </button>
                            </div>
                        </form>
                    )}

                    {currentStep === 'validating' && (
                        <div className={styles.loading}>
                            <div className={styles.spinner}></div>
                            <p>Validating your credentials...</p>
                        </div>
                    )}

                    {currentStep === 'confirmation' && (
                        <div className={styles.confirmation}>
                            <h3>Confirm Your Workout Schedule</h3>
                            <p className={styles.confirmDescription}>
                                The following workouts will be scheduled on {scheduleItems.length > 0 ? formatDate(scheduleItems[0].scheduledTime) : formData.startDate}:
                            </p>
                            
                            <div className={styles.scheduleList}>
                                {scheduleItems.map((item, index) => (
                                    <div key={index} className={styles.scheduleItem}>
                                        <span className={styles.workoutName}>{item.workout.name}</span>
                                        <span className={styles.scheduledTime}>{formatTime(item.scheduledTime)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className={styles.actions}>
                                <button onClick={() => setCurrentStep('form')} className={styles.cancelButton}>
                                    Back to Form
                                </button>
                                <button onClick={handleConfirmScheduling} className={styles.confirmButton}>
                                    Schedule Workouts
                                </button>
                            </div>
                        </div>
                    )}

                    {currentStep === 'scheduling' && (
                        <div className={styles.loading}>
                            <div className={styles.spinner}></div>
                            <p>Scheduling your workouts...</p>
                            <p className={styles.loadingNote}>Please wait, this may take a few moments.</p>
                        </div>
                    )}

                    {currentStep === 'results' && (
                        <div className={styles.results}>
                            <h3>Scheduling Complete</h3>
                            
                            {results.every(r => r.success) ? (
                                <div className={styles.successMessage}>
                                    ✅ All {results.length} workouts were successfully scheduled!
                                </div>
                            ) : (
                                <div className={styles.partialMessage}>
                                    ⚠️ {results.filter(r => r.success).length} of {results.length} workouts were scheduled successfully.
                                </div>
                            )}

                            <div className={styles.resultsList}>
                                {results.map((result, index) => (
                                    <div 
                                        key={index} 
                                        className={`${styles.resultItem} ${result.success ? styles.resultSuccess : styles.resultError}`}
                                    >
                                        <span className={styles.resultWorkout}>{result.workout.name}</span>
                                        <span className={styles.resultStatus}>
                                            {result.success ? '✅ Scheduled' : '❌ Failed'}
                                        </span>
                                        {result.error && (
                                            <span className={styles.resultError}>
                                                {result.error}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className={styles.actions}>
                                <button onClick={handleClose} className={styles.doneButton}>
                                    Done
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <PrivacyPolicyModal 
                isOpen={showPrivacyPolicy} 
                onClose={() => setShowPrivacyPolicy(false)} 
            />
        </div>
    );
};

export default WorkoutSchedulingModal;