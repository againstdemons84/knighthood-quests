import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadWorkoutMetrics } from '../../utils/scenarioHelpers';
import { calculateAllTrainingMetrics } from '../../utils/trainingMetrics';
import { getBestWorkoutData } from '../../utils/workoutDataHelpers';
import { getWorkoutData } from '../../data/workout-data';
import { UserPowerProfile } from '../../types/userProfile';

// Mock the dependencies
vi.mock('../../utils/trainingMetrics');
vi.mock('../../data/workout-data');
vi.mock('../../utils/workoutDataHelpers');

const mockCalculateAllTrainingMetrics = vi.mocked(calculateAllTrainingMetrics);
const mockGetWorkoutData = vi.mocked(getWorkoutData);
const mockGetBestWorkoutData = vi.mocked(getBestWorkoutData);

describe('loadWorkoutMetrics', () => {
    const mockUserProfile: UserPowerProfile = {
        nm: 1000,
        ac: 400,
        map: 320,
        ftp: 250,
        targetIntensity: 70
    };

    const mockWorkoutData = {
        time: [0, 30, 60, 90, 120],
        value: [100, 200, 300, 250, 150],
        type: ['FTP', 'FTP', 'AC', 'FTP', 'FTP'],
        __typename: 'WorkoutData'
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return null when workout data is not found', async () => {
        mockGetWorkoutData.mockReturnValue(null);

        const result = await loadWorkoutMetrics('non-existent-workout', mockUserProfile);

        expect(result).toBeNull();
        expect(mockGetWorkoutData).toHaveBeenCalledWith('non-existent-workout');
    });

    it('should return null when getBestWorkoutData returns no data', async () => {
        mockGetWorkoutData.mockReturnValue({ someData: 'test' });
        mockGetBestWorkoutData.mockReturnValue({ data: null, usedOutdoor: false });

        const result = await loadWorkoutMetrics('test-workout', mockUserProfile);

        expect(result).toBeNull();
    });

    it('should calculate and return valid metrics', async () => {
        mockGetWorkoutData.mockReturnValue({ someData: 'test' });
        mockGetBestWorkoutData.mockReturnValue({ 
            data: mockWorkoutData, 
            usedOutdoor: false 
        });
        mockCalculateAllTrainingMetrics.mockReturnValue({
            duration: 3600,
            trainingStressScore: 100,
            intensityFactor: 0.8,
            normalizedPower: 200
        });

        const result = await loadWorkoutMetrics('test-workout', mockUserProfile);

        expect(result).toEqual({
            duration: 3600,
            tss: 100,
            intensityFactor: 0.8,
            normalizedPower: 200
        });
        expect(mockCalculateAllTrainingMetrics).toHaveBeenCalledWith(mockWorkoutData, mockUserProfile);
    });

    it('should handle NaN values in calculated metrics', async () => {
        mockGetWorkoutData.mockReturnValue({ someData: 'test' });
        mockGetBestWorkoutData.mockReturnValue({ 
            data: mockWorkoutData, 
            usedOutdoor: false 
        });
        mockCalculateAllTrainingMetrics.mockReturnValue({
            duration: NaN,
            trainingStressScore: NaN,
            intensityFactor: NaN,
            normalizedPower: NaN
        });

        const result = await loadWorkoutMetrics('test-workout', mockUserProfile);

        expect(result).toEqual({
            duration: 0,
            tss: 0,
            intensityFactor: 0,
            normalizedPower: 0
        });
    });

    it('should handle mixed NaN and valid values', async () => {
        mockGetWorkoutData.mockReturnValue({ someData: 'test' });
        mockGetBestWorkoutData.mockReturnValue({ 
            data: mockWorkoutData, 
            usedOutdoor: false 
        });
        mockCalculateAllTrainingMetrics.mockReturnValue({
            duration: 3600,
            trainingStressScore: NaN,
            intensityFactor: 0.8,
            normalizedPower: NaN
        });

        const result = await loadWorkoutMetrics('test-workout', mockUserProfile);

        expect(result).toEqual({
            duration: 3600,
            tss: 0,
            intensityFactor: 0.8,
            normalizedPower: 0
        });
    });

    it('should handle Infinity values', async () => {
        mockGetWorkoutData.mockReturnValue({ someData: 'test' });
        mockGetBestWorkoutData.mockReturnValue({ 
            data: mockWorkoutData, 
            usedOutdoor: false 
        });
        mockCalculateAllTrainingMetrics.mockReturnValue({
            duration: Infinity,
            trainingStressScore: -Infinity,
            intensityFactor: Infinity,
            normalizedPower: -Infinity
        });

        const result = await loadWorkoutMetrics('test-workout', mockUserProfile);

        // Infinity values should be converted to 0 by our NaN check
        expect(result).toEqual({
            duration: 0,
            tss: 0,
            intensityFactor: 0,
            normalizedPower: 0
        });
    });

    it('should handle errors in calculation and return null', async () => {
        mockGetWorkoutData.mockReturnValue({ someData: 'test' });
        mockGetBestWorkoutData.mockReturnValue({ 
            data: mockWorkoutData, 
            usedOutdoor: false 
        });
        mockCalculateAllTrainingMetrics.mockImplementation(() => {
            throw new Error('Calculation error');
        });

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const result = await loadWorkoutMetrics('test-workout', mockUserProfile);

        expect(result).toBeNull();
        expect(consoleSpy).toHaveBeenCalledWith(
            'Error loading workout metrics for test-workout:',
            expect.any(Error)
        );

        consoleSpy.mockRestore();
    });

    it('should handle errors in getWorkoutData and return null', async () => {
        mockGetWorkoutData.mockImplementation(() => {
            throw new Error('Data loading error');
        });

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const result = await loadWorkoutMetrics('test-workout', mockUserProfile);

        expect(result).toBeNull();
        expect(consoleSpy).toHaveBeenCalledWith(
            'Error loading workout metrics for test-workout:',
            expect.any(Error)
        );

        consoleSpy.mockRestore();
    });

    it('should work without userProfile parameter', async () => {
        mockGetWorkoutData.mockReturnValue({ someData: 'test' });
        mockGetBestWorkoutData.mockReturnValue({ 
            data: mockWorkoutData, 
            usedOutdoor: false 
        });
        mockCalculateAllTrainingMetrics.mockReturnValue({
            duration: 3600,
            trainingStressScore: 0, // Should be 0 without user profile
            intensityFactor: 0, // Should be 0 without user profile
            normalizedPower: 200
        });

        const result = await loadWorkoutMetrics('test-workout');

        expect(result).toEqual({
            duration: 3600,
            tss: 0,
            intensityFactor: 0,
            normalizedPower: 200
        });
        expect(mockCalculateAllTrainingMetrics).toHaveBeenCalledWith(mockWorkoutData, undefined);
    });

    it('should handle zero values correctly', async () => {
        mockGetWorkoutData.mockReturnValue({ someData: 'test' });
        mockGetBestWorkoutData.mockReturnValue({ 
            data: mockWorkoutData, 
            usedOutdoor: false 
        });
        mockCalculateAllTrainingMetrics.mockReturnValue({
            duration: 0,
            trainingStressScore: 0,
            intensityFactor: 0,
            normalizedPower: 0
        });

        const result = await loadWorkoutMetrics('test-workout', mockUserProfile);

        expect(result).toEqual({
            duration: 0,
            tss: 0,
            intensityFactor: 0,
            normalizedPower: 0
        });
    });

    it('should handle negative values', async () => {
        mockGetWorkoutData.mockReturnValue({ someData: 'test' });
        mockGetBestWorkoutData.mockReturnValue({ 
            data: mockWorkoutData, 
            usedOutdoor: false 
        });
        mockCalculateAllTrainingMetrics.mockReturnValue({
            duration: -3600, // Negative duration (shouldn't happen but test edge case)
            trainingStressScore: -100,
            intensityFactor: -0.8,
            normalizedPower: -200
        });

        const result = await loadWorkoutMetrics('test-workout', mockUserProfile);

        expect(result).toEqual({
            duration: -3600,
            tss: -100,
            intensityFactor: -0.8,
            normalizedPower: -200
        });
    });

    it('should handle very small decimal values', async () => {
        mockGetWorkoutData.mockReturnValue({ someData: 'test' });
        mockGetBestWorkoutData.mockReturnValue({ 
            data: mockWorkoutData, 
            usedOutdoor: false 
        });
        mockCalculateAllTrainingMetrics.mockReturnValue({
            duration: 0.001,
            trainingStressScore: 0.1,
            intensityFactor: 0.001,
            normalizedPower: 0.5
        });

        const result = await loadWorkoutMetrics('test-workout', mockUserProfile);

        expect(result).toEqual({
            duration: 0.001,
            tss: 0.1,
            intensityFactor: 0.001,
            normalizedPower: 0.5
        });
    });
});