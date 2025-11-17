/**
 * Utility functions for handling target intensity values with consistent fallback logic
 */

// Default target intensity when none is set
export const DEFAULT_TARGET_INTENSITY = 70;

/**
 * Gets the target intensity value with fallback to default (70%)
 * Handles both undefined values and NaN/invalid values
 * 
 * @param userProfile - User profile object that may contain targetIntensity
 * @returns Valid target intensity value (70 if not set or invalid)
 */
export function getTargetIntensity(userProfile: any): number {
    // Handle undefined/null profile
    if (!userProfile) {
        return DEFAULT_TARGET_INTENSITY;
    }

    // Check direct targetIntensity property (UserPowerProfile structure)
    if (userProfile.targetIntensity != null && 
        !isNaN(userProfile.targetIntensity) && 
        isFinite(userProfile.targetIntensity) &&
        userProfile.targetIntensity > 0) {
        return userProfile.targetIntensity;
    }

    // Check nested powerProfile.targetIntensity (UserProfileData structure)
    if (userProfile.powerProfile?.targetIntensity != null && 
        !isNaN(userProfile.powerProfile.targetIntensity) && 
        isFinite(userProfile.powerProfile.targetIntensity) &&
        userProfile.powerProfile.targetIntensity > 0) {
        return userProfile.powerProfile.targetIntensity;
    }



    // Fallback to default
    return DEFAULT_TARGET_INTENSITY;
}

/**
 * Gets target intensity as a decimal factor (e.g., 70% -> 0.7)
 * 
 * @param userProfile - User profile object that may contain targetIntensity
 * @returns Target intensity as decimal factor
 */
export function getTargetIntensityFactor(userProfile: any): number {
    return getTargetIntensity(userProfile) / 100;
}

/**
 * Formats target intensity for display (e.g., "70%")
 * 
 * @param userProfile - User profile object that may contain targetIntensity
 * @returns Formatted intensity string with % symbol
 */
export function formatTargetIntensity(userProfile: any): string {
    return `${getTargetIntensity(userProfile)}%`;
}