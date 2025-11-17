import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import WorkoutChart from './components/WorkoutChart';
import styles from './App.module.css';
import WorkoutSelector from './components/WorkoutSelector';
import ScenarioManager from './components/ScenarioManager';
import SaveScenarioModal from './components/SaveScenarioModal';
import UserProfileSetup from './components/UserProfileSetup';
import UserProfileManager from './components/UserProfileManager';
import WorkoutTable from './components/WorkoutTable';
import ScenarioDetailsView from './components/ScenarioDetailsView';
import SharedScenarioView from './components/SharedScenarioView';
import IntroPage from './components/IntroPage';
import Footer from './components/Footer';
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
import { useAppRouting } from './hooks/useAppRouting';
import ScenarioDetailRoute from './routes/ScenarioDetailRoute';

// Global CSS styles that need to be injected for dynamic classes
const globalStyles = `
  .workout-checkbox {
    cursor: pointer;
  }
  
  .workout-checkbox.selected {
    background-color: #4CAF50 !important;
  }
  
  .workout-checkbox.unselected {
    background-color: transparent !important;
  }
`;

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

const AppContent = () => {
    const viewport = useViewport();
    const { currentPage, scenarioId, sharedScenarioData, setPage } = useAppRouting();
    const [workoutRows, setWorkoutRows] = useState<WorkoutTableRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [basketState, setBasketState] = useState<BasketState>({ selectedWorkouts: [], isComplete: false });
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [editingScenario, setEditingScenario] = useState<Scenario | null>(null);
    const [scenarios, setScenarios] = useState<Scenario[]>([]);
    const [userProfile, setUserProfile] = useState<UserPowerProfile | null>(null);
    const [showProfileSetup, setShowProfileSetup] = useState(false);

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
            console.error(`Error loading workout data for ${workoutId}:`, error);
            return { data: null, usedOutdoor: false };
        }
    };

    // Load workout data on component mount
    useEffect(() => {
        const loadAllWorkoutData = async () => {
            setLoading(true);
            const rows: WorkoutTableRow[] = [];
            
            for (const workout of knighthoodWorkouts.workouts) {
                try {
                    const result = await loadWorkoutData(workout.id);
                    const workoutData = result.data;
                    
                    if (workoutData) {
                        const profile = getUserProfileWithDefaults();
                        const metrics = calculateAllTrainingMetrics(workoutData, profile);
                        
                        rows.push({
                            id: workout.id,
                            name: workout.name,
                            workoutData,
                            metrics: {
                                duration: formatDuration(workoutData.time[workoutData.time.length - 1] || 0),
                                tss: Math.round(metrics.trainingStressScore),
                                intensityFactor: metrics.intensityFactor,
                                normalizedPower: Math.round(metrics.normalizedPower)
                            },
                            usedOutdoorData: result.usedOutdoor
                        });
                    } else {
                        rows.push({
                            id: workout.id,
                            name: workout.name,
                            workoutData: null,
                            metrics: null,
                            error: 'Workout data not available'
                        });
                    }
                } catch (error) {
                    console.error(`Error processing workout ${workout.id}:`, error);
                    rows.push({
                        id: workout.id,
                        name: workout.name,
                        workoutData: null,
                        metrics: null,
                        error: 'Failed to load workout data'
                    });
                }
            }
            
            setWorkoutRows(rows);
            setLoading(false);
        };

        loadAllWorkoutData();
    }, []);

    // Load user profile and scenarios on mount
    useEffect(() => {
        // Always use getUserProfileWithDefaults to ensure proper migration and fallbacks
        const profile = getUserProfileWithDefaults();
        setUserProfile(profile);

        // Load saved scenarios
        const savedScenarios = loadScenarios();
        setScenarios(savedScenarios);
    }, []);

    const handleBasketChange = (newBasketState: BasketState) => {
        setBasketState(newBasketState);
    };

    const handleSaveScenario = (scenario: Scenario) => {
        let updatedScenarios: Scenario[];
        
        if (editingScenario) {
            // Update existing scenario
            updatedScenarios = scenarios.map(s => s.id === scenario.id ? scenario : s);
            setEditingScenario(null);
        } else {
            // Add new scenario
            updatedScenarios = [...scenarios, scenario];
        }
        
        setScenarios(updatedScenarios);
        saveScenarios(updatedScenarios);
        setBasketState({ selectedWorkouts: [], isComplete: false });
        setShowSaveModal(false);
        
        // Navigate to scenarios page
        setPage('scenarios');
    };

    const handleEditScenario = (scenario: Scenario) => {
        setEditingScenario(scenario);
        setBasketState({
            selectedWorkouts: scenario.workouts,
            isComplete: scenario.workouts.length === 10
        });
        setPage('selector');
    };

    const handleScenariosChange = (newScenarios: Scenario[]) => {
        setScenarios(newScenarios);
        saveScenarios(newScenarios);
    };

    const handleScenariosUpdate = (newScenarios: Scenario[]) => {
        setScenarios(newScenarios);
    };

    const handleProfileSave = (profile: UserPowerProfile) => {
        setUserProfile(profile);
        saveUserProfile(profile);
        setShowProfileSetup(false);
    };

    const handleSaveSharedScenario = (scenario: Scenario) => {
        const updatedScenarios = [...scenarios, scenario];
        setScenarios(updatedScenarios);
        saveScenarios(updatedScenarios);
        setPage('scenarios');
    };

    const handleBackToAppFromShare = () => {
        setPage('intro');
    };

    const renderNavigation = () => (
        <div className={`${styles.navigation} ${viewport.isMobile ? styles.navigationMobile : styles.navigationDesktop}`}>
            <div className={`${styles.tabContainer} ${viewport.isMobile ? styles.tabContainerMobile : ''}`}>
                    <button
                        data-testid="home-tab"
                        className={`${styles.tabButton} ${viewport.isMobile ? styles.tabButtonMobile : ''} ${currentPage === 'intro' ? 'active' : ''}`}
                        onClick={() => setPage('intro')}
                    >
                        Home
                    </button>
                    <button
                        data-testid="quest-tab"
                        className={`${styles.tabButton} ${viewport.isMobile ? styles.tabButtonMobile : ''} ${currentPage === 'selector' ? 'active' : ''}`}
                        onClick={() => {
                            setPage('selector');
                            setEditingScenario(null);
                        }}
                    >
                        {viewport.isMobile ? `Plan Quest (${basketState.selectedWorkouts.length}/10)` : `Plan Your Quest (${basketState.selectedWorkouts.length}/10)`}
                    </button>
                    <button
                        data-testid="scenarios-tab"
                        className={`${styles.tabButton} ${viewport.isMobile ? styles.tabButtonMobile : ''} ${currentPage === 'scenarios' ? 'active' : ''}`}
                        onClick={() => setPage('scenarios')}
                    >
                        {viewport.isMobile ? `Enterpainment (${scenarios.length})` : `Enterpainment (${scenarios.length})`}
                    </button>
                    <button
                        className={`${styles.tabButton} ${viewport.isMobile ? styles.tabButtonMobile : ''} ${currentPage === 'profile' ? 'active' : ''} ${isUsingDefaultProfile() ? 'warning' : ''}`}
                        onClick={() => setPage('profile')}
                    >
                        {viewport.isMobile ? (isUsingDefaultProfile() ? '⚙️!' : '⚙️') : (isUsingDefaultProfile() ? '⚙️ Profile!' : '⚙️ Profile')}
                    </button>
            </div>
        </div>
    );

    return (
        <div className={`${styles.appContainer} ${viewport.isMobile ? styles.appContainerMobile : ''}`}>
            <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
            
            <Routes>
                {/* Main application routes */}
                <Route path="/" element={
                    <>
                        {renderNavigation()}
                        <div className={viewport.isMobile ? styles.contentWrapperMobile : styles.contentWrapper}>
                            {userProfile ? (
                                <IntroPage onGetStarted={() => setPage('selector')} />
                            ) : null}
                        </div>
                        <Footer />
                    </>
                } />
                
                <Route path="/plan" element={
                    <>
                        {renderNavigation()}
                        <div className={viewport.isMobile ? styles.contentWrapperMobile : styles.contentWrapper}>
                            {userProfile ? (
                                <WorkoutSelector
                                    onBasketChange={handleBasketChange}
                                    initialBasket={basketState.selectedWorkouts}
                                    userProfile={userProfile}
                                    onSaveScenario={() => setShowSaveModal(true)}
                                    editingScenario={editingScenario}
                                    onCancelEdit={() => {
                                        setEditingScenario(null);
                                        setBasketState({ selectedWorkouts: [], isComplete: false });
                                        setPage('scenarios');
                                    }}
                                />
                            ) : null}
                        </div>
                        <Footer />
                    </>
                } />
                
                <Route path="/scenarios" element={
                    <>
                        {renderNavigation()}
                        <div className={viewport.isMobile ? styles.contentWrapperMobile : styles.contentWrapper}>
                            {userProfile ? (
                                <ScenarioManager
                                    onEditScenario={handleEditScenario}
                                    onViewScenario={(scenario) => {
                                        setPage('scenario-detail', scenario.id);
                                    }}
                                    onScenariosChange={handleScenariosChange}
                                    userProfile={userProfile}
                                />
                            ) : null}
                        </div>
                        <Footer />
                    </>
                } />
                
                <Route path="/profile" element={
                    <>
                        {renderNavigation()}
                        <div className={viewport.isMobile ? styles.contentWrapperMobile : styles.contentWrapper}>
                            {userProfile ? (
                                <UserProfileManager
                                    currentProfile={userProfile}
                                    onProfileUpdate={handleProfileSave}
                                />
                            ) : null}
                        </div>
                        <Footer />
                    </>
                } />
                
                <Route path="/scenario/:scenarioId" element={
                    <>
                        {renderNavigation()}
                        <div className={viewport.isMobile ? styles.contentWrapperMobile : styles.contentWrapper}>
                            {userProfile ? (
                                <ScenarioDetailRoute
                                    userProfile={userProfile}
                                    scenarios={scenarios}
                                    onScenariosUpdate={handleScenariosUpdate}
                                />
                            ) : null}
                        </div>
                        <Footer />
                    </>
                } />
                
                <Route path="/share/" element={
                    sharedScenarioData && userProfile ? (
                        <SharedScenarioView
                            workoutIds={sharedScenarioData.workoutIds}
                            scenarioName={sharedScenarioData.name}
                            userProfile={userProfile}
                            onSaveAsScenario={handleSaveSharedScenario}
                            onBackToApp={handleBackToAppFromShare}
                        />
                    ) : null
                } />
            </Routes>
            
            {/* Modals */}
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

const App = () => {
    return (
        <Router basename="/knighthood-quests">
            <AppContent />
        </Router>
    );
};

export default App;