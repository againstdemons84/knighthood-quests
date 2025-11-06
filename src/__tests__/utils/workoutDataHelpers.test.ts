import { getBestWorkoutData, WorkoutDataResult } from '../../utils/workoutDataHelpers';

describe('workoutDataHelpers', () => {
    describe('getBestWorkoutData', () => {
        const mockIndoorData = {
            time: [0, 30, 60],
            value: [200, 250, 300],
            type: ['FTP', 'FTP', 'AC'],
            __typename: 'WorkoutData'
        };

        const mockOutdoorData = {
            time: [0, 30, 60],
            value: [180, 220, 280],
            type: ['FTP', 'FTP', 'AC'],
            __typename: 'WorkoutData'
        };

        const mockIndoorZeroData = {
            time: [0, 30, 60],
            value: [0, 0, 0], // All zeros
            type: ['FTP', 'FTP', 'AC'],
            __typename: 'WorkoutData'
        };

        it('should prefer indoor data when available and non-zero', () => {
            const rawData = {
                data: {
                    workoutGraphTriggers: {
                        indoor: mockIndoorData,
                        outdoor: mockOutdoorData,
                        __typename: 'WorkoutGraphTriggers'
                    }
                }
            };

            const result: WorkoutDataResult = getBestWorkoutData(rawData);

            expect(result.data).toBe(mockIndoorData);
            expect(result.usedOutdoor).toBe(false);
        });

        it('should fallback to outdoor data when indoor has all zeros', () => {
            const rawData = {
                data: {
                    workoutGraphTriggers: {
                        indoor: mockIndoorZeroData,
                        outdoor: mockOutdoorData,
                        __typename: 'WorkoutGraphTriggers'
                    }
                }
            };

            const result: WorkoutDataResult = getBestWorkoutData(rawData);

            expect(result.data).toBe(mockOutdoorData);
            expect(result.usedOutdoor).toBe(true);
        });

        it('should return indoor data even if all zeros when no outdoor data', () => {
            const rawData = {
                data: {
                    workoutGraphTriggers: {
                        indoor: mockIndoorZeroData,
                        outdoor: null,
                        __typename: 'WorkoutGraphTriggers'
                    }
                }
            };

            const result: WorkoutDataResult = getBestWorkoutData(rawData);

            expect(result.data).toBe(mockIndoorZeroData);
            expect(result.usedOutdoor).toBe(false);
        });

        it('should handle missing indoor data', () => {
            const rawData = {
                data: {
                    workoutGraphTriggers: {
                        indoor: null,
                        outdoor: mockOutdoorData,
                        __typename: 'WorkoutGraphTriggers'
                    }
                }
            };

            const result: WorkoutDataResult = getBestWorkoutData(rawData);

            expect(result.data).toBe(mockOutdoorData);
            expect(result.usedOutdoor).toBe(true);
        });

        it('should handle completely missing data', () => {
            const rawData = {
                data: {
                    workoutGraphTriggers: {
                        indoor: null,
                        outdoor: null,
                        __typename: 'WorkoutGraphTriggers'
                    }
                }
            };

            const result: WorkoutDataResult = getBestWorkoutData(rawData);

            expect(result.data).toBeNull();
            expect(result.usedOutdoor).toBe(false);
        });

        it('should handle malformed data structure', () => {
            const rawData = {};

            const result: WorkoutDataResult = getBestWorkoutData(rawData);

            expect(result.data).toBeNull();
            expect(result.usedOutdoor).toBe(false);
        });

        it('should detect all zero values correctly', () => {
            const mixedZeroData = {
                time: [0, 30, 60],
                value: [0, 100, 0], // Not all zeros
                type: ['FTP', 'FTP', 'AC'],
                __typename: 'WorkoutData'
            };

            const rawData = {
                data: {
                    workoutGraphTriggers: {
                        indoor: mixedZeroData,
                        outdoor: mockOutdoorData,
                        __typename: 'WorkoutGraphTriggers'
                    }
                }
            };

            const result: WorkoutDataResult = getBestWorkoutData(rawData);

            // Should use indoor data since it's not all zeros
            expect(result.data).toBe(mixedZeroData);
            expect(result.usedOutdoor).toBe(false);
        });

        it('should handle empty value arrays', () => {
            const emptyValueData = {
                time: [0, 30, 60],
                value: [], // Empty array
                type: ['FTP', 'FTP', 'AC'],
                __typename: 'WorkoutData'
            };

            const rawData = {
                data: {
                    workoutGraphTriggers: {
                        indoor: emptyValueData,
                        outdoor: mockOutdoorData,
                        __typename: 'WorkoutGraphTriggers'
                    }
                }
            };

            const result: WorkoutDataResult = getBestWorkoutData(rawData);

            // Should fallback to outdoor since indoor has empty values (treated as all zeros)
            expect(result.data).toBe(mockOutdoorData);
            expect(result.usedOutdoor).toBe(true);
        });
    });
});