import { Scenario, WorkoutSelection } from '../types/scenario';

const SCENARIOS_STORAGE_KEY = 'knighthood_scenarios';

export const saveScenarios = (scenarios: Scenario[]): void => {
    try {
        localStorage.setItem(SCENARIOS_STORAGE_KEY, JSON.stringify(scenarios));
    } catch (error) {
        console.error('Failed to save scenarios to localStorage:', error);
    }
};

export const loadScenarios = (): Scenario[] => {
    try {
        const stored = localStorage.getItem(SCENARIOS_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Failed to load scenarios from localStorage:', error);
        return [];
    }
};

export const calculateCombinedMetrics = (workouts: WorkoutSelection[]) => {
    const validWorkouts = workouts.filter(w => w.metrics !== null);
    
    if (validWorkouts.length === 0) {
        return {
            totalDuration: 0,
            totalTSS: 0,
            averageIF: 0,
            totalNP: 0
        };
    }

    const totalDuration = validWorkouts.reduce((sum, w) => sum + w.metrics!.duration, 0);
    const totalTSS = validWorkouts.reduce((sum, w) => sum + w.metrics!.tss, 0);
    
    // Calculate average IF weighted by duration
    const totalIFDuration = validWorkouts.reduce((sum, w) => 
        sum + (w.metrics!.intensityFactor * w.metrics!.duration), 0);
    const averageIF = totalDuration > 0 ? totalIFDuration / totalDuration : 0;
    
    // Calculate average NP weighted by duration  
    const totalNPDuration = validWorkouts.reduce((sum, w) => 
        sum + (w.metrics!.normalizedPower * w.metrics!.duration), 0);
    const totalNP = totalDuration > 0 ? totalNPDuration / totalDuration : 0;

    return {
        totalDuration,
        totalTSS,
        averageIF,
        totalNP
    };
};

export const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
};

export const generateScenarioId = (): string => {
    return `scenario_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};