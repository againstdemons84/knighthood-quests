import { 
    calculateNormalizedPower, 
    calculateIntensityFactor, 
    calculateTrainingStressScore, 
    calculateAllTrainingMetrics,
    getPowerValue 
} from '../../utils/trainingMetrics';
import { WorkoutData } from '../../types/workout';
import { UserPowerProfile } from '../../types/userProfile';

describe('trainingMetrics', () => {
    const mockUserProfile: UserPowerProfile = {
        nm: 1000,
        ac: 400,
        map: 320,
        ftp: 250
    };

    const mockWorkoutData: WorkoutData = {
        time: [0, 30, 60, 90, 120],
        value: [100, 200, 300, 250, 150],
        type: ['FTP', 'FTP', 'AC', 'FTP', 'FTP'],
        __typename: 'WorkoutData'
    };

    describe('getPowerValue', () => {
        it('should return correct power for NM type', () => {
            expect(getPowerValue('NM', 0.8, mockUserProfile)).toBe(800);
        });

        it('should return correct power for AC type', () => {
            expect(getPowerValue('AC', 0.9, mockUserProfile)).toBe(360);
        });

        it('should return correct power for MAP type', () => {
            expect(getPowerValue('MAP', 1.0, mockUserProfile)).toBe(320);
        });

        it('should return correct power for FTP type', () => {
            expect(getPowerValue('FTP', 0.85, mockUserProfile)).toBe(212.5);
        });

        it('should return intensity value when no profile provided', () => {
            expect(getPowerValue('FTP', 250)).toBe(250);
        });

        it('should return intensity * FTP for unknown type', () => {
            expect(getPowerValue('UNKNOWN', 200, mockUserProfile)).toBe(200 * 250); // 200 * FTP (250)
        });
    });

    describe('calculateNormalizedPower', () => {
        it('should calculate normalized power correctly', () => {
            const np = calculateNormalizedPower(mockWorkoutData, mockUserProfile);
            expect(np).toBeGreaterThan(0);
            expect(typeof np).toBe('number');
        });

        it('should handle empty workout data', () => {
            const emptyData: WorkoutData = { 
                time: [], 
                value: [], 
                type: [], 
                __typename: 'WorkoutData' 
            };
            const np = calculateNormalizedPower(emptyData, mockUserProfile);
            expect(np).toBe(0);
        });
    });

    describe('calculateIntensityFactor', () => {
        it('should calculate IF correctly with valid NP and FTP', () => {
            const if_ = calculateIntensityFactor(250, mockUserProfile);
            expect(if_).toBe(1.0); // 250 / 250 = 1.0
        });

        it('should return 0 when FTP is 0', () => {
            const profileWithZeroFTP = { ...mockUserProfile, ftp: 0 };
            const if_ = calculateIntensityFactor(250, profileWithZeroFTP);
            expect(if_).toBe(0);
        });

        it('should return 0 when no profile provided', () => {
            const if_ = calculateIntensityFactor(250);
            expect(if_).toBe(0);
        });
    });

    describe('calculateTrainingStressScore', () => {
        it('should calculate TSS correctly', () => {
            const tss = calculateTrainingStressScore(0.8, 3600); // IF 0.8, 1 hour
            expect(tss).toBe(64); // 0.8^2 * 100 * 3600/3600 = 64
        });

        it('should calculate TSS for different durations', () => {
            const tss30min = calculateTrainingStressScore(1.0, 1800); // 30 minutes
            const tss60min = calculateTrainingStressScore(1.0, 3600); // 60 minutes
            
            expect(tss30min).toBe(50);
            expect(tss60min).toBe(100);
            expect(tss60min).toBe(tss30min * 2);
        });

        it('should handle zero values', () => {
            expect(calculateTrainingStressScore(0, 3600)).toBe(0);
            expect(calculateTrainingStressScore(1.0, 0)).toBe(0);
        });
    });

    describe('calculateAllTrainingMetrics', () => {
        it('should calculate all metrics correctly', () => {
            const metrics = calculateAllTrainingMetrics(mockWorkoutData, mockUserProfile);
            
            expect(metrics).toHaveProperty('normalizedPower');
            expect(metrics).toHaveProperty('intensityFactor');
            expect(metrics).toHaveProperty('trainingStressScore');
            expect(metrics).toHaveProperty('duration');
            
            expect(typeof metrics.normalizedPower).toBe('number');
            expect(typeof metrics.intensityFactor).toBe('number');
            expect(typeof metrics.trainingStressScore).toBe('number');
            expect(typeof metrics.duration).toBe('number');
            
            expect(metrics.normalizedPower).toBeGreaterThan(0);
            expect(metrics.duration).toBe(120); // Max time from mockWorkoutData
        });

        it('should handle workout without user profile', () => {
            const metrics = calculateAllTrainingMetrics(mockWorkoutData);
            
            // Without user profile, cannot calculate any metrics meaningfully
            expect(metrics.normalizedPower).toBe(0); // NP requires user profile to convert intensities to watts
            expect(metrics.intensityFactor).toBe(0); // IF requires user profile FTP
            expect(metrics.trainingStressScore).toBe(0); // TSS requires user profile FTP
        });
    });
});