import { WorkoutSelection } from '../types/scenario';

export interface SortedWorkout {
    id: string;
    name: string;
    tss: number;
    duration: number;
    intensityFactor: number;
    normalizedPower: number;
}

export const generateOptimalSelections = (workouts: SortedWorkout[]) => {
    // Filter out workouts without metrics
    const validWorkouts = workouts.filter(w => w.tss > 0);
    
    if (validWorkouts.length < 10) {
        return {
            lowestTSS: [],
            highestTSS: [],
            shortestDuration: [],
            longestDuration: [],
            lowestIF: [],
            highestIF: [],
            balanced: []
        };
    }

    // Sort by different criteria and take top 10
    const lowestTSS = [...validWorkouts]
        .sort((a, b) => a.tss - b.tss)
        .slice(0, 10);
    
    const highestTSS = [...validWorkouts]
        .sort((a, b) => b.tss - a.tss)
        .slice(0, 10);
    
    const shortestDuration = [...validWorkouts]
        .sort((a, b) => a.duration - b.duration)
        .slice(0, 10);
    
    const longestDuration = [...validWorkouts]
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 10);
    
    const lowestIF = [...validWorkouts]
        .sort((a, b) => a.intensityFactor - b.intensityFactor)
        .slice(0, 10);
    
    const highestIF = [...validWorkouts]
        .sort((a, b) => b.intensityFactor - a.intensityFactor)
        .slice(0, 10);
    
    // Balanced approach: select workouts with moderate values across all metrics
    const balanced = [...validWorkouts]
        .map(workout => {
            // Normalize values (0-1 scale)
            const maxTSS = Math.max(...validWorkouts.map(w => w.tss));
            const maxDuration = Math.max(...validWorkouts.map(w => w.duration));
            const maxIF = Math.max(...validWorkouts.map(w => w.intensityFactor));
            
            const minTSS = Math.min(...validWorkouts.map(w => w.tss));
            const minDuration = Math.min(...validWorkouts.map(w => w.duration));
            const minIF = Math.min(...validWorkouts.map(w => w.intensityFactor));
            
            // Normalize to 0-1 scale using actual range
            const normalizedTSS = (workout.tss - minTSS) / (maxTSS - minTSS);
            const normalizedDuration = (workout.duration - minDuration) / (maxDuration - minDuration);
            const normalizedIF = (workout.intensityFactor - minIF) / (maxIF - minIF);
            
            // Balanced score: prefer workouts in the middle range (0.3-0.7) for each metric
            // Calculate distance from ideal middle range
            const tssDistance = Math.abs(normalizedTSS - 0.5);
            const durationDistance = Math.abs(normalizedDuration - 0.5);
            const ifDistance = Math.abs(normalizedIF - 0.5);
            
            // Balanced score (lower is better) - penalize extremes more
            const balanceScore = (tssDistance + durationDistance + ifDistance) / 3;
            
            return { ...workout, balanceScore, normalizedTSS, normalizedDuration, normalizedIF };
        })
        .sort((a, b) => a.balanceScore - b.balanceScore) // Lower score = more balanced
        .slice(0, 10);

    return {
        lowestTSS,
        highestTSS,
        shortestDuration,
        longestDuration,
        lowestIF,
        highestIF,
        balanced
    };
};

export const convertToWorkoutSelections = (sortedWorkouts: SortedWorkout[]): WorkoutSelection[] => {
    return sortedWorkouts.map(workout => ({
        id: workout.id,
        name: workout.name,
        metrics: {
            duration: workout.duration,
            tss: workout.tss,
            intensityFactor: workout.intensityFactor,
            normalizedPower: workout.normalizedPower
        }
    }));
};