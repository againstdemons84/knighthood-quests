import React, { useState, useEffect } from 'react';
import { Scenario } from '../types/scenario';
import { loadScenarios, saveScenarios, formatDuration } from '../utils/scenarioHelpers';

interface ScenarioManagerProps {
    onEditScenario: (scenario: Scenario) => void;
    onViewScenario?: (scenario: Scenario) => void;
}

const ScenarioManager: React.FC<ScenarioManagerProps> = ({ onEditScenario, onViewScenario }) => {
    const [scenarios, setScenarios] = useState<Scenario[]>([]);
    const [selectedScenarios, setSelectedScenarios] = useState<Set<string>>(new Set());
    const [sortBy, setSortBy] = useState<'name' | 'created' | 'duration' | 'tss' | 'if'>('created');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    useEffect(() => {
        const savedScenarios = loadScenarios();
        setScenarios(savedScenarios);
    }, []);

    const deleteScenario = (scenarioId: string) => {
        if (window.confirm('Are you sure you want to delete this scenario?')) {
            const updatedScenarios = scenarios.filter(s => s.id !== scenarioId);
            setScenarios(updatedScenarios);
            saveScenarios(updatedScenarios);
            setSelectedScenarios(prev => {
                const newSet = new Set(prev);
                newSet.delete(scenarioId);
                return newSet;
            });
        }
    };

    const duplicateScenario = (scenario: Scenario) => {
        const duplicatedScenario: Scenario = {
            ...scenario,
            id: `scenario_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            name: `${scenario.name} (Copy)`,
            createdAt: new Date().toISOString()
        };
        
        const updatedScenarios = [...scenarios, duplicatedScenario];
        setScenarios(updatedScenarios);
        saveScenarios(updatedScenarios);
    };

    const toggleScenarioSelection = (scenarioId: string) => {
        setSelectedScenarios(prev => {
            const newSet = new Set(prev);
            if (newSet.has(scenarioId)) {
                newSet.delete(scenarioId);
            } else {
                newSet.add(scenarioId);
            }
            return newSet;
        });
    };

    const clearSelection = () => {
        setSelectedScenarios(new Set());
    };

    const sortedScenarios = [...scenarios].sort((a, b) => {
        let aValue, bValue;
        
        switch (sortBy) {
            case 'name':
                aValue = a.name;
                bValue = b.name;
                break;
            case 'created':
                aValue = new Date(a.createdAt).getTime();
                bValue = new Date(b.createdAt).getTime();
                break;
            case 'duration':
                aValue = a.combinedMetrics.totalDuration;
                bValue = b.combinedMetrics.totalDuration;
                break;
            case 'tss':
                aValue = a.combinedMetrics.totalTSS;
                bValue = b.combinedMetrics.totalTSS;
                break;
            case 'if':
                aValue = a.combinedMetrics.averageIF;
                bValue = b.combinedMetrics.averageIF;
                break;
            default:
                return 0;
        }
        
        if (typeof aValue === 'string') {
            return sortOrder === 'asc' 
                ? aValue.localeCompare(bValue as string)
                : (bValue as string).localeCompare(aValue);
        } else {
            return sortOrder === 'asc' 
                ? (aValue as number) - (bValue as number)
                : (bValue as number) - (aValue as number);
        }
    });

    const selectedScenariosList = scenarios.filter(s => selectedScenarios.has(s.id));

    return (
        <div style={{ backgroundColor: '#1a1a1a', minHeight: '100vh', padding: '20px' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                <h1 style={{ color: 'white', marginBottom: '10px' }}>
                    Your Knighthood Challenge Scenarios
                </h1>
                <p style={{ color: '#999', marginBottom: '30px' }}>
                    Manage and compare your different 10-workout combinations for the Knight of Sufferlandria challenge
                </p>

                {/* Comparison Section */}
                {selectedScenarios.size > 0 && (
                    <div style={{ 
                        backgroundColor: '#2a2a2a', 
                        padding: '20px', 
                        borderRadius: '8px',
                        marginBottom: '20px',
                        border: '1px solid #333'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 style={{ color: 'white', margin: 0 }}>
                                Comparing {selectedScenarios.size} Scenario{selectedScenarios.size > 1 ? 's' : ''}
                            </h3>
                            <button
                                onClick={clearSelection}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#555',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Clear Selection
                            </button>
                        </div>
                        
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ 
                                width: '100%', 
                                borderCollapse: 'collapse',
                                backgroundColor: '#333',
                                borderRadius: '4px',
                                overflow: 'hidden'
                            }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#444' }}>
                                        <th style={{ padding: '12px', color: 'white', textAlign: 'left' }}>Scenario</th>
                                        <th style={{ padding: '12px', color: 'white', textAlign: 'center' }}>Duration</th>
                                        <th style={{ padding: '12px', color: 'white', textAlign: 'center' }}>TSS®</th>
                                        <th style={{ padding: '12px', color: 'white', textAlign: 'center' }}>Avg IF®</th>
                                        <th style={{ padding: '12px', color: 'white', textAlign: 'center' }}>Avg NP®</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedScenariosList.map((scenario, index) => (
                                        <tr 
                                            key={scenario.id}
                                            style={{ 
                                                backgroundColor: index % 2 === 0 ? '#333' : '#3a3a3a'
                                            }}
                                        >
                                            <td style={{ padding: '12px', color: 'white' }}>
                                                <strong>{scenario.name}</strong>
                                            </td>
                                            <td style={{ padding: '12px', color: 'white', textAlign: 'center' }}>
                                                {formatDuration(scenario.combinedMetrics.totalDuration)}
                                            </td>
                                            <td style={{ padding: '12px', color: 'white', textAlign: 'center' }}>
                                                {Math.round(scenario.combinedMetrics.totalTSS)}
                                            </td>
                                            <td style={{ padding: '12px', color: 'white', textAlign: 'center' }}>
                                                {scenario.combinedMetrics.averageIF.toFixed(2)}
                                            </td>
                                            <td style={{ padding: '12px', color: 'white', textAlign: 'center' }}>
                                                {Math.round(scenario.combinedMetrics.totalNP)}W
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Controls */}
                <div style={{ 
                    display: 'flex', 
                    gap: '20px', 
                    marginBottom: '20px',
                    flexWrap: 'wrap',
                    alignItems: 'center'
                }}>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        style={{
                            padding: '10px',
                            backgroundColor: '#333',
                            color: 'white',
                            border: '1px solid #555',
                            borderRadius: '4px'
                        }}
                    >
                        <option value="created">Sort by Created Date</option>
                        <option value="name">Sort by Name</option>
                        <option value="duration">Sort by Duration</option>
                        <option value="tss">Sort by TSS</option>
                        <option value="if">Sort by IF</option>
                    </select>
                    
                    <button
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        style={{
                            padding: '10px 15px',
                            backgroundColor: '#444',
                            color: 'white',
                            border: '1px solid #555',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        {sortOrder === 'asc' ? '↑' : '↓'}
                    </button>

                    {selectedScenarios.size > 0 && (
                        <div style={{ color: '#999', fontSize: '14px' }}>
                            {selectedScenarios.size} scenario{selectedScenarios.size > 1 ? 's' : ''} selected for comparison
                        </div>
                    )}
                </div>

                {/* Scenarios List */}
                {scenarios.length === 0 ? (
                    <div style={{ 
                        backgroundColor: '#2a2a2a', 
                        padding: '40px', 
                        borderRadius: '8px',
                        textAlign: 'center'
                    }}>
                        <h3 style={{ color: 'white', marginBottom: '10px' }}>No Scenarios Yet</h3>
                        <p style={{ color: '#999', marginBottom: '20px' }}>
                            Create your first Knighthood challenge scenario by selecting 10 workouts.
                        </p>
                    </div>
                ) : (
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
                                    <th style={{ padding: '15px', color: 'white', textAlign: 'center', borderBottom: '2px solid #444', width: '60px' }}>
                                        Compare
                                    </th>
                                    <th style={{ padding: '15px', color: 'white', textAlign: 'left', borderBottom: '2px solid #444' }}>
                                        Scenario
                                    </th>
                                    <th style={{ padding: '15px', color: 'white', textAlign: 'center', borderBottom: '2px solid #444' }}>
                                        Workouts
                                    </th>
                                    <th style={{ padding: '15px', color: 'white', textAlign: 'center', borderBottom: '2px solid #444' }}>
                                        Duration
                                    </th>
                                    <th style={{ padding: '15px', color: 'white', textAlign: 'center', borderBottom: '2px solid #444' }}>
                                        TSS®
                                    </th>
                                    <th style={{ padding: '15px', color: 'white', textAlign: 'center', borderBottom: '2px solid #444' }}>
                                        Avg IF®
                                    </th>
                                    <th style={{ padding: '15px', color: 'white', textAlign: 'center', borderBottom: '2px solid #444' }}>
                                        Avg NP®
                                    </th>
                                    <th style={{ padding: '15px', color: 'white', textAlign: 'center', borderBottom: '2px solid #444' }}>
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedScenarios.map((scenario, index) => {
                                    const isSelected = selectedScenarios.has(scenario.id);
                                    
                                    return (
                                        <tr 
                                            key={scenario.id}
                                            style={{ 
                                                borderBottom: index < sortedScenarios.length - 1 ? '1px solid #333' : 'none',
                                                backgroundColor: isSelected ? '#1e3a4d' : (index % 2 === 0 ? '#2a2a2a' : '#252525')
                                            }}
                                        >
                                            <td style={{ padding: '15px', textAlign: 'center' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleScenarioSelection(scenario.id)}
                                                    style={{
                                                        transform: 'scale(1.2)',
                                                        cursor: 'pointer'
                                                    }}
                                                />
                                            </td>
                                            <td style={{ padding: '15px', color: 'white', verticalAlign: 'top' }}>
                                                <div>
                                                    <strong>{scenario.name}</strong>
                                                    <div style={{ color: '#999', fontSize: '12px', marginTop: '4px' }}>
                                                        Created: {new Date(scenario.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '15px', color: 'white', textAlign: 'center', verticalAlign: 'middle' }}>
                                                {scenario.workouts.length}/10
                                            </td>
                                            <td style={{ padding: '15px', color: 'white', textAlign: 'center', verticalAlign: 'middle' }}>
                                                {formatDuration(scenario.combinedMetrics.totalDuration)}
                                            </td>
                                            <td style={{ padding: '15px', color: 'white', textAlign: 'center', verticalAlign: 'middle' }}>
                                                {Math.round(scenario.combinedMetrics.totalTSS)}
                                            </td>
                                            <td style={{ padding: '15px', color: 'white', textAlign: 'center', verticalAlign: 'middle' }}>
                                                {scenario.combinedMetrics.averageIF.toFixed(2)}
                                            </td>
                                            <td style={{ padding: '15px', color: 'white', textAlign: 'center', verticalAlign: 'middle' }}>
                                                {Math.round(scenario.combinedMetrics.totalNP)}W
                                            </td>
                                            <td style={{ padding: '15px', textAlign: 'center', verticalAlign: 'middle' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                    <button
                                                        onClick={() => onViewScenario?.(scenario)}
                                                        style={{
                                                            padding: '6px 12px',
                                                            backgroundColor: '#4CAF50',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '12px'
                                                        }}
                                                    >
                                                        View
                                                    </button>
                                                    <button
                                                        onClick={() => onEditScenario(scenario)}
                                                        style={{
                                                            padding: '6px 12px',
                                                            backgroundColor: '#2196F3',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '12px'
                                                        }}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => duplicateScenario(scenario)}
                                                        style={{
                                                            padding: '6px 12px',
                                                            backgroundColor: '#FF9800',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '12px'
                                                        }}
                                                    >
                                                        Copy
                                                    </button>
                                                    <button
                                                        onClick={() => deleteScenario(scenario.id)}
                                                        style={{
                                                            padding: '6px 12px',
                                                            backgroundColor: '#d32f2f',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '12px'
                                                        }}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScenarioManager;