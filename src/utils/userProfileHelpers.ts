import { UserProfileData, UserPowerProfile } from '../types/userProfile';

const USER_PROFILE_STORAGE_KEY = 'user_power_profile';
export const DEFAULT_TARGET_INTENSITY = 70;

export const saveUserProfile = (profile: UserPowerProfile): void => {
    try {
        const profileData: UserProfileData = {
            powerProfile: profile,
            createdAt: getUserProfile()?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(profileData));
    } catch (error) {
        console.error('Failed to save user profile to localStorage:', error);
    }
};

export const getUserProfile = (): UserProfileData | null => {
    try {
        const stored = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch (error) {
        console.error('Failed to load user profile from localStorage:', error);
        return null;
    }
};

export const hasUserProfile = (): boolean => {
    const profile = getUserProfile();
    return profile !== null && 
           profile.powerProfile.nm > 0 && 
           profile.powerProfile.ac > 0 && 
           profile.powerProfile.map > 0 && 
           profile.powerProfile.ftp > 0 &&
           (profile.powerProfile.targetIntensity === undefined || profile.powerProfile.targetIntensity >= 30);
};

export const clearUserProfile = (): void => {
    try {
        localStorage.removeItem(USER_PROFILE_STORAGE_KEY);
    } catch (error) {
        console.error('Failed to clear user profile from localStorage:', error);
    }
};

export const getDefaultPowerProfile = (): UserPowerProfile => {
    // Realistic default values for an average recreational cyclist
    return {
        ftp: 200,   // Functional Threshold Power (base level)
        map: 260,   // Maximum Aerobic Power (typically ~30% higher than FTP)
        ac: 340,    // Anaerobic Capacity (typically ~30% higher than MAP)
        nm: 450,    // Neuromuscular Power (typically ~30% higher than AC)
        targetIntensity: DEFAULT_TARGET_INTENSITY  // Target training intensity percentage
    };
};

export const getUserProfileWithDefaults = (): UserPowerProfile => {
    const profile = getUserProfile();
    if (!profile) {
        return getDefaultPowerProfile();
    }
    
    // Migrate existing profiles that might not have targetIntensity
    const powerProfile = { ...profile.powerProfile };
    
    // Ensure targetIntensity is always a valid number
    if (!powerProfile.targetIntensity || 
        isNaN(powerProfile.targetIntensity) || 
        powerProfile.targetIntensity <= 0 || 
        powerProfile.targetIntensity > 100) {
        powerProfile.targetIntensity = DEFAULT_TARGET_INTENSITY; // Default to 70% for invalid values
    }
    
    return powerProfile;
};

export const isUsingDefaultProfile = (): boolean => {
    const profile = getUserProfile();
    return profile === null || !hasUserProfile();
};

export const validatePowerProfile = (profile: UserPowerProfile): string[] => {
    const errors: string[] = [];
    
    if (!profile.nm || profile.nm <= 0) {
        errors.push('Neuromuscular Power (NM) must be greater than 0');
    }
    if (!profile.ac || profile.ac <= 0) {
        errors.push('Anaerobic Capacity (AC) must be greater than 0');
    }
    if (!profile.map || profile.map <= 0) {
        errors.push('Maximum Aerobic Power (MAP) must be greater than 0');
    }
    if (!profile.ftp || profile.ftp <= 0) {
        errors.push('Functional Threshold Power (FTP) must be greater than 0');
    }
    if (profile.targetIntensity == null || profile.targetIntensity < 30 || profile.targetIntensity > 100) {
        errors.push('Target Intensity must be between 30% and 100%');
    }
    
    // Logical validation: NM >= AC >= MAP >= FTP (typical power curve)
    if (profile.nm > 0 && profile.ac > 0 && profile.nm < profile.ac) {
        errors.push('Neuromuscular Power (NM) should typically be higher than Anaerobic Capacity (AC)');
    }
    if (profile.ac > 0 && profile.map > 0 && profile.ac < profile.map) {
        errors.push('Anaerobic Capacity (AC) should typically be higher than Maximum Aerobic Power (MAP)');
    }
    if (profile.map > 0 && profile.ftp > 0 && profile.map < profile.ftp) {
        errors.push('Maximum Aerobic Power (MAP) should typically be higher than Functional Threshold Power (FTP)');
    }
    
    return errors;
};