import { describe, it, expect } from 'vitest';
import { getTargetIntensity } from '../../utils/targetIntensityUtils';

// Extract the target metrics calculation logic for testing
export const calculateTargetMetrics = (
    calculatedMetrics: {
        averageIF: number;
        totalNP: number;
        totalDuration: number;
        totalTSS?: number;
    },
    userProfile: {
        targetIntensity?: number;
    }
) => {
    // Use centralized target intensity utility
    const targetIntensityValue = getTargetIntensity(userProfile);
    const targetIntensityDecimal = targetIntensityValue / 100;
    
    const baseIF = isNaN(calculatedMetrics.averageIF) ? 0 : calculatedMetrics.averageIF;
    const baseNP = isNaN(calculatedMetrics.totalNP) ? 0 : calculatedMetrics.totalNP;
    const baseDuration = isNaN(calculatedMetrics.totalDuration) ? 0 : calculatedMetrics.totalDuration;
    
    const targetIF = baseIF * targetIntensityDecimal;
    const targetNP = baseNP * targetIntensityDecimal;
    const durationHours = baseDuration / 3600;
    const targetTSS = Math.pow(targetIF, 2) * durationHours * 100;

    const totalTargetTSS = isNaN(targetTSS) ? 0 : Math.round(targetTSS);
    const averageTargetIF = isNaN(targetIF) ? 0 : Math.round(targetIF * 100) / 100;
    const totalTargetNP = isNaN(targetNP) ? 0 : Math.round(targetNP);

    return {
        totalTargetTSS,
        averageTargetIF,
        totalTargetNP
    };
};

