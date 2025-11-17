import { describe, it, expect } from 'vitest';
import { 
    getTargetIntensity, 
    getTargetIntensityFactor, 
    formatTargetIntensity,
    DEFAULT_TARGET_INTENSITY 
} from '../../utils/targetIntensityUtils';

describe('targetIntensityUtils', () => {
    describe('getTargetIntensity', () => {
        it('should return default when profile is undefined', () => {
            expect(getTargetIntensity(undefined)).toBe(70);
        });

        it('should return default when profile is null', () => {
            expect(getTargetIntensity(null)).toBe(70);
        });

        it('should return direct targetIntensity when valid', () => {
            const profile = { targetIntensity: 85 };
            expect(getTargetIntensity(profile)).toBe(85);
        });

        it('should return powerProfile.targetIntensity when valid', () => {
            const profile = { 
                powerProfile: { targetIntensity: 75 }
            };
            expect(getTargetIntensity(profile)).toBe(75);
        });

        it('should prefer direct targetIntensity over nested', () => {
            const profile = { 
                targetIntensity: 85,
                powerProfile: { targetIntensity: 75 }
            };
            expect(getTargetIntensity(profile)).toBe(85);
        });

        it('should return default when targetIntensity is NaN', () => {
            const profile = { targetIntensity: NaN };
            expect(getTargetIntensity(profile)).toBe(70);
        });

        it('should return default when targetIntensity is Infinity', () => {
            const profile = { targetIntensity: Infinity };
            expect(getTargetIntensity(profile)).toBe(70);
        });

        it('should return default when targetIntensity is negative', () => {
            const profile = { targetIntensity: -10 };
            expect(getTargetIntensity(profile)).toBe(70);
        });

        it('should return default when targetIntensity is zero', () => {
            const profile = { targetIntensity: 0 };
            expect(getTargetIntensity(profile)).toBe(70);
        });

        it('should return default when nested targetIntensity is invalid', () => {
            const profile = { 
                powerProfile: { targetIntensity: NaN }
            };
            expect(getTargetIntensity(profile)).toBe(70);
        });

        it('should handle empty profile object', () => {
            expect(getTargetIntensity({})).toBe(70);
        });

        it('should handle profile with empty powerProfile', () => {
            const profile = { powerProfile: {} };
            expect(getTargetIntensity(profile)).toBe(70);
        });
    });

    describe('getTargetIntensityFactor', () => {
        it('should return decimal factor for default intensity', () => {
            expect(getTargetIntensityFactor(undefined)).toBe(0.7);
        });

        it('should return decimal factor for custom intensity', () => {
            const profile = { targetIntensity: 85 };
            expect(getTargetIntensityFactor(profile)).toBe(0.85);
        });

        it('should handle edge case values', () => {
            const profile = { targetIntensity: 100 };
            expect(getTargetIntensityFactor(profile)).toBe(1.0);
        });
    });

    describe('formatTargetIntensity', () => {
        it('should format default intensity with % symbol', () => {
            expect(formatTargetIntensity(undefined)).toBe('70%');
        });

        it('should format custom intensity with % symbol', () => {
            const profile = { targetIntensity: 85 };
            expect(formatTargetIntensity(profile)).toBe('85%');
        });

        it('should handle nested powerProfile intensity', () => {
            const profile = { 
                powerProfile: { targetIntensity: 75 }
            };
            expect(formatTargetIntensity(profile)).toBe('75%');
        });
    });

    describe('DEFAULT_TARGET_INTENSITY constant', () => {
        it('should be 70', () => {
            expect(DEFAULT_TARGET_INTENSITY).toBe(70);
        });
    });
});