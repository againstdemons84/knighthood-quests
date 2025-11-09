import React, { useState } from 'react';
import { Scenario, BasketState } from '../types/scenario';
import { generateScenarioId, calculateCombinedMetrics, formatDuration } from '../utils/scenarioHelpers';

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
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onCancel();
                }
            }}
        >
            <div 
                style={{
                    backgroundColor: '#2a2a2a',
                    padding: '30px',
                    borderRadius: '8px',
                    maxWidth: '600px',
                    width: '90%',
                    maxHeight: '80vh',
                    overflowY: 'auto'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <h2 style={{ color: 'white', marginBottom: '20px', marginTop: 0 }}>
                    {existingScenario ? 'Update Scenario' : 'Save New Scenario'}
                </h2>

                {/* Scenario Name Input */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', color: '#999', marginBottom: '8px' }}>
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
                        style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: '#333',
                            color: 'white',
                            border: error ? '2px solid #d32f2f' : '1px solid #555',
                            borderRadius: '4px',
                            fontSize: '16px'
                        }}
                        autoFocus
                    />
                    {error && (
                        <div style={{ color: '#d32f2f', fontSize: '14px', marginTop: '5px' }}>
                            {error}
                        </div>
                    )}
                </div>

                {/* Summary */}
                <div style={{ 
                    backgroundColor: '#333', 
                    padding: '20px', 
                    borderRadius: '8px',
                    marginBottom: '20px'
                }}>
                    <h3 style={{ color: 'white', margin: '0 0 15px 0' }}>Challenge Summary</h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                        <div>
                            <div style={{ color: '#999', fontSize: '14px' }}>Workouts</div>
                            <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
                                {basketState.selectedWorkouts.length}/10
                                {basketState.isComplete && (
                                    <span style={{ color: '#4CAF50', marginLeft: '8px' }}>✓</span>
                                )}
                            </div>
                        </div>
                        <div>
                            <div style={{ color: '#999', fontSize: '14px' }}>Total Duration</div>
                            <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
                                {formatDuration(combinedMetrics.totalDuration)}
                            </div>
                        </div>
                        <div>
                            <div style={{ color: '#999', fontSize: '14px' }}>Total TSS®</div>
                            <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
                                {Math.round(combinedMetrics.totalTSS)}
                            </div>
                        </div>
                        <div>
                            <div style={{ color: '#999', fontSize: '14px' }}>Average IF®</div>
                            <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
                                {combinedMetrics.averageIF.toFixed(2)}
                            </div>
                        </div>
                    </div>

                    {/* Workout List */}
                    <div style={{ marginTop: '15px' }}>
                        <div style={{ color: '#999', fontSize: '14px', marginBottom: '10px' }}>
                            Selected Workouts:
                        </div>
                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            {basketState.selectedWorkouts.map((workout, index) => (
                                <div 
                                    key={workout.id}
                                    style={{
                                        padding: '8px 12px',
                                        backgroundColor: '#444',
                                        borderRadius: '4px',
                                        marginBottom: '4px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    <div>
                                        <span style={{ color: 'white', fontSize: '14px' }}>
                                            {index + 1}. {workout.name}
                                        </span>
                                    </div>
                                    <div style={{ color: '#999', fontSize: '12px' }}>
                                        {workout.metrics ? formatDuration(workout.metrics.duration) : 'N/A'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onCancel}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#555',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '16px'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!basketState.isComplete || !scenarioName.trim()}
                        data-testid="save-scenario-modal-button"
                        style={{
                            padding: '12px 24px',
                            backgroundColor: basketState.isComplete && scenarioName.trim() ? '#4CAF50' : '#555',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: basketState.isComplete && scenarioName.trim() ? 'pointer' : 'not-allowed',
                            fontSize: '16px',
                            fontWeight: 'bold'
                        }}
                    >
                        {existingScenario ? 'Update Scenario' : 'Save Scenario'}
                    </button>
                </div>

                <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#1a3d1a', borderRadius: '4px' }}>
                    <p style={{ color: '#4CAF50', margin: 0, fontSize: '14px' }}>
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