// Utility functions for workout scheduling

import { WorkoutSelection } from '../types/scenario';

interface WorkoutMetadata {
    id: string;
    contentId: string;
    workoutId: string;
    workoutName: string;
    fetchedAt: string;
    source: string;
}

interface WorkoutData {
    data: any; // Workout graph data
    metadata: WorkoutMetadata;
}

/**
 * Load workout data from JSON file and extract metadata
 */
async function loadWorkoutData(workoutId: string): Promise<WorkoutData | null> {
    try {
        const response = await fetch(`/data/workout-data/${workoutId}.json`);
        if (!response.ok) {
            console.warn(`Failed to load workout data for ${workoutId}`);
            return null;
        }
        return await response.json();
    } catch (error) {
        console.warn(`Error loading workout data for ${workoutId}:`, error);
        return null;
    }
}

/**
 * Get contentId from workout selection by loading its metadata
 */
export async function getWorkoutContentId(workout: WorkoutSelection): Promise<string | null> {
    const data = await loadWorkoutData(workout.id);
    return data?.metadata?.contentId || null;
}

/**
 * Load contentIds for all workouts in a scenario
 */
export async function loadWorkoutContentIds(workouts: WorkoutSelection[]): Promise<Map<string, string>> {
    const contentIdMap = new Map<string, string>();
    
    // Load all workout data in parallel
    const loadPromises = workouts.map(async (workout) => {
        const contentId = await getWorkoutContentId(workout);
        if (contentId) {
            contentIdMap.set(workout.id, contentId);
        }
        return { workoutId: workout.id, contentId };
    });

    const results = await Promise.all(loadPromises);
    
    // Log any missing contentIds
    const missing = results.filter(r => !r.contentId);
    if (missing.length > 0) {
        console.warn('Missing contentIds for workouts:', missing.map(r => r.workoutId));
    }

    return contentIdMap;
}

/**
 * Generate schedule items with proper contentIds and timing
 */
export async function generateScheduleItems(
    workouts: WorkoutSelection[],
    startDate: string,
    timeZone: string
): Promise<Array<{
    workout: WorkoutSelection;
    contentId: string;
    scheduledTime: string;
    rank: number;
}>> {
    const contentIdMap = await loadWorkoutContentIds(workouts);
    const scheduleItems = [];

    for (let i = 0; i < workouts.length; i++) {
        const workout = workouts[i];
        let contentId = contentIdMap.get(workout.id);
        
        // Fallback: use workout.id if contentId not found
        if (!contentId) {
            console.warn(`Using fallback contentId for workout ${workout.name} (${workout.id})`);
            contentId = workout.id;
        }

        // Create date with hour increment (ensure proper timezone handling)
        const date = new Date(startDate + 'T00:00:00');
        date.setHours(1 + i, 0, 0, 0); // Start at 01:00, increment by 1 hour

        scheduleItems.push({
            workout,
            contentId,
            scheduledTime: date.toISOString(),
            rank: 100 + i
        });
    }

    return scheduleItems;
}

/**
 * Format time for display (HH:MM format)
 */
export function formatTime(isoString: string): string {
    if (!isoString) return '--:--';
    
    const date = new Date(isoString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
        return '--:--';
    }
    
    return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
    });
}

/**
 * Format date for display
 */
export function formatDate(isoString: string): string {
    if (!isoString) return 'Unknown Date';
    
    const date = new Date(isoString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
        return 'Invalid Date';
    }
    
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}