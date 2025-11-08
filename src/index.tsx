import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import WorkoutChart from './components/WorkoutChart';
import WorkoutSelector from './components/WorkoutSelector';
import ScenarioManager from './components/ScenarioManager';
import SaveScenarioModal from './components/SaveScenarioModal';
import UserProfileSetup from './components/UserProfileSetup';
import UserProfileManager from './components/UserProfileManager';
import WorkoutTable from './components/WorkoutTable';
import ScenarioDetailsView from './components/ScenarioDetailsView';
import SharedScenarioView from './components/SharedScenarioView';
import IntroPage from './components/IntroPage';
import knighthoodWorkouts from './data/knighthood-workouts.json';
import allWorkouts from './data/workouts.json';
import { calculateAllTrainingMetrics } from './utils/trainingMetrics';
import { getWorkoutData } from './data/workout-data';
import { WorkoutData } from './types/workout';
import { Scenario, BasketState } from './types/scenario';
import { getBestWorkoutData } from './utils/workoutDataHelpers';
import { UserPowerProfile } from './types/userProfile';
import { loadScenarios, saveScenarios } from './utils/scenarioHelpers';
import { getUserProfile, saveUserProfile, hasUserProfile, getUserProfileWithDefaults, isUsingDefaultProfile } from './utils/userProfileHelpers';
import { useViewport } from './hooks/useViewport';
import { useUrlFragment } from './hooks/useUrlFragment';

interface KnighthoodWorkout {
    id: string;
    name: string;
}

interface WorkoutTableRow {
    id: string;
    name: string;
    workoutData: WorkoutData | null;
    metrics: {
        duration: string;
        tss: number;
        intensityFactor: number;
        normalizedPower: number;
    } | null;
    error?: string;
    usedOutdoorData?: boolean;
}

