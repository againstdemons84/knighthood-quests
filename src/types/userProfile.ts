export interface UserPowerProfile {
    nm: number;    // Neuromuscular Power (watts)
    ac: number;    // Anaerobic Capacity (watts) 
    map: number;   // Maximum Aerobic Power (watts)
    ftp: number;   // Functional Threshold Power (watts)
}

export interface UserProfileData {
    powerProfile: UserPowerProfile;
    createdAt: string;
    updatedAt: string;
}