import { WorkoutData } from '../types/workout';
import { UserProfile } from '../types/user';

/**
 * Get the actual power value for a workout segment based on type, intensity, and user profile
 */
const getPowerValue = (type: string, intensity: number, userProfile?: UserProfile): number => {
    if (!userProfile) {
        return intensity; // Fallback if no user profile
    }
    
    switch (type) {
        case 'NM':
            return intensity * userProfile.nm;
        case 'AC':
            return intensity * userProfile.ac;
        case 'MAP':
            return intensity * userProfile.map;
        case 'FTP':
        default:
            return intensity * userProfile.ftp;
    }
};

/**
 * Calculate Normalized Power (NP) using the 4-step process:
 * 1. Calculate 30-second rolling averages
 * 2. Raise each to the 4th power
 * 3. Average the 4th powers
 * 4. Take the 4th root of the average
 */
export const calculateNormalizedPower = (workoutData: WorkoutData, userProfile?: UserProfile): number => {
    const { time, value, type } = workoutData;
    
    if (!userProfile) {
        return 0; // Can't calculate without user profile
    }
    
    // Step 1: Create a second-by-second power array
    const maxTime = Math.max(...time);
    const powerBySecond: number[] = [];
    
    // Fill the power array with actual power values for each second
    for (let second = 0; second < maxTime; second++) {
        // Find which segment this second belongs to
        let segmentIndex = 0;
        for (let i = 0; i < time.length - 1; i++) {
            if (second >= time[i] && second < time[i + 1]) {
                segmentIndex = i;
                break;
            }
        }
        
        const actualPower = getPowerValue(type[segmentIndex], value[segmentIndex], userProfile);
        powerBySecond.push(actualPower);
    }
    
    // Step 2: Calculate 30-second rolling averages
    const rollingAverages: number[] = [];
    for (let i = 0; i <= powerBySecond.length - 30; i++) {
        const thirtySecondSlice = powerBySecond.slice(i, i + 30);
        const average = thirtySecondSlice.reduce((sum, power) => sum + power, 0) / 30;
        rollingAverages.push(average);
    }
    
    if (rollingAverages.length === 0) {
        return 0; // Not enough data
    }
    
    // Step 3: Raise each rolling average to the 4th power
    const fourthPowers = rollingAverages.map(avg => Math.pow(avg, 4));
    
    // Step 4: Calculate the average of the 4th powers
    const averageOfFourthPowers = fourthPowers.reduce((sum, power) => sum + power, 0) / fourthPowers.length;
    
    // Step 5: Take the 4th root to get Normalized Power
    const normalizedPower = Math.pow(averageOfFourthPowers, 1/4);
    
    return Math.round(normalizedPower);
};

/**
 * Calculate Intensity Factor (IF)
 * Formula: IF = NP ÷ FTP
 */
export const calculateIntensityFactor = (normalizedPower: number, userProfile?: UserProfile): number => {
    if (!userProfile || userProfile.ftp === 0) {
        return 0; // Can't calculate without user profile or valid FTP
    }
    
    // IF = NP ÷ FTP
    const intensityFactor = normalizedPower / userProfile.ftp;
    
    // Return rounded to 2 decimal places
    return Math.round(intensityFactor * 100) / 100;
};

/**
 * Calculate Training Stress Score (TSS)
 * Formula: TSS = IF² × Duration in Hours × 100
 */
export const calculateTrainingStressScore = (intensityFactor: number, durationInSeconds: number): number => {
    if (intensityFactor === 0 || durationInSeconds === 0) {
        return 0; // Can't calculate without valid inputs
    }
    
    // Convert duration from seconds to hours
    const durationInHours = durationInSeconds / 3600;
    
    // TSS = IF² × Duration in Hours × 100
    const tss = Math.pow(intensityFactor, 2) * durationInHours * 100;
    
    // Return rounded to nearest whole number
    return Math.round(tss);
};

/**
 * Calculate all training metrics at once for convenience
 */
export const calculateAllTrainingMetrics = (workoutData: WorkoutData, userProfile?: UserProfile) => {
    const maxTime = Math.max(...workoutData.time);
    const duration = Math.floor(maxTime);
    
    const normalizedPower = calculateNormalizedPower(workoutData, userProfile);
    const intensityFactor = calculateIntensityFactor(normalizedPower, userProfile);
    const trainingStressScore = calculateTrainingStressScore(intensityFactor, duration);
    
    return {
        normalizedPower,
        intensityFactor,
        trainingStressScore,
        duration
    };
};

/**
 * Export getPowerValue for use in other modules (like svgGenerator)
 */
export { getPowerValue };