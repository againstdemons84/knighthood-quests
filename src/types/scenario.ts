export interface WorkoutSelection {
    id: string;
    name: string;
    metrics: {
        duration: number; // in seconds
        tss: number;
        intensityFactor: number;
        normalizedPower: number;
    } | null;
}

export interface Scenario {
    id: string;
    name: string;
    createdAt: string;
    workouts: WorkoutSelection[];
    combinedMetrics?: {
        totalDuration: number; // in seconds (workout time only)
        totalElapsedDuration: number; // in seconds (workout time + rest periods)
        totalTSS: number;
        averageIF: number;
        totalNP: number; // average weighted by duration
    };
}

export interface BasketState {
    selectedWorkouts: WorkoutSelection[];
    isComplete: boolean;
}