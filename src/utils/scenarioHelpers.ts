import { Scenario, WorkoutSelection } from '../types/scenario';
import { getBestWorkoutData } from './workoutDataHelpers';
import { calculateAllTrainingMetrics } from './trainingMetrics';

const SCENARIOS_STORAGE_KEY = 'knighthood_scenarios';

/**
 * Load workout metrics dynamically from JSON files
 */
export const loadWorkoutMetrics = async (workoutId: string, userProfile?: any) => {
    try {
        const response = await fetch(`/data/workouts/${workoutId}.json`);
        if (!response.ok) {
            throw new Error(`Failed to load workout data for ${workoutId}`);
        }
        const rawData = await response.json();
        const result = getBestWorkoutData(rawData);
        
        if (!result.data) {
            return null;
        }

        // Calculate metrics using the training metrics utility
        const metrics = calculateAllTrainingMetrics(result.data, userProfile);
        
        return {
            duration: metrics.duration,
            tss: metrics.trainingStressScore,
            intensityFactor: metrics.intensityFactor,
            normalizedPower: metrics.normalizedPower
        };
    } catch (error) {
        console.error(`Error loading workout metrics for ${workoutId}:`, error);
        return null;
    }
};

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

/**
 * Calculate combined metrics dynamically from workout JSON files
 */
export const calculateCombinedMetricsDynamic = async (workouts: WorkoutSelection[], userProfile?: any) => {
    if (workouts.length === 0) {
        return {
            totalDuration: 0,
            totalElapsedDuration: 0,
            totalTSS: 0,
            averageIF: 0,
            totalNP: 0
        };
    }

    // Load metrics for all workouts dynamically
    const metricsPromises = workouts.map(workout => loadWorkoutMetrics(workout.id, userProfile));
    const allMetrics = await Promise.all(metricsPromises);
    
    // Filter out failed loads
    const validMetrics = allMetrics.filter(m => m !== null);
    
    if (validMetrics.length === 0) {
        return {
            totalDuration: 0,
            totalElapsedDuration: 0,
            totalTSS: 0,
            averageIF: 0,
            totalNP: 0
        };
    }
    
    const totalDuration = validMetrics.reduce((sum, m) => sum + (m?.duration || 0), 0);
    const totalTSS = validMetrics.reduce((sum, m) => sum + (m?.tss || 0), 0);
    
    // Calculate elapsed duration: total workout time + 10 minutes rest between workouts
    const restPeriods = Math.max(0, validMetrics.length - 1) * 10 * 60; // 10 minutes in seconds
    const totalElapsedDuration = totalDuration + restPeriods;

    // Calculate average IF weighted by duration
    const totalIFDuration = validMetrics.reduce((sum, m) => {
        const ifValue = m?.intensityFactor || 0;
        const duration = m?.duration || 0;
        return sum + (ifValue * duration);
    }, 0);
    const averageIF = totalDuration > 0 ? totalIFDuration / totalDuration : 0;
    
    // Calculate average NP weighted by duration  
    const totalNPDuration = validMetrics.reduce((sum, m) => {
        const npValue = m?.normalizedPower || 0;
        const duration = m?.duration || 0;
        return sum + (npValue * duration);
    }, 0);
    const totalNP = totalDuration > 0 ? totalNPDuration / totalDuration : 0;

    return {
        totalDuration,
        totalElapsedDuration,
        totalTSS,
        averageIF,
        totalNP
    };
};

/**
 * Legacy function - kept for compatibility but will use stored metrics
 */
export const calculateCombinedMetrics = (workouts: WorkoutSelection[]) => {
    const validWorkouts = workouts.filter(w => w.metrics !== null);
    
    if (validWorkouts.length === 0) {
        return {
            totalDuration: 0,
            totalElapsedDuration: 0,
            totalTSS: 0,
            averageIF: 0,
            totalNP: 0
        };
    }

    const totalDuration = validWorkouts.reduce((sum, w) => {
        const duration = w.metrics?.duration || 0;
        return sum + (isNaN(duration) ? 0 : duration);
    }, 0);
    
    const totalTSS = validWorkouts.reduce((sum, w) => {
        const tss = w.metrics?.tss || 0;
        return sum + (isNaN(tss) ? 0 : tss);
    }, 0);
    
    // Calculate elapsed duration: total workout time + 10 minutes rest between workouts
    // (no rest after the final workout)
    const restPeriods = Math.max(0, validWorkouts.length - 1) * 10 * 60; // 10 minutes in seconds
    const totalElapsedDuration = totalDuration + restPeriods;

    // Calculate average IF weighted by duration
    const totalIFDuration = validWorkouts.reduce((sum, w) => {
        const ifValue = w.metrics?.intensityFactor || 0;
        const duration = w.metrics?.duration || 0;
        const product = ifValue * duration;
        return sum + (isNaN(product) ? 0 : product);
    }, 0);
    const averageIF = totalDuration > 0 ? totalIFDuration / totalDuration : 0;
    
    // Calculate average NP weighted by duration  
    const totalNPDuration = validWorkouts.reduce((sum, w) => {
        const npValue = w.metrics?.normalizedPower || 0;
        const duration = w.metrics?.duration || 0;
        const product = npValue * duration;
        return sum + (isNaN(product) ? 0 : product);
    }, 0);
    const totalNP = totalDuration > 0 ? totalNPDuration / totalDuration : 0;

    return {
        totalDuration,
        totalElapsedDuration,
        totalTSS,
        averageIF,
        totalNP
    };
};

export const formatDuration = (seconds: number): string => {
    // Handle NaN, null, undefined, or negative values
    if (seconds == null || isNaN(seconds) || seconds < 0) {
        return '00:00';
    }
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
};

export const generateScenarioId = (): string => {
    return `scenario_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};