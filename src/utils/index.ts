// Export training metrics calculation functions
export {
    calculateNormalizedPower,
    calculateIntensityFactor,
    calculateTrainingStressScore,
    calculateAllTrainingMetrics,
    getPowerValue
} from './trainingMetrics';

// Export SVG generation functions
export {
    generateSVG,
    generateWorkoutHeader
} from './svgGenerator';

// Export chart helper functions (if any exist)
export * from './chartHelpers';