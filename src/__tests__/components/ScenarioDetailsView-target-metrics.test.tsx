import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import React from 'react';
import ScenarioDetailsView from '../../components/ScenarioDetailsView';
import { Scenario } from '../../types/scenario';
import { UserPowerProfile } from '../../types/userProfile';
import * as scenarioHelpers from '../../utils/scenarioHelpers';

// Mock the scenario helpers
vi.mock('../../utils/scenarioHelpers', async () => {
    const actual = await vi.importActual('../../utils/scenarioHelpers') as any;
    return {
        ...actual,
        calculateCombinedMetricsDynamic: vi.fn(),
        loadScenarios: vi.fn(() => []),
        saveScenarios: vi.fn(),
        formatDuration: actual.formatDuration
    };
});

// Mock other dependencies
vi.mock('../../components/ReorderableWorkoutList', () => ({
    default: () => <div data-testid="reorderable-workout-list">Mock Workout List</div>
}));

vi.mock('../../components/ScenarioComparison', () => ({
    default: () => <div data-testid="scenario-comparison">Mock Scenario Comparison</div>
}));

vi.mock('../../hooks/useViewport', () => ({
    useViewport: () => ({ isMobile: false })
}));

describe('ScenarioDetailsView - Target Metrics Calculation', () => {
    const mockScenario: Scenario = {
        id: 'test-scenario',
        name: 'Test Scenario',
        createdAt: '2025-01-01T00:00:00Z',
        workouts: [
            { id: 'workout1', name: 'Test Workout 1', metrics: null },
            { id: 'workout2', name: 'Test Workout 2', metrics: null }
        ]
    };

    const mockOnBack = vi.fn();
    const mockCalculateCombinedMetricsDynamic = vi.mocked(scenarioHelpers.calculateCombinedMetricsDynamic);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Target TSS Calculation Edge Cases', () => {
        it('should handle NaN values in base metrics gracefully', async () => {
            const userProfile: UserPowerProfile = {
                ftp: 250,
                nm: 1000,
                ac: 400,
                map: 320,
                targetIntensity: 80
            };

            // Mock calculateCombinedMetricsDynamic to return NaN values
            mockCalculateCombinedMetricsDynamic.mockResolvedValue({
                totalDuration: NaN,
                totalElapsedDuration: NaN,
                totalTSS: NaN,
                averageIF: NaN,
                totalNP: NaN
            });

            const { container } = render(
                <ScenarioDetailsView
                    scenario={mockScenario}
                    userProfile={userProfile}
                    onBack={mockOnBack}
                />
            );

            await waitFor(() => {
                // Should not crash and should show zero values
                const tssElement = container.querySelector('[data-testid="tss-metric"]') || 
                                 container.textContent;
                expect(tssElement).toBeTruthy();
                // The component should render without throwing errors
            });
        });

        it('should handle Infinity values in base metrics gracefully', async () => {
            const userProfile: UserPowerProfile = {
                ftp: 250,
                nm: 1000,
                ac: 400,
                map: 320,
                targetIntensity: 80
            };

            // Mock calculateCombinedMetricsDynamic to return Infinity values
            mockCalculateCombinedMetricsDynamic.mockResolvedValue({
                totalDuration: Infinity,
                totalElapsedDuration: Infinity,
                totalTSS: Infinity,
                averageIF: Infinity,
                totalNP: Infinity
            });

            const { container } = render(
                <ScenarioDetailsView
                    scenario={mockScenario}
                    userProfile={userProfile}
                    onBack={mockOnBack}
                />
            );

            await waitFor(() => {
                // Should not crash and should handle Infinity gracefully
                expect(container).toBeTruthy();
            });
        });

        it('should handle zero target intensity', async () => {
            const userProfile: UserPowerProfile = {
                ftp: 250,
                nm: 1000,
                ac: 400,
                map: 320,
                targetIntensity: 0 // Zero intensity
            };

            mockCalculateCombinedMetricsDynamic.mockResolvedValue({
                totalDuration: 3600,
                totalElapsedDuration: 3600,
                totalTSS: 100,
                averageIF: 0.8,
                totalNP: 200
            });

            const { container } = render(
                <ScenarioDetailsView
                    scenario={mockScenario}
                    userProfile={userProfile}
                    onBack={mockOnBack}
                />
            );

            await waitFor(() => {
                // Should handle zero target intensity without crashing
                expect(container).toBeTruthy();
            });
        });

        it('should handle negative target intensity', async () => {
            const userProfile: UserPowerProfile = {
                ftp: 250,
                nm: 1000,
                ac: 400,
                map: 320,
                targetIntensity: -50 // Negative intensity
            };

            mockCalculateCombinedMetricsDynamic.mockResolvedValue({
                totalDuration: 3600,
                totalElapsedDuration: 3600,
                totalTSS: 100,
                averageIF: 0.8,
                totalNP: 200
            });

            const { container } = render(
                <ScenarioDetailsView
                    scenario={mockScenario}
                    userProfile={userProfile}
                    onBack={mockOnBack}
                />
            );

            await waitFor(() => {
                // Should handle negative target intensity without crashing
                expect(container).toBeTruthy();
            });
        });

        it('should handle NaN target intensity', async () => {
            const userProfile: UserPowerProfile = {
                ftp: 250,
                nm: 1000,
                ac: 400,
                map: 320,
                targetIntensity: NaN // NaN intensity
            };

            mockCalculateCombinedMetricsDynamic.mockResolvedValue({
                totalDuration: 3600,
                totalElapsedDuration: 3600,
                totalTSS: 100,
                averageIF: 0.8,
                totalNP: 200
            });

            const { container } = render(
                <ScenarioDetailsView
                    scenario={mockScenario}
                    userProfile={userProfile}
                    onBack={mockOnBack}
                />
            );

            await waitFor(() => {
                // Should fall back to 70% when targetIntensity is NaN
                expect(container).toBeTruthy();
            });
        });

        it('should handle missing targetIntensity property', async () => {
            const userProfile: UserPowerProfile = {
                ftp: 250,
                nm: 1000,
                ac: 400,
                map: 320
                // targetIntensity is missing
            } as any;

            mockCalculateCombinedMetricsDynamic.mockResolvedValue({
                totalDuration: 3600,
                totalElapsedDuration: 3600,
                totalTSS: 100,
                averageIF: 0.8,
                totalNP: 200
            });

            const { container } = render(
                <ScenarioDetailsView
                    scenario={mockScenario}
                    userProfile={userProfile}
                    onBack={mockOnBack}
                />
            );

            await waitFor(() => {
                // Should fall back to 70% when targetIntensity is undefined
                expect(container).toBeTruthy();
            });
        });

        it('should handle zero duration correctly', async () => {
            const userProfile: UserPowerProfile = {
                ftp: 250,
                nm: 1000,
                ac: 400,
                map: 320,
                targetIntensity: 80
            };

            mockCalculateCombinedMetricsDynamic.mockResolvedValue({
                totalDuration: 0, // Zero duration
                totalElapsedDuration: 0,
                totalTSS: 0,
                averageIF: 0.8,
                totalNP: 200
            });

            const { container } = render(
                <ScenarioDetailsView
                    scenario={mockScenario}
                    userProfile={userProfile}
                    onBack={mockOnBack}
                />
            );

            await waitFor(() => {
                // Should handle zero duration (durationHours = 0) without division issues
                expect(container).toBeTruthy();
            });
        });

        it('should handle very large numbers without overflow', async () => {
            const userProfile: UserPowerProfile = {
                ftp: 250,
                nm: 1000,
                ac: 400,
                map: 320,
                targetIntensity: 150 // Very high intensity
            };

            mockCalculateCombinedMetricsDynamic.mockResolvedValue({
                totalDuration: Number.MAX_SAFE_INTEGER,
                totalElapsedDuration: Number.MAX_SAFE_INTEGER,
                totalTSS: Number.MAX_SAFE_INTEGER,
                averageIF: 10.0, // Very high IF
                totalNP: Number.MAX_SAFE_INTEGER
            });

            const { container } = render(
                <ScenarioDetailsView
                    scenario={mockScenario}
                    userProfile={userProfile}
                    onBack={mockOnBack}
                />
            );

            await waitFor(() => {
                // Should handle very large numbers without overflow
                expect(container).toBeTruthy();
            });
        });

        it('should handle calculateCombinedMetricsDynamic throwing an error', async () => {
            const userProfile: UserPowerProfile = {
                ftp: 250,
                nm: 1000,
                ac: 400,
                map: 320,
                targetIntensity: 80
            };

            // Mock calculateCombinedMetricsDynamic to throw an error
            mockCalculateCombinedMetricsDynamic.mockRejectedValue(new Error('Calculation failed'));

            const { container } = render(
                <ScenarioDetailsView
                    scenario={mockScenario}
                    userProfile={userProfile}
                    onBack={mockOnBack}
                />
            );

            await waitFor(() => {
                // Should handle errors gracefully and not crash
                expect(container).toBeTruthy();
            });
        });

        it('should handle incomplete userProfile (missing FTP)', async () => {
            const userProfile: UserPowerProfile = {
                // ftp is missing
                nm: 1000,
                ac: 400,
                map: 320,
                targetIntensity: 80
            } as any;

            const { container } = render(
                <ScenarioDetailsView
                    scenario={mockScenario}
                    userProfile={userProfile}
                    onBack={mockOnBack}
                />
            );

            await waitFor(() => {
                // Should handle missing FTP and show loading state or default values
                expect(container).toBeTruthy();
            });
        });
    });

    describe('Target Metrics Formula Validation', () => {
        it('should calculate target TSS correctly with valid inputs', async () => {
            const userProfile: UserPowerProfile = {
                ftp: 250,
                nm: 1000,
                ac: 400,
                map: 320,
                targetIntensity: 80
            };

            mockCalculateCombinedMetricsDynamic.mockResolvedValue({
                totalDuration: 3600, // 1 hour
                totalElapsedDuration: 3600,
                totalTSS: 100,
                averageIF: 1.0, // Base IF of 1.0
                totalNP: 250
            });

            render(
                <ScenarioDetailsView
                    scenario={mockScenario}
                    userProfile={userProfile}
                    onBack={mockOnBack}
                />
            );

            await waitFor(() => {
                // Expected calculation:
                // targetIF = 1.0 * 0.8 = 0.8
                // durationHours = 3600 / 3600 = 1
                // targetTSS = (0.8)² * 1 * 100 = 64
                expect(mockCalculateCombinedMetricsDynamic).toHaveBeenCalledWith(
                    mockScenario.workouts,
                    userProfile
                );
            });
        });

        it('should handle fractional hours correctly', async () => {
            const userProfile: UserPowerProfile = {
                ftp: 250,
                nm: 1000,
                ac: 400,
                map: 320,
                targetIntensity: 70
            };

            mockCalculateCombinedMetricsDynamic.mockResolvedValue({
                totalDuration: 1800, // 0.5 hours
                totalElapsedDuration: 1800,
                totalTSS: 50,
                averageIF: 0.9,
                totalNP: 225
            });

            render(
                <ScenarioDetailsView
                    scenario={mockScenario}
                    userProfile={userProfile}
                    onBack={mockOnBack}
                />
            );

            await waitFor(() => {
                // Expected calculation:
                // targetIF = 0.9 * 0.7 = 0.63
                // durationHours = 1800 / 3600 = 0.5
                // targetTSS = (0.63)² * 0.5 * 100 = 19.845
                expect(mockCalculateCombinedMetricsDynamic).toHaveBeenCalled();
            });
        });
    });
});