import { describe, it, expect } from 'vitest';
import { calculateCombinedMetrics } from '../../utils/scenarioHelpers';
import { WorkoutSelection } from '../../types/scenario';

describe('scenarioHelpers - Critical NaN Validation', () => {
    describe('calculateCombinedMetrics', () => {
        it('should handle empty workout array', () => {
            const result = calculateCombinedMetrics([]);
            expect(result.totalDuration).toBe(0);
            expect(result.totalTSS).toBe(0);
            expect(result.averageIF).toBe(0);
            expect(result.totalNP).toBe(0);
        });

        it('should filter out workouts with NaN values', () => {
            const workouts: WorkoutSelection[] = [
                {
                    id: 'nan-workout',
                    name: 'NaN Workout',
                    metrics: {
                        duration: NaN,
                        tss: NaN,
                        intensityFactor: NaN,
                        normalizedPower: NaN
                    }
                },
                {
                    id: 'valid-workout',
                    name: 'Valid Workout',
                    metrics: {
                        duration: 3600,
                        tss: 100,
                        intensityFactor: 0.8,
                        normalizedPower: 200
                    }
                }
            ];

            const result = calculateCombinedMetrics(workouts);
            
            // Should only include the valid workout
            expect(result.totalDuration).toBe(3600);
            expect(result.totalTSS).toBe(100);
            expect(result.averageIF).toBeCloseTo(0.8);
            expect(result.totalNP).toBe(200);
        });

        it('should filter out workouts with Infinity values', () => {
            const workouts: WorkoutSelection[] = [
                {
                    id: 'infinity-workout',
                    name: 'Infinity Workout',
                    metrics: {
                        duration: Infinity,
                        tss: Infinity,
                        intensityFactor: Infinity,
                        normalizedPower: Infinity
                    }
                },
                {
                    id: 'valid-workout',
                    name: 'Valid Workout',
                    metrics: {
                        duration: 1800,
                        tss: 50,
                        intensityFactor: 0.7,
                        normalizedPower: 175
                    }
                }
            ];

            const result = calculateCombinedMetrics(workouts);
            
            // Should only include the valid workout
            expect(result.totalDuration).toBe(1800);
            expect(result.totalTSS).toBe(50);
            expect(result.averageIF).toBeCloseTo(0.7);
            expect(result.totalNP).toBe(175);
        });

        it('should handle workouts with null metrics', () => {
            const workouts: WorkoutSelection[] = [
                {
                    id: 'null-workout',
                    name: 'Null Workout',
                    metrics: null
                },
                {
                    id: 'valid-workout',
                    name: 'Valid Workout',
                    metrics: {
                        duration: 2400,
                        tss: 75,
                        intensityFactor: 0.9,
                        normalizedPower: 225
                    }
                }
            ];

            const result = calculateCombinedMetrics(workouts);
            
            // Should only include the valid workout
            expect(result.totalDuration).toBe(2400);
            expect(result.totalTSS).toBe(75);
            expect(result.averageIF).toBeCloseTo(0.9);
            expect(result.totalNP).toBe(225);
        });

        it('should return zeros when all workouts have invalid metrics', () => {
            const workouts: WorkoutSelection[] = [
                {
                    id: 'nan-workout',
                    name: 'NaN Workout',
                    metrics: {
                        duration: NaN,
                        tss: NaN,
                        intensityFactor: NaN,
                        normalizedPower: NaN
                    }
                },
                {
                    id: 'null-workout',
                    name: 'Null Workout',
                    metrics: null
                }
            ];

            const result = calculateCombinedMetrics(workouts);
            
            // Should return zero values when no valid workouts
            expect(result.totalDuration).toBe(0);
            expect(result.totalTSS).toBe(0);
            expect(result.averageIF).toBe(0);
            expect(result.totalNP).toBe(0);
        });

        it('should handle multiple valid workouts correctly', () => {
            const workouts: WorkoutSelection[] = [
                {
                    id: 'workout-1',
                    name: 'Workout 1',
                    metrics: {
                        duration: 3600,
                        tss: 100,
                        intensityFactor: 0.8,
                        normalizedPower: 200
                    }
                },
                {
                    id: 'workout-2',
                    name: 'Workout 2',
                    metrics: {
                        duration: 1800,
                        tss: 50,
                        intensityFactor: 0.7,
                        normalizedPower: 175
                    }
                }
            ];

            const result = calculateCombinedMetrics(workouts);
            
            // Should sum up both workouts
            expect(result.totalDuration).toBe(5400);
            expect(result.totalTSS).toBe(150);
            // Weighted average NP should be (200 * 3600 + 175 * 1800) / 5400 = 191.67
            expect(result.totalNP).toBeCloseTo(191.67, 2);
            // Weighted average IF should be (0.8 * 3600 + 0.7 * 1800) / 5400 = 0.766...
            expect(result.averageIF).toBeCloseTo(0.7667, 3);
        });
    });
});