const App = () => {
    const viewport = useViewport();
    const { currentPage, scenarioId, sharedScenarioData, setPage } = useUrlFragment();
    const [workoutRows, setWorkoutRows] = useState<WorkoutTableRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [basketState, setBasketState] = useState<BasketState>({ selectedWorkouts: [], isComplete: false });
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [editingScenario, setEditingScenario] = useState<Scenario | null>(null);
    const [scenarios, setScenarios] = useState<Scenario[]>([]);
    const [userProfile, setUserProfile] = useState<UserPowerProfile | null>(null);
    const [showProfileSetup, setShowProfileSetup] = useState(false);
    const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);

    const formatDuration = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
    };

    const findWorkoutTitle = (contentId: string): string => {
        const workout = allWorkouts.data.library.content.find((item: any) => item.id === contentId);
        return workout?.name || 'Unknown Workout';
    };

    const loadWorkoutData = async (workoutId: string): Promise<{ data: WorkoutData | null; usedOutdoor: boolean }> => {
        try {
            // Load the workout data from imported modules
            const rawData = getWorkoutData(workoutId);
            if (!rawData) {
                throw new Error(`Workout data not found for ${workoutId}`);
            }
            const result = getBestWorkoutData(rawData);
            return {
                data: result.data,
                usedOutdoor: result.usedOutdoor
            };
        } catch (error) {
            console.error(`Error loading workout ${workoutId}:`, error);
            return { data: null, usedOutdoor: false };
        }
    };

    // Load selected scenario based on URL fragment
    useEffect(() => {
        if (scenarioId && scenarios.length > 0) {
            const scenario = scenarios.find(s => s.id === scenarioId);
            setSelectedScenario(scenario || null);
        } else if (!scenarioId) {
            setSelectedScenario(null);
        }
    }, [scenarioId, scenarios]);

    // Initialize user profile on app load
    useEffect(() => {
        // Always use profile with defaults - no setup required
        const profile = getUserProfileWithDefaults();
        setUserProfile(profile);
    }, []); // Add dependency on sharedScenarioData

    useEffect(() => {
        const loadAllWorkouts = async () => {
            if (!userProfile) return; // Don't load workouts until profile is available

            const rows: WorkoutTableRow[] = [];

            for (const workout of knighthoodWorkouts.workouts) {
                const title = findWorkoutTitle(workout.id);
                const workoutResult = await loadWorkoutData(workout.id);
                
                let metrics = null;
                if (workoutResult.data) {
                    try {
                        const calculatedMetrics = calculateAllTrainingMetrics(workoutResult.data, userProfile);
                        metrics = {
                            duration: formatDuration(calculatedMetrics.duration),
                            tss: calculatedMetrics.trainingStressScore,
                            intensityFactor: calculatedMetrics.intensityFactor,
                            normalizedPower: calculatedMetrics.normalizedPower
                        };
                    } catch (error) {
                        console.error(`Error calculating metrics for ${workout.id}:`, error);
                    }
                }

                rows.push({
                    id: workout.id,
                    name: title,
                    workoutData: workoutResult.data,
                    metrics,
                    error: !workoutResult.data ? 'Workout data not available' : undefined,
                    usedOutdoorData: workoutResult.usedOutdoor
                });
            }

            setWorkoutRows(rows);
            setLoading(false);
        };

        loadAllWorkouts();
    }, [userProfile]);

    useEffect(() => {
        const savedScenarios = loadScenarios();
        setScenarios(savedScenarios);
    }, []);

    const handleSaveScenario = (scenario: Scenario) => {
        const existingIndex = scenarios.findIndex(s => s.id === scenario.id);
        let updatedScenarios;
        
        if (existingIndex >= 0) {
            updatedScenarios = [...scenarios];
            updatedScenarios[existingIndex] = scenario;
        } else {
            updatedScenarios = [...scenarios, scenario];
        }
        
        setScenarios(updatedScenarios);
        saveScenarios(updatedScenarios);
        setShowSaveModal(false);
        setEditingScenario(null);
        
        // Clear basket after saving
        setBasketState({ selectedWorkouts: [], isComplete: false });
    };

    const handleEditScenario = (scenario: Scenario) => {
        setEditingScenario(scenario);
        setBasketState({
            selectedWorkouts: scenario.workouts,
            isComplete: scenario.workouts.length === 10
        });
        setPage('selector');
    };

    const handleBasketChange = (newBasketState: BasketState) => {
        setBasketState(newBasketState);
    };

    const handleProfileSave = (profile: UserPowerProfile) => {
        saveUserProfile(profile);
        setUserProfile(profile);
        setShowProfileSetup(false);
        setLoading(true); // Trigger reload of workouts with new profile
    };

    const handleProfileUpdate = (profile: UserPowerProfile) => {
        saveUserProfile(profile);
        setUserProfile(profile);
        setLoading(true); // Trigger reload of workouts with new profile
    };

    const handleSaveSharedScenario = (scenario: Scenario) => {
        const updatedScenarios = [...scenarios, scenario];
        setScenarios(updatedScenarios);
        saveScenarios(updatedScenarios);
    };

    const handleBackToAppFromShare = () => {
        // Navigate to scenarios page (this will clear the shared scenario)
        setPage('scenarios');
    };

    const renderNavigation = () => (
        <div style={{ 
            backgroundColor: '#2a2a2a', 
            padding: viewport.isMobile ? '12px 12px' : '15px 20px',
            marginTop: viewport.isMobile ? '0' : '20px',
            marginLeft: viewport.isMobile ? '12px' : '20px',
            marginRight: viewport.isMobile ? '12px' : '20px',
            marginBottom: viewport.isMobile ? '12px' : '20px',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: viewport.isMobile ? 'column' : 'row',
            gap: viewport.isMobile ? '12px' : '15px',
            alignItems: viewport.isMobile ? 'stretch' : 'center',
            justifyContent: 'space-between'
        }}>
            <div style={{ 
                display: 'flex', 
                flexDirection: viewport.isMobile ? 'column' : 'row',
                gap: viewport.isMobile ? '8px' : '15px', 
                alignItems: viewport.isMobile ? 'center' : 'center',
                textAlign: viewport.isMobile ? 'center' : 'left'
            }}>
                <div>
                    <h2 style={{ 
                        color: 'white', 
                        margin: 0,
                        fontSize: viewport.isMobile ? '18px' : '24px'
                    }}>
                        {viewport.isMobile ? 'Knighthood Challenge' : 'Knight of Sufferlandria Challenge'}
                    </h2>
                    {userProfile && (
                        <div style={{ 
                            color: '#999', 
                            fontSize: viewport.isMobile ? '10px' : '12px', 
                            marginTop: '2px'
                        }}>
                            {viewport.isMobile ? 
                                `FTP: ${userProfile.ftp}W | MAP: ${userProfile.map}W` :
                                `FTP: ${userProfile.ftp}W | MAP: ${userProfile.map}W | AC: ${userProfile.ac}W | NM: ${userProfile.nm}W`
                            }
                            {isUsingDefaultProfile() && (
                                <span style={{ 
                                    color: '#FFA726', 
                                    marginLeft: '8px',
                                    fontSize: viewport.isMobile ? '9px' : '11px'
                                }}>
                                    (Using defaults - customize in Profile)
                                </span>
                            )}
                        </div>
                    )}
                </div>
                <div style={{ 
                    display: 'flex', 
                    gap: viewport.isMobile ? '8px' : '10px',
                    flexWrap: 'wrap',
                    justifyContent: viewport.isMobile ? 'center' : 'flex-start'
                }}>
                    <button
                        onClick={() => setPage('intro')}
                        style={{
                            padding: viewport.isMobile ? '12px 16px' : '8px 16px',
                            backgroundColor: currentPage === 'intro' ? '#4CAF50' : '#555',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: viewport.isMobile ? '14px' : '13px',
                            minHeight: viewport.isMobile ? '44px' : 'auto',
                            flex: viewport.isMobile ? '1' : 'none'
                        }}
                    >
                        {viewport.isMobile ? 'Home' : 'Home'}
                    </button>
                    <button
                        onClick={() => {
                            setPage('selector');
                            setEditingScenario(null);
                        }}
                        style={{
                            padding: viewport.isMobile ? '12px 16px' : '8px 16px',
                            backgroundColor: currentPage === 'selector' ? '#4CAF50' : '#555',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: viewport.isMobile ? '14px' : '13px',
                            minHeight: viewport.isMobile ? '44px' : 'auto',
                            flex: viewport.isMobile ? '1' : 'none'
                        }}
                    >
                        {viewport.isMobile ? `Plan (${basketState.selectedWorkouts.length}/10)` : `Plan Challenge (${basketState.selectedWorkouts.length}/10)`}
                    </button>
                    <button
                        onClick={() => setPage('scenarios')}
                        style={{
                            padding: viewport.isMobile ? '12px 16px' : '8px 16px',
                            backgroundColor: currentPage === 'scenarios' ? '#4CAF50' : '#555',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: viewport.isMobile ? '14px' : '13px',
                            minHeight: viewport.isMobile ? '44px' : 'auto',
                            flex: viewport.isMobile ? '1' : 'none'
                        }}
                    >
                        {viewport.isMobile ? `Saved (${scenarios.length})` : `My Scenarios (${scenarios.length})`}
                    </button>
                    <button
                        onClick={() => setPage('profile')}
                        style={{
                            padding: viewport.isMobile ? '12px 16px' : '8px 16px',
                            backgroundColor: currentPage === 'profile' ? '#4CAF50' : (isUsingDefaultProfile() ? '#FF9800' : '#555'),
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: viewport.isMobile ? '14px' : '13px',
                            minHeight: viewport.isMobile ? '44px' : 'auto',
                            flex: viewport.isMobile ? '1' : 'none'
                        }}
                    >
                        {viewport.isMobile ? (isUsingDefaultProfile() ? '⚙️!' : '⚙️') : (isUsingDefaultProfile() ? '⚙️ Profile!' : '⚙️ Profile')}
                    </button>
                </div>
            </div>
            
            {currentPage === 'selector' && (
                <div style={{ 
                    display: 'flex', 
                    gap: viewport.isMobile ? '8px' : '10px', 
                    alignItems: 'center',
                    justifyContent: viewport.isMobile ? 'center' : 'flex-start',
                    width: viewport.isMobile ? '100%' : 'auto'
                }}>
                    {basketState.isComplete && (
                        <button
                            onClick={() => setShowSaveModal(true)}
                            style={{
                                padding: viewport.isMobile ? '14px 24px' : '10px 20px',
                                backgroundColor: '#4CAF50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: viewport.isMobile ? '16px' : '14px',
                                minHeight: viewport.isMobile ? '48px' : 'auto',
                                flex: viewport.isMobile ? '1' : 'none'
                            }}
                        >
                            {editingScenario ? 'Update Scenario' : 'Save Scenario'}
                        </button>
                    )}
                    {editingScenario && (
                        <button
                            onClick={() => {
                                setEditingScenario(null);
                                setBasketState({ selectedWorkouts: [], isComplete: false });
                            }}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#666',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel Edit
                        </button>
                    )}
                </div>
            )}
        </div>
    );

    const renderContent = () => {
        const wrapContent = (content: JSX.Element | null) => (
            <div style={{ 
                margin: viewport.isMobile ? '0 12px 12px 12px' : '0 20px 20px 20px'
            }}>
                {content}
            </div>
        );

        switch (currentPage) {
            case 'selector':
                return userProfile ? wrapContent(
                    <WorkoutSelector
                        onBasketChange={handleBasketChange}
                        initialBasket={basketState.selectedWorkouts}
                        userProfile={userProfile}
                    />
                ) : null;
            
            case 'scenarios':
                return userProfile ? wrapContent(
                    <ScenarioManager
                        onEditScenario={handleEditScenario}
                        onViewScenario={(scenario) => {
                            setPage('scenario-detail', scenario.id);
                        }}
                        userProfile={userProfile}
                    />
                ) : null;
            
            case 'profile':
                return userProfile ? wrapContent(
                    <UserProfileManager
                        currentProfile={userProfile}
                        onProfileUpdate={handleProfileUpdate}
                    />
                ) : null;
            
            case 'scenario-detail':
                return selectedScenario && userProfile ? wrapContent(
                    <ScenarioDetailsView
                        scenario={selectedScenario}
                        userProfile={userProfile}
                        onBack={() => setPage('scenarios')}
                        onScenarioUpdate={(updatedScenario) => {
                            setSelectedScenario(updatedScenario);
                            // Also update the scenarios list in case we go back
                            const updatedScenarios = scenarios.map(s => 
                                s.id === updatedScenario.id ? updatedScenario : s
                            );
                            setScenarios(updatedScenarios);
                        }}
                    />
                ) : null;
            
            case 'shared-scenario':
                return sharedScenarioData && userProfile ? (
                    <SharedScenarioView
                        workoutIds={sharedScenarioData.workoutIds}
                        scenarioName={sharedScenarioData.name}
                        userProfile={userProfile}
                        onSaveAsScenario={handleSaveSharedScenario}
                        onBackToApp={handleBackToAppFromShare}
                    />
                ) : null;
            
            case 'intro':
            default:
                return userProfile ? wrapContent(
                    <IntroPage 
                        onGetStarted={() => setPage('selector')}
                    />
                ) : null;
        }
    };

    return (
        <div style={{ backgroundColor: '#1a1a1a', minHeight: '100vh', padding: '0', paddingTop: viewport.isMobile ? '12px' : '0' }}>
            {currentPage !== 'shared-scenario' && renderNavigation()}
            {renderContent()}
            
            {showSaveModal && (
                <SaveScenarioModal
                    basketState={basketState}
                    onSave={handleSaveScenario}
                    onCancel={() => {
                        setShowSaveModal(false);
                        setEditingScenario(null);
                    }}
                    existingScenario={editingScenario}
                />
            )}
            
            {showProfileSetup && (
                <UserProfileSetup
                    onProfileSave={handleProfileSave}
                    isFirstTime={false}
                />
            )}
        </div>
    );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);