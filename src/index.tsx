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
import knighthoodWorkouts from './data/knighthood-workouts.json';
import allWorkouts from './data/workouts.json';
import { calculateAllTrainingMetrics } from './utils/trainingMetrics';
import { getWorkoutData } from './data/workout-data';
import { WorkoutData } from './types/workout';
import { Scenario, BasketState } from './types/scenario';
import { getBestWorkoutData } from './utils/workoutDataHelpers';
import { UserPowerProfile } from './types/userProfile';
import { loadScenarios, saveScenarios } from './utils/scenarioHelpers';
import { getUserProfile, saveUserProfile, hasUserProfile } from './utils/userProfileHelpers';

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

type AppPage = 'browse' | 'selector' | 'scenarios' | 'scenario-detail' | 'profile-setup' | 'profile-manager' | 'profile';

const App = () => {
      const [currentPage, setCurrentPage] = useState<'browse' | 'selector' | 'scenarios' | 'scenario-detail' | 'profile-setup' | 'profile-manager' | 'profile'>('browse');
    const [workoutRows, setWorkoutRows] = useState<WorkoutTableRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [basketState, setBasketState] = useState<BasketState>({ selectedWorkouts: [], isComplete: false });
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [editingScenario, setEditingScenario] = useState<Scenario | null>(null);
    const [scenarios, setScenarios] = useState<Scenario[]>([]);
    const [userProfile, setUserProfile] = useState<UserPowerProfile | null>(null);
    const [showProfileSetup, setShowProfileSetup] = useState(false);
    const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(false);
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

    // Initialize user profile on app load
    useEffect(() => {
        const profile = getUserProfile();
        if (profile && hasUserProfile()) {
            setUserProfile(profile.powerProfile);
        } else {
            setIsFirstTimeSetup(true);
            setShowProfileSetup(true);
        }
    }, []);

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
        setCurrentPage('selector');
    };

    const handleBasketChange = (newBasketState: BasketState) => {
        setBasketState(newBasketState);
    };

    const handleProfileSave = (profile: UserPowerProfile) => {
        saveUserProfile(profile);
        setUserProfile(profile);
        setShowProfileSetup(false);
        setIsFirstTimeSetup(false);
        setLoading(true); // Trigger reload of workouts with new profile
    };

    const handleProfileUpdate = (profile: UserPowerProfile) => {
        saveUserProfile(profile);
        setUserProfile(profile);
        setLoading(true); // Trigger reload of workouts with new profile
    };

    const renderNavigation = () => (
        <div style={{ 
            backgroundColor: '#2a2a2a', 
            padding: '15px 20px',
            marginBottom: '20px',
            borderRadius: '8px',
            display: 'flex',
            gap: '15px',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap'
        }}>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <div>
                    <h2 style={{ color: 'white', margin: 0 }}>Knight of Sufferlandria Challenge</h2>
                    {userProfile && (
                        <div style={{ color: '#999', fontSize: '12px', marginTop: '2px' }}>
                            FTP: {userProfile.ftp}W | MAP: {userProfile.map}W | AC: {userProfile.ac}W | NM: {userProfile.nm}W
                        </div>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => setCurrentPage('browse')}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: currentPage === 'browse' ? '#4CAF50' : '#555',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Browse Workouts
                    </button>
                    <button
                        onClick={() => {
                            setCurrentPage('selector');
                            setEditingScenario(null);
                        }}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: currentPage === 'selector' ? '#4CAF50' : '#555',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Plan Challenge ({basketState.selectedWorkouts.length}/10)
                    </button>
                    <button
                        onClick={() => setCurrentPage('scenarios')}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: currentPage === 'scenarios' ? '#4CAF50' : '#555',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        My Scenarios ({scenarios.length})
                    </button>
                    <button
                        onClick={() => setCurrentPage('profile')}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: currentPage === 'profile' ? '#4CAF50' : '#555',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        ⚙️ Profile
                    </button>
                </div>
            </div>
            
            {currentPage === 'selector' && (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {basketState.isComplete && (
                        <button
                            onClick={() => setShowSaveModal(true)}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#4CAF50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
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
        switch (currentPage) {
            case 'selector':
                return userProfile ? (
                    <WorkoutSelector
                        onBasketChange={handleBasketChange}
                        initialBasket={basketState.selectedWorkouts}
                        userProfile={userProfile}
                    />
                ) : null;
            
            case 'scenarios':
                return userProfile ? (
                    <ScenarioManager
                        onEditScenario={handleEditScenario}
                        onViewScenario={(scenario) => {
                            setSelectedScenario(scenario);
                            setCurrentPage('scenario-detail');
                        }}
                        userProfile={userProfile}
                    />
                ) : null;
            
            case 'profile':
                return userProfile ? (
                    <UserProfileManager
                        currentProfile={userProfile}
                        onProfileUpdate={handleProfileUpdate}
                    />
                ) : null;
            
            case 'scenario-detail':
                return selectedScenario && userProfile ? (
                    <ScenarioDetailsView
                        scenario={selectedScenario}
                        userProfile={userProfile}
                        onBack={() => setCurrentPage('scenarios')}
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
            
            case 'browse':
            default:
                if (!userProfile) {
                    return (
                        <div style={{ backgroundColor: '#1a1a1a', minHeight: '100vh', padding: '20px' }}>
                            <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', paddingTop: '100px' }}>
                                <h1 style={{ color: 'white', marginBottom: '20px' }}>Setting up your Power Profile...</h1>
                                <p style={{ color: '#999' }}>Please complete your power profile setup to continue.</p>
                            </div>
                        </div>
                    );
                }
                
                if (loading) {
                    return (
                        <div style={{ backgroundColor: '#1a1a1a', minHeight: '100vh', padding: '20px' }}>
                            <h1 style={{ color: 'white', marginBottom: '20px' }}>Loading Knighthood Workouts...</h1>
                            <p style={{ color: '#999' }}>Loading workout data and calculating metrics with your power profile...</p>
                        </div>
                    );
                }

                return (
                    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                        <h1 style={{ color: 'white', marginBottom: '10px', textAlign: 'center' }}>
                            All Knighthood Workouts ({workoutRows.length} Total)
                        </h1>
                        <p style={{ color: '#999', marginBottom: '30px', textAlign: 'center' }}>
                            Browse all available Knighthood workouts and their training metrics
                        </p>
                        
                        <WorkoutTable 
                            workoutRows={workoutRows}
                            userProfile={userProfile}
                            showWorkoutProfiles={true}
                        />

                        <div style={{ 
                            marginTop: '30px', 
                            padding: '20px', 
                            backgroundColor: '#2a2a2a', 
                            borderRadius: '8px',
                            color: '#999'
                        }}>
                            <h3 style={{ color: 'white', marginBottom: '10px' }}>About Knighthood Workouts</h3>
                            <p>
                                These are the official Knighthood workouts from Wahoo SYSTM. Each workout has been analyzed 
                                using your power profile (FTP: {userProfile?.ftp}W, MAP: {userProfile?.map}W, 
                                AC: {userProfile?.ac}W, NM: {userProfile?.nm}W) to calculate Training Stress Score (TSS®), 
                                Intensity Factor (IF®), and Normalized Power (NP®).
                            </p>
                            <p style={{ marginTop: '10px', fontSize: '14px' }}>
                                <strong>Knight of Sufferlandria Challenge:</strong> Choose 10 of these workouts to complete back-to-back. 
                                Use the "Plan Challenge" tab to select your workouts and save different scenarios for comparison.
                            </p>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div style={{ backgroundColor: '#1a1a1a', minHeight: '100vh', padding: '20px' }}>
            {renderNavigation()}
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
                    isFirstTime={isFirstTimeSetup}
                />
            )}
        </div>
    );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);