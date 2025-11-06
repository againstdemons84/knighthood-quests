/**
 * Utility functions for handling workout data with indoor/outdoor fallback logic
 */

export interface WorkoutDataResult {
    data: any;
    usedOutdoor: boolean;
}

/**
 * Check if all values in the workout data are zero
 */
function hasAllZeroValues(workoutData: any): boolean {
    if (!workoutData?.value || !Array.isArray(workoutData.value)) {
        return true;
    }
    return workoutData.value.every((val: number) => val === 0);
}

/**
 * Get the best available workout data, preferring indoor but falling back to outdoor if indoor has all zeros
 */
export function getBestWorkoutData(rawData: any): WorkoutDataResult {
    const indoor = rawData?.data?.workoutGraphTriggers?.indoor;
    const outdoor = rawData?.data?.workoutGraphTriggers?.outdoor;

    // Prefer indoor data if it exists and has non-zero values
    if (indoor && !hasAllZeroValues(indoor)) {
        return {
            data: indoor,
            usedOutdoor: false
        };
    }

    // Fallback to outdoor data if available
    if (outdoor) {
        return {
            data: outdoor,
            usedOutdoor: true
        };
    }

    // Return indoor data even if it's all zeros (better than nothing)
    return {
        data: indoor || null,
        usedOutdoor: false
    };
}