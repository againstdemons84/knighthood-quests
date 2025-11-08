import { 
    formatDuration, 
    generateScenarioId,
    calculateCombinedMetrics,
    loadWorkoutMetrics
} from '../../utils/scenarioHelpers';
import { WorkoutSelection } from '../../types/scenario';

// Mock getWorkoutData instead of fetch
jest.mock('../../data/workout-data', () => ({
    getWorkoutData: jest.fn()
}));

import { getWorkoutData } from '../../data/workout-data';

describe('scenarioHelpers', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Mock localStorage
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: jest.fn(),
                setItem: jest.fn(),
                removeItem: jest.fn(),
                clear: jest.fn(),
            },
            writable: true,
        });
    });

    describe('formatDuration', () => {
        it('should format seconds correctly', () => {
            expect(formatDuration(30)).toBe('00:30');
            expect(formatDuration(90)).toBe('01:30');
            expect(formatDuration(3661)).toBe('01:01:01');
        });

        it('should handle minutes and hours', () => {
            expect(formatDuration(3600)).toBe('01:00:00'); // 1 hour
            expect(formatDuration(7200)).toBe('02:00:00'); // 2 hours
            expect(formatDuration(3661)).toBe('01:01:01'); // 1h 1m 1s
        });

        it('should handle edge cases', () => {
            expect(formatDuration(0)).toBe('00:00');
            expect(formatDuration(NaN)).toBe('00:00');
            expect(formatDuration(-1)).toBe('00:00');
        });

        it('should handle null and undefined', () => {
            expect(formatDuration(null as any)).toBe('00:00');
            expect(formatDuration(undefined as any)).toBe('00:00');
        });
    });

    describe('generateScenarioId', () => {
        it('should generate unique IDs', () => {
            const id1 = generateScenarioId();
            const id2 = generateScenarioId();
            
            expect(id1).toMatch(/^scenario_\d+_[a-z0-9]+$/);
            expect(id2).toMatch(/^scenario_\d+_[a-z0-9]+$/);
            expect(id1).not.toBe(id2);
        });

        it('should start with scenario prefix', () => {
            const id = generateScenarioId();
            expect(id).toMatch(/^scenario_/);
        });
    });

    describe('calculateCombinedMetrics', () => {
        const mockWorkouts: WorkoutSelection[] = [
            {
                id: 'workout1',
                name: 'Test Workout 1',
                metrics: {
                    duration: 3600, // 1 hour
                    tss: 100,
                    intensityFactor: 0.8,
                    normalizedPower: 250
                }
            },
            {
                id: 'workout2', 
                name: 'Test Workout 2',
                metrics: {
                    duration: 1800, // 30 minutes
                    tss: 50,
                    intensityFactor: 0.9,
                    normalizedPower: 280
                }
            }
        ];

        it('should calculate combined metrics correctly', () => {
            const result = calculateCombinedMetrics(mockWorkouts);
            
            expect(result.totalDuration).toBe(5400); // 3600 + 1800
            expect(result.totalTSS).toBe(150); // 100 + 50
            expect(result.totalElapsedDuration).toBe(5400 + 600); // +10 minutes rest (2-1)*10*60
            
            // Weighted averages
            expect(result.averageIF).toBeCloseTo(0.833, 2); // (0.8*3600 + 0.9*1800) / 5400
            expect(result.totalNP).toBeCloseTo(260, 0); // (250*3600 + 280*1800) / 5400
        });

        it('should handle empty workout array', () => {
            const result = calculateCombinedMetrics([]);
            
            expect(result.totalDuration).toBe(0);
            expect(result.totalElapsedDuration).toBe(0);
            expect(result.totalTSS).toBe(0);
            expect(result.averageIF).toBe(0);
            expect(result.totalNP).toBe(0);
        });

        it('should handle workouts with null metrics', () => {
            const workoutsWithNull: WorkoutSelection[] = [
                {
                    id: 'workout1',
                    name: 'Valid Workout',
                    metrics: {
                        duration: 3600,
                        tss: 100,
                        intensityFactor: 0.8,
                        normalizedPower: 250
                    }
                },
                {
                    id: 'workout2',
                    name: 'Invalid Workout',
                    metrics: null
                }
            ];

            const result = calculateCombinedMetrics(workoutsWithNull);
            
            // Should only use the valid workout
            expect(result.totalDuration).toBe(3600);
            expect(result.totalTSS).toBe(100);
            expect(result.totalElapsedDuration).toBe(3600); // No rest for single workout
        });

        it('should calculate rest periods correctly', () => {
            // Test with different numbers of workouts
            const singleWorkout = [mockWorkouts[0]];
            const twoWorkouts = mockWorkouts;
            const threeWorkouts = [...mockWorkouts, mockWorkouts[0]];

            const result1 = calculateCombinedMetrics(singleWorkout);
            const result2 = calculateCombinedMetrics(twoWorkouts);
            const result3 = calculateCombinedMetrics(threeWorkouts);

            // Rest periods: (n-1) * 10 minutes
            expect(result1.totalElapsedDuration - result1.totalDuration).toBe(0); // No rest
            expect(result2.totalElapsedDuration - result2.totalDuration).toBe(600); // 1 * 10min
            expect(result3.totalElapsedDuration - result3.totalDuration).toBe(1200); // 2 * 10min
        });
    });

    describe('loadWorkoutMetrics', () => {
        const mockUserProfile = {
            nm: 1000,
            ac: 400,
            map: 320,
            ftp: 250
        };

        const mockWorkoutResponse = {
            data: {
                workoutGraphTriggers: {
                    indoor: {
                        time: [0, 30, 60],
                        value: [200, 250, 300],
                        type: ['FTP', 'FTP', 'AC'],
                        __typename: 'WorkoutData'
                    },
                    outdoor: {
                        time: [0, 30, 60],
                        value: [0, 0, 0], // All zeros - should prefer indoor
                        type: ['FTP', 'FTP', 'FTP'],
                        __typename: 'WorkoutData'
                    },
                    __typename: 'WorkoutGraphTriggers'
                }
            }
        };

        it('should load and calculate workout metrics successfully', async () => {
            (getWorkoutData as jest.Mock).mockReturnValue(mockWorkoutResponse);

            const result = await loadWorkoutMetrics('test-workout', mockUserProfile);

            expect(result).toBeTruthy();
            expect(result).toHaveProperty('duration');
            expect(result).toHaveProperty('tss');
            expect(result).toHaveProperty('intensityFactor');
            expect(result).toHaveProperty('normalizedPower');
            
            expect(typeof result!.duration).toBe('number');
            expect(typeof result!.tss).toBe('number');
            expect(typeof result!.intensityFactor).toBe('number');
            expect(typeof result!.normalizedPower).toBe('number');
        });

        it('should handle missing workout data', async () => {
            (getWorkoutData as jest.Mock).mockReturnValue(null);

            const result = await loadWorkoutMetrics('non-existent-workout', mockUserProfile);

            expect(result).toBeNull();
        });

        it('should handle data loading error', async () => {
            (getWorkoutData as jest.Mock).mockImplementation(() => {
                throw new Error('Data loading error');
            });

            const result = await loadWorkoutMetrics('test-workout', mockUserProfile);

            expect(result).toBeNull();
        });

        it('should work without user profile', async () => {
            (getWorkoutData as jest.Mock).mockReturnValue(mockWorkoutResponse);

            const result = await loadWorkoutMetrics('test-workout');

            expect(result).toBeTruthy();
            // Without user profile, IF and TSS should be 0
            expect(result!.intensityFactor).toBe(0);
            expect(result!.tss).toBe(0);
        });
    });
});