describe('ScenarioDetailsView - Target Metrics Calculation Logic', () => {
    describe('calculateTargetMetrics', () => {
        describe('Valid Input Cases', () => {
            it('should calculate target metrics correctly with standard inputs', () => {
                const calculatedMetrics = {
                    averageIF: 1.0,
                    totalNP: 250,
                    totalDuration: 3600, // 1 hour
                };
                const userProfile = {
                    targetIntensity: 80
                };

                const result = calculateTargetMetrics(calculatedMetrics, userProfile);

                // Expected: targetIF = 1.0 * 0.8 = 0.8
                // targetTSS = (0.8)² * 1 * 100 = 64
                expect(result.totalTargetTSS).toBe(64);
                expect(result.averageTargetIF).toBe(0.8);
                expect(result.totalTargetNP).toBe(200); // 250 * 0.8
            });

            it('should handle fractional duration correctly', () => {
                const calculatedMetrics = {
                    averageIF: 0.9,
                    totalNP: 225,
                    totalDuration: 1800, // 0.5 hours
                };
                const userProfile = {
                    targetIntensity: 70
                };

                const result = calculateTargetMetrics(calculatedMetrics, userProfile);

                // Expected: targetIF = 0.9 * 0.7 = 0.63
                // targetTSS = (0.63)² * 0.5 * 100 = 19.845 → 20
                expect(result.totalTargetTSS).toBe(20);
                expect(result.averageTargetIF).toBe(0.63);
                expect(result.totalTargetNP).toBe(158); // 225 * 0.7 = 157.5 → 158
            });

            it('should handle zero target intensity (falls back to 70%)', () => {
                const calculatedMetrics = {
                    averageIF: 0.8,
                    totalNP: 200,
                    totalDuration: 3600,
                };
                const userProfile = {
                    targetIntensity: 0 // Zero intensity falls back to 70%
                };

                const result = calculateTargetMetrics(calculatedMetrics, userProfile);

                // Zero target intensity falls back to 70% due to || operator
                // targetIF = 0.8 * 0.7 = 0.56
                // targetTSS = (0.56)² * 1 * 100 = 31.36 → 31
                expect(result.totalTargetTSS).toBe(31);
                expect(result.averageTargetIF).toBe(0.56);
                expect(result.totalTargetNP).toBe(140); // 200 * 0.7
            });

            it('should handle very low target intensity (1%)', () => {
                const calculatedMetrics = {
                    averageIF: 0.8,
                    totalNP: 200,
                    totalDuration: 3600,
                };
                const userProfile = {
                    targetIntensity: 1 // 1% intensity
                };

                const result = calculateTargetMetrics(calculatedMetrics, userProfile);

                // targetIF = 0.8 * 0.01 = 0.008
                // targetTSS = (0.008)² * 1 * 100 = 0.0064 → 0
                expect(result.totalTargetTSS).toBe(0);
                expect(result.averageTargetIF).toBe(0.01);
                expect(result.totalTargetNP).toBe(2); // 200 * 0.01
            });

            it('should handle very high target intensity', () => {
                const calculatedMetrics = {
                    averageIF: 0.8,
                    totalNP: 200,
                    totalDuration: 3600,
                };
                const userProfile = {
                    targetIntensity: 200 // 200%
                };

                const result = calculateTargetMetrics(calculatedMetrics, userProfile);

                // Expected: targetIF = 0.8 * 2.0 = 1.6
                // targetTSS = (1.6)² * 1 * 100 = 256
                expect(result.totalTargetTSS).toBe(256);
                expect(result.averageTargetIF).toBe(1.6);
                expect(result.totalTargetNP).toBe(400); // 200 * 2.0
            });
        });

        describe('NaN Input Cases', () => {
            it('should handle NaN averageIF', () => {
                const calculatedMetrics = {
                    averageIF: NaN,
                    totalNP: 200,
                    totalDuration: 3600,
                };
                const userProfile = {
                    targetIntensity: 80
                };

                const result = calculateTargetMetrics(calculatedMetrics, userProfile);

                // Should default to 0 when averageIF is NaN
                expect(result.totalTargetTSS).toBe(0);
                expect(result.averageTargetIF).toBe(0);
                expect(result.totalTargetNP).toBe(160); // 200 * 0.8 (NP calculation should still work)
            });

            it('should handle NaN totalNP', () => {
                const calculatedMetrics = {
                    averageIF: 0.8,
                    totalNP: NaN,
                    totalDuration: 3600,
                };
                const userProfile = {
                    targetIntensity: 80
                };

                const result = calculateTargetMetrics(calculatedMetrics, userProfile);

                expect(result.totalTargetTSS).toBe(41); // (0.8 * 0.8)² * 1 * 100 = 40.96 → 41
                expect(result.averageTargetIF).toBe(0.64); // 0.8 * 0.8
                expect(result.totalTargetNP).toBe(0); // NaN → 0
            });

            it('should handle NaN totalDuration', () => {
                const calculatedMetrics = {
                    averageIF: 0.8,
                    totalNP: 200,
                    totalDuration: NaN,
                };
                const userProfile = {
                    targetIntensity: 80
                };

                const result = calculateTargetMetrics(calculatedMetrics, userProfile);

                // Duration is NaN → 0, so durationHours = 0/3600 = 0
                expect(result.totalTargetTSS).toBe(0);
                expect(result.averageTargetIF).toBe(0.64); // 0.8 * 0.8
                expect(result.totalTargetNP).toBe(160); // 200 * 0.8
            });

            it('should handle all NaN inputs', () => {
                const calculatedMetrics = {
                    averageIF: NaN,
                    totalNP: NaN,
                    totalDuration: NaN,
                };
                const userProfile = {
                    targetIntensity: 80
                };

                const result = calculateTargetMetrics(calculatedMetrics, userProfile);

                expect(result.totalTargetTSS).toBe(0);
                expect(result.averageTargetIF).toBe(0);
                expect(result.totalTargetNP).toBe(0);
            });

            it('should handle NaN target intensity', () => {
                const calculatedMetrics = {
                    averageIF: 0.8,
                    totalNP: 200,
                    totalDuration: 3600,
                };
                const userProfile = {
                    targetIntensity: NaN
                };

                const result = calculateTargetMetrics(calculatedMetrics, userProfile);

                // Should fallback to 70% when targetIntensity is NaN
                // targetIF = 0.8 * 0.7 = 0.56
                // targetTSS = (0.56)² * 1 * 100 = 31.36 → 31
                expect(result.totalTargetTSS).toBe(31);
                expect(result.averageTargetIF).toBe(0.56);
                expect(result.totalTargetNP).toBe(140); // 200 * 0.7
            });
        });

        describe('Infinity Input Cases', () => {
            it('should handle Infinity averageIF', () => {
                const calculatedMetrics = {
                    averageIF: Infinity,
                    totalNP: 200,
                    totalDuration: 3600,
                };
                const userProfile = {
                    targetIntensity: 80
                };

                const result = calculateTargetMetrics(calculatedMetrics, userProfile);

                // Infinity * 0.8 = Infinity
                // Infinity² * 1 * 100 = Infinity
                // isNaN(Infinity) = false, so it won't be caught by the NaN check
                expect(result.totalTargetTSS).toBe(Infinity);
                expect(result.averageTargetIF).toBe(Infinity);
                expect(result.totalTargetNP).toBe(160);
            });

            it('should handle Infinity totalNP', () => {
                const calculatedMetrics = {
                    averageIF: 0.8,
                    totalNP: Infinity,
                    totalDuration: 3600,
                };
                const userProfile = {
                    targetIntensity: 80
                };

                const result = calculateTargetMetrics(calculatedMetrics, userProfile);

                expect(result.totalTargetTSS).toBe(41); // Normal calculation
                expect(result.averageTargetIF).toBe(0.64);
                expect(result.totalTargetNP).toBe(Infinity); // Infinity * 0.8 = Infinity
            });

            it('should handle Infinity totalDuration', () => {
                const calculatedMetrics = {
                    averageIF: 0.8,
                    totalNP: 200,
                    totalDuration: Infinity,
                };
                const userProfile = {
                    targetIntensity: 80
                };

                const result = calculateTargetMetrics(calculatedMetrics, userProfile);

                // durationHours = Infinity / 3600 = Infinity
                // targetTSS = (0.64)² * Infinity * 100 = Infinity
                expect(result.totalTargetTSS).toBe(Infinity);
                expect(result.averageTargetIF).toBe(0.64);
                expect(result.totalTargetNP).toBe(160);
            });
        });

        describe('Edge Cases', () => {
            it('should handle zero duration', () => {
                const calculatedMetrics = {
                    averageIF: 0.8,
                    totalNP: 200,
                    totalDuration: 0,
                };
                const userProfile = {
                    targetIntensity: 80
                };

                const result = calculateTargetMetrics(calculatedMetrics, userProfile);

                expect(result.totalTargetTSS).toBe(0); // 0 duration → 0 TSS
                expect(result.averageTargetIF).toBe(0.64);
                expect(result.totalTargetNP).toBe(160);
            });

            it('should handle negative values', () => {
                const calculatedMetrics = {
                    averageIF: -0.5, // Negative IF
                    totalNP: -100,   // Negative NP
                    totalDuration: -3600, // Negative duration
                };
                const userProfile = {
                    targetIntensity: 80
                };

                const result = calculateTargetMetrics(calculatedMetrics, userProfile);

                // targetIF = -0.5 * 0.8 = -0.4
                // durationHours = -3600 / 3600 = -1
                // targetTSS = (-0.4)² * (-1) * 100 = 0.16 * (-1) * 100 = -16
                expect(result.totalTargetTSS).toBe(-16);
                expect(result.averageTargetIF).toBe(-0.4);
                expect(result.totalTargetNP).toBe(-80); // -100 * 0.8
            });

            it('should handle missing targetIntensity property', () => {
                const calculatedMetrics = {
                    averageIF: 0.8,
                    totalNP: 200,
                    totalDuration: 3600,
                };
                const userProfile = {}; // No targetIntensity property

                const result = calculateTargetMetrics(calculatedMetrics, userProfile);

                // Should fallback to 70%
                expect(result.totalTargetTSS).toBe(31); // (0.8 * 0.7)² * 1 * 100 = 31.36 → 31
                expect(result.averageTargetIF).toBe(0.56);
                expect(result.totalTargetNP).toBe(140);
            });

            it('should handle very small numbers', () => {
                const calculatedMetrics = {
                    averageIF: 0.001,
                    totalNP: 0.1,
                    totalDuration: 1, // 1 second = 0.000278 hours
                };
                const userProfile = {
                    targetIntensity: 1 // 1%
                };

                const result = calculateTargetMetrics(calculatedMetrics, userProfile);

                // targetIF = 0.001 * 0.01 = 0.00001
                // durationHours = 1/3600 ≈ 0.000278
                // targetTSS = (0.00001)² * 0.000278 * 100 ≈ 0.00000000278 → 0
                expect(result.totalTargetTSS).toBe(0);
                expect(result.averageTargetIF).toBe(0);
                expect(result.totalTargetNP).toBe(0);
            });

            it('should handle rounding precision correctly', () => {
                const calculatedMetrics = {
                    averageIF: 0.876543,
                    totalNP: 234.567,
                    totalDuration: 3661, // Slightly over 1 hour
                };
                const userProfile = {
                    targetIntensity: 73.456 // Fractional percentage
                };

                const result = calculateTargetMetrics(calculatedMetrics, userProfile);

                // Verify rounding behavior
                expect(Number.isInteger(result.totalTargetTSS)).toBe(true);
                expect(Number.isInteger(result.totalTargetNP)).toBe(true);
                expect(result.averageTargetIF).toBeCloseTo(0.64, 2); // Should be rounded to 2 decimal places
            });
        });

        describe('Calculation Formula Validation', () => {
            it('should match TSS formula: TSS = IF² × hours × 100', () => {
                const testCases = [
                    { if: 0.5, hours: 1, expectedTSS: 25 },
                    { if: 1.0, hours: 1, expectedTSS: 100 },
                    { if: 0.8, hours: 0.5, expectedTSS: 32 },
                    { if: 1.2, hours: 2, expectedTSS: 288 },
                ];

                testCases.forEach(({ if: baseIF, hours, expectedTSS }) => {
                    const calculatedMetrics = {
                        averageIF: baseIF,
                        totalNP: 200,
                        totalDuration: hours * 3600,
                    };
                    const userProfile = {
                        targetIntensity: 100 // 100% to use base values
                    };

                    const result = calculateTargetMetrics(calculatedMetrics, userProfile);
                    expect(result.totalTargetTSS).toBe(expectedTSS);
                });
            });
        });
    });
});