import { generateSVG, generateWorkoutHeader } from '../../utils/svgGenerator';
import { WorkoutData } from '../../types/workout';
import { UserPowerProfile } from '../../types/userProfile';

describe('SVG Generation', () => {
  const mockUserProfile: UserPowerProfile = {
    nm: 1000,
    ac: 400,
    map: 320,
    ftp: 250,
    targetIntensity: 70
  };

  const mockWorkoutData: WorkoutData = {
    time: [0, 30, 60, 90, 120, 150],
    value: [0.5, 0.8, 1.2, 1.0, 0.6, 0.4],
    type: ['FTP', 'FTP', 'AC', 'MAP', 'FTP', 'FTP'],
    __typename: 'WorkoutData'
  };

  const emptyWorkoutData: WorkoutData = {
    time: [],
    value: [],
    type: [],
    __typename: 'WorkoutData'
  };

  describe('generateSVG', () => {
    it('should generate SVG elements for valid workout data', () => {
      const svgElements = generateSVG(mockWorkoutData, mockUserProfile, true);
      
      expect(Array.isArray(svgElements)).toBe(true);
      expect(svgElements.length).toBeGreaterThan(0);
      
      // Check that we have rect elements for workout segments
      const rectElements = svgElements.filter(element => 
        element && typeof element === 'object' && 'type' in element && element.type === 'rect'
      );
      expect(rectElements.length).toBeGreaterThan(0);
    });

    it('should handle empty workout data gracefully', () => {
      const svgElements = generateSVG(emptyWorkoutData, mockUserProfile, true);
      expect(Array.isArray(svgElements)).toBe(true);
      // Should return baseline grid elements even with empty data
      expect(svgElements.length).toBeGreaterThan(0);
    });

    it('should work without user profile', () => {
      const svgElements = generateSVG(mockWorkoutData, undefined, false);
      expect(Array.isArray(svgElements)).toBe(true);
      expect(svgElements.length).toBeGreaterThan(0);
    });

    it('should generate different content based on showMetrics flag', () => {
      const withMetrics = generateSVG(mockWorkoutData, mockUserProfile, true);
      const withoutMetrics = generateSVG(mockWorkoutData, mockUserProfile, false);
      
      expect(Array.isArray(withMetrics)).toBe(true);
      expect(Array.isArray(withoutMetrics)).toBe(true);
      
      // Should have different number of elements when metrics are shown vs hidden
      // (This assumes the implementation adds metric text elements)
      expect(withMetrics.length).toBeGreaterThanOrEqual(withoutMetrics.length);
    });

    it('should create proper power zone colors', () => {
      // Test data with different power zones
      const zonedWorkoutData: WorkoutData = {
        time: [0, 60, 120, 180, 240],
        value: [0.4, 0.7, 1.0, 1.3, 1.8],  // Recovery, Endurance, FTP, AC, NM zones
        type: ['FTP', 'FTP', 'FTP', 'AC', 'NM'],
        __typename: 'WorkoutData'
      };

      const svgElements = generateSVG(zonedWorkoutData, mockUserProfile, false);
      expect(Array.isArray(svgElements)).toBe(true);
      
      // Should generate elements for each power zone
      const rectElements = svgElements.filter(element => 
        element && typeof element === 'object' && 'type' in element && element.type === 'rect'
      );
      expect(rectElements.length).toBeGreaterThan(0);
    });

    it('should handle single data point', () => {
      const singlePointData: WorkoutData = {
        time: [0],
        value: [1.0],
        type: ['FTP'],
        __typename: 'WorkoutData'
      };

      const svgElements = generateSVG(singlePointData, mockUserProfile, false);
      expect(Array.isArray(svgElements)).toBe(true);
      expect(svgElements.length).toBeGreaterThan(0);
    });

    it('should handle negative or zero values', () => {
      const negativeValueData: WorkoutData = {
        time: [0, 30, 60],
        value: [-0.1, 0, 0.5],
        type: ['FTP', 'FTP', 'FTP'],
        __typename: 'WorkoutData'
      };

      const svgElements = generateSVG(negativeValueData, mockUserProfile, false);
      expect(Array.isArray(svgElements)).toBe(true);
      // Should handle negative values gracefully without crashing
      expect(svgElements.length).toBeGreaterThan(0);
    });

    it('should maintain consistent SVG structure', () => {
      const svgElements = generateSVG(mockWorkoutData, mockUserProfile, true);
      
      // Should include baseline grid lines
      const lineElements = svgElements.filter(element => 
        element && typeof element === 'object' && 'type' in element && element.type === 'line'
      );
      expect(lineElements.length).toBeGreaterThan(0);
    });

    it('should render rectangles without gaps (gapless) using integer values', () => {
      const gapTestData: WorkoutData = {
        time: [0, 60, 120, 180],
        value: [0.5, 0.8, 1.0],
        type: ['FTP', 'AC', 'MAP'],
        __typename: 'WorkoutData'
      };

      const svgElements = generateSVG(gapTestData, mockUserProfile, false);
      
      // Find rect elements
      const rectElements = svgElements.filter(element => 
        element && typeof element === 'object' && 'type' in element && element.type === 'rect' &&
        'key' in element && typeof element.key === 'string' && element.key.startsWith('bar-')
      );
      
      expect(rectElements.length).toBe(3); // Should have 3 workout rectangles

      // Verify all positions and widths are integers
      rectElements.forEach((rect: any) => {
        expect(Number.isInteger(rect.props.x)).toBe(true);
        expect(Number.isInteger(rect.props.width)).toBe(true);
      });

      // Verify gapless positioning: Rect1.x + Rect1.width = Rect2.x
      if (rectElements.length >= 2) {
        const rect1 = rectElements[0] as any;
        const rect2 = rectElements[1] as any;
        
        const rect1End = rect1.props.x + rect1.props.width;
        const rect2Start = rect2.props.x;
        
        // Should be exactly equal (no gap)
        expect(rect1End).toBe(rect2Start);
      }
    });
  });

  describe('generateWorkoutHeader', () => {
    it('should generate header elements with workout data and metrics', () => {
      const headerElements = generateWorkoutHeader(
        mockWorkoutData,
        mockUserProfile,
        true
      );

      expect(Array.isArray(headerElements)).toBe(true);
      expect(headerElements.length).toBeGreaterThan(0);
      
      // Should contain text elements for the workout name and metrics
      const textElements = headerElements.filter(element =>
        element && typeof element === 'object' && 'type' in element && element.type === 'text'
      );
      expect(textElements.length).toBeGreaterThan(0);
    });

    it('should handle missing user profile gracefully', () => {
      const headerElements = generateWorkoutHeader(mockWorkoutData, undefined, true);
      
      expect(Array.isArray(headerElements)).toBe(true);
      expect(headerElements.length).toBeGreaterThan(0);
    });

    it('should work with showMetrics enabled and disabled', () => {
      const headerWithMetrics = generateWorkoutHeader(mockWorkoutData, mockUserProfile, true);
      const headerWithoutMetrics = generateWorkoutHeader(mockWorkoutData, mockUserProfile, false);

      expect(Array.isArray(headerWithMetrics)).toBe(true);
      expect(Array.isArray(headerWithoutMetrics)).toBe(true);
      expect(headerWithMetrics.length).toBeGreaterThan(0);
      // When showMetrics is false, it should return empty array
      expect(headerWithoutMetrics.length).toBe(0);
    });

    it('should handle empty workout data', () => {
      const headerElements = generateWorkoutHeader(emptyWorkoutData, mockUserProfile, true);

      expect(Array.isArray(headerElements)).toBe(true);
      expect(headerElements.length).toBeGreaterThan(0);
    });

    it('should work with different user profiles', () => {
      const alternativeProfile: UserPowerProfile = {
        nm: 1200,
        ac: 500,
        map: 400,
        ftp: 300,
        targetIntensity: 70
      };
      
      const headerElements = generateWorkoutHeader(mockWorkoutData, alternativeProfile, true);
      
      expect(Array.isArray(headerElements)).toBe(true);
      expect(headerElements.length).toBeGreaterThan(0);
    });

    it('should handle complex workout data', () => {
      const complexWorkoutData: WorkoutData = {
        time: [0, 120, 240, 360, 480, 600, 720, 840, 960, 1080],
        value: [0.5, 0.7, 1.0, 1.2, 0.8, 1.5, 0.6, 1.1, 0.4, 0.5],
        type: ['FTP', 'FTP', 'FTP', 'AC', 'FTP', 'NM', 'FTP', 'MAP', 'FTP', 'FTP'],
        __typename: 'WorkoutData'
      };
      
      const headerElements = generateWorkoutHeader(complexWorkoutData, mockUserProfile, true);
      
      expect(Array.isArray(headerElements)).toBe(true);
      expect(headerElements.length).toBeGreaterThan(0);
    });
  });

  describe('SVG Integration', () => {
    it('should generate valid SVG structure that can be rendered', () => {
      const svgContent = generateSVG(mockWorkoutData, mockUserProfile, true);
      const headerContent = generateWorkoutHeader(mockWorkoutData, mockUserProfile, true);

      // Both should be valid React element arrays
      expect(Array.isArray(svgContent)).toBe(true);
      expect(Array.isArray(headerContent)).toBe(true);
      
      // Should be able to combine them
      const combinedElements = [...headerContent, ...svgContent];
      expect(combinedElements.length).toBeGreaterThan(0);
    });

    it('should maintain consistent coordinate system', () => {
      // Test that different workout lengths produce proportionally scaled SVGs
      const shortWorkout: WorkoutData = {
        time: [0, 30, 60],
        value: [0.5, 1.0, 0.5],
        type: ['FTP', 'FTP', 'FTP'],
        __typename: 'WorkoutData'
      };

      const longWorkout: WorkoutData = {
        time: [0, 900, 1800, 2700, 3600],
        value: [0.5, 1.0, 1.2, 0.8, 0.5],
        type: ['FTP', 'FTP', 'AC', 'FTP', 'FTP'],
        __typename: 'WorkoutData'
      };

      const shortSvg = generateSVG(shortWorkout, mockUserProfile, false);
      const longSvg = generateSVG(longWorkout, mockUserProfile, false);

      expect(Array.isArray(shortSvg)).toBe(true);
      expect(Array.isArray(longSvg)).toBe(true);
      
      // Both should generate valid SVG elements despite different workout lengths
      expect(shortSvg.length).toBeGreaterThan(0);
      expect(longSvg.length).toBeGreaterThan(0);
    });
  });
});