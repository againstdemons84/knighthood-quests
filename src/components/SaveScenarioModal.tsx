import React, { useState } from 'react';
import { Scenario, BasketState } from '../types/scenario';
import { generateScenarioId, calculateCombinedMetrics, formatDuration } from '../utils/scenarioHelpers';
import styles from './SaveScenarioModal.module.css';

interface SaveScenarioModalProps {
    basketState: BasketState;
    onSave: (scenario: Scenario) => void;
    onCancel: () => void;
    existingScenario?: Scenario | null;
}

const SaveScenarioModal: React.FC<SaveScenarioModalProps> = ({ 
    basketState, 
    onSave, 
    onCancel,
    existingScenario 
}) => {
    const [scenarioName, setScenarioName] = useState(existingScenario?.name || '');
    const [error, setError] = useState('');
    
    // Calculate metrics for display purposes only (not stored)
    const combinedMetrics = calculateCombinedMetrics(basketState.selectedWorkouts);

    const handleSave = () => {
        if (!scenarioName.trim()) {
            setError('Please enter a scenario name');
            return;
        }

        if (!basketState.isComplete) {
            setError('Please select exactly 10 workouts');
            return;
        }

        const scenario: Scenario = {
            id: existingScenario?.id || generateScenarioId(),
            name: scenarioName.trim(),
            createdAt: existingScenario?.createdAt || new Date().toISOString(),
            workouts: basketState.selectedWorkouts
            // No longer storing combinedMetrics - calculated dynamically
        };

        onSave(scenario);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            onCancel();
        }
    };

    return (
        <div 
            className={styles.modalOverlay}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onCancel();
                }
            }}
        >
            <div 
                className={styles.modalContainer}
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className={styles.modalTitle}>
                    {existingScenario ? 'Update Scenario' : 'Save New Scenario'}
                </h2>

                {/* Scenario Name Input */}
                <div className={styles.formSection}>
                    <label className={styles.formLabel}>
                        Scenario Name
                    </label>
                    <input
                        type="text"
                        value={scenarioName}
                        onChange={(e) => {
                            setScenarioName(e.target.value);
                            setError('');
                        }}
                        data-testid="scenario-name-input"
                        onKeyPress={handleKeyPress}
                        placeholder="Enter a name for your Knighthood challenge scenario..."
                        className={`${styles.formInput} ${error ? styles.formInputError : ''}`}
                        autoFocus
                    />
                    {error && (
                        <div className={styles.errorMessage}>
                            {error}
                        </div>
                    )}
                </div>

                {/* Summary */}
                <div className={styles.summarySection}>
                    <h3 className={styles.summaryTitle}>Challenge Summary</h3>
                    
                    <div className={styles.metricsGrid}>
                        <div className={styles.metricItem}>
                            <div className={styles.metricLabel}>Workouts</div>
                            <div className={styles.metricValueComplete}>
                                {basketState.selectedWorkouts.length}/10
                                {basketState.isComplete && (
                                    <span className={styles.completeIcon}>✓</span>
                                )}
                            </div>
                        </div>
                        <div className={styles.metricItem}>
                            <div className={styles.metricLabel}>Total Duration</div>
                            <div className={styles.metricValue}>
                                {formatDuration(combinedMetrics.totalDuration)}
                            </div>
                        </div>
                        <div className={styles.metricItem}>
                            <div className={styles.metricLabel}>Total TSS®</div>
                            <div className={styles.metricValue}>
                                {Math.round(combinedMetrics.totalTSS)}
                            </div>
                        </div>
                        <div className={styles.metricItem}>
                            <div className={styles.metricLabel}>Average IF®</div>
                            <div className={styles.metricValue}>
                                {combinedMetrics.averageIF.toFixed(2)}
                            </div>
                        </div>
                    </div>

                    {/* Workout List */}
                    <div className={styles.workoutListSection}>
                        <div className={styles.workoutListLabel}>
                            Selected Workouts:
                        </div>
                        <div className={styles.workoutListContainer}>
                            {basketState.selectedWorkouts.map((workout, index) => (
                                <div 
                                    key={workout.id}
                                    className={styles.workoutItem}
                                >
                                    <div>
                                        <span className={styles.workoutName}>
                                            {index + 1}. {workout.name}
                                        </span>
                                    </div>
                                    <div className={styles.workoutDuration}>
                                        {workout.metrics ? formatDuration(workout.metrics.duration) : 'N/A'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className={styles.actionButtons}>
                    <button
                        onClick={onCancel}
                        className={styles.cancelButton}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!basketState.isComplete || !scenarioName.trim()}
                        data-testid="save-scenario-modal-button"
                        className={`${styles.saveButton} ${
                            basketState.isComplete && scenarioName.trim() 
                                ? styles.saveButtonEnabled 
                                : styles.saveButtonDisabled
                        }`}
                    >
                        {existingScenario ? 'Update Scenario' : 'Save Scenario'}
                    </button>
                </div>

                <div className={styles.infoSection}>
                    <p className={styles.infoText}>
                        <strong>About the Knight of Sufferlandria Challenge:</strong><br />
                        Complete these 10 workouts back-to-back to earn your knighthood. 
                        Plan your challenge carefully - the order and combination matter for your success!
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SaveScenarioModal;