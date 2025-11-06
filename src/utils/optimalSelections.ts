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
    
    // Balanced approach: normalize and score by multiple factors
    const balanced = [...validWorkouts]
        .map(workout => {
            // Normalize values (0-1 scale)
            const maxTSS = Math.max(...validWorkouts.map(w => w.tss));
            const maxDuration = Math.max(...validWorkouts.map(w => w.duration));
            const maxIF = Math.max(...validWorkouts.map(w => w.intensityFactor));
            
            const normalizedTSS = workout.tss / maxTSS;
            const normalizedDuration = workout.duration / maxDuration;
            const normalizedIF = workout.intensityFactor / maxIF;
            
            // Balanced score (lower is better for moderate challenge)
            const score = (normalizedTSS + normalizedDuration + normalizedIF) / 3;
            
            return { ...workout, balanceScore: score };
        })
        .sort((a, b) => Math.abs(a.balanceScore - 0.5) - Math.abs(b.balanceScore - 0.5)) // Closest to middle
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