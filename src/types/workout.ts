export interface WorkoutData {
    time: number[];
    value: number[];
    type: string[];
    __typename: string;
}

export interface WorkoutGraphTriggers {
    indoor: WorkoutData;
    outdoor: WorkoutData;
    __typename: string;
}

export interface WorkoutResponse {
    data: {
        workoutGraphTriggers: WorkoutGraphTriggers;
    };
}

// Export as module
export * from './workout';