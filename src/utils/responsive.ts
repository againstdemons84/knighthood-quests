/**
 * Mobile-responsive utilities and breakpoints
 */

export const breakpoints = {
  mobile: '480px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1400px'
} as const;

export const mediaQueries = {
  mobile: `@media (max-width: ${breakpoints.mobile})`,
  tablet: `@media (min-width: ${breakpoints.mobile}) and (max-width: ${breakpoints.tablet})`,
  desktop: `@media (min-width: ${breakpoints.tablet})`,
  wide: `@media (min-width: ${breakpoints.wide})`
} as const;

/**
 * Responsive styles for common patterns
 */
export const responsiveStyles = {
  container: {
    width: '100%',
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 16px',
    '@media (min-width: 768px)': {
      padding: '0 24px'
    }
  },
  
  grid: {
    display: 'grid',
    gap: '16px',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    '@media (max-width: 480px)': {
      gridTemplateColumns: '1fr',
      gap: '12px'
    }
  },
  
  flexColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    '@media (max-width: 480px)': {
      gap: '12px'
    }
  },
  
  flexRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: '16px',
    '@media (max-width: 480px)': {
      flexDirection: 'column',
      gap: '12px'
    }
  }
} as const;

/**
 * Get responsive value based on screen size
 */
export const useResponsiveValue = <T>(
  mobile: T,
  tablet?: T,
  desktop?: T
): T => {
  // In a real app, you'd use a media query hook here
  // For now, we'll detect based on window width
  if (typeof window !== 'undefined') {
    const width = window.innerWidth;
    if (width < 480) return mobile;
    if (width < 768 && tablet) return tablet;
    if (desktop) return desktop;
  }
  return mobile;
};

/**
 * Mobile-friendly touch targets
 */
export const touchTarget = {
  minHeight: '44px',
  minWidth: '44px',
  padding: '12px 16px',
  '@media (max-width: 480px)': {
    minHeight: '48px',
    padding: '14px 18px'
  }
} as const;

/**
 * Responsive typography scale
 */
export const typography = {
  h1: {
    fontSize: '24px',
    lineHeight: '1.2',
    '@media (min-width: 768px)': {
      fontSize: '32px'
    },
    '@media (min-width: 1024px)': {
      fontSize: '36px'
    }
  },
  
  h2: {
    fontSize: '20px',
    lineHeight: '1.3',
    '@media (min-width: 768px)': {
      fontSize: '24px'
    },
    '@media (min-width: 1024px)': {
      fontSize: '28px'
    }
  },
  
  h3: {
    fontSize: '18px',
    lineHeight: '1.4',
    '@media (min-width: 768px)': {
      fontSize: '20px'
    },
    '@media (min-width: 1024px)': {
      fontSize: '22px'
    }
  },
  
  body: {
    fontSize: '14px',
    lineHeight: '1.5',
    '@media (min-width: 768px)': {
      fontSize: '16px'
    }
  }
} as const;

/**
 * Utility function to check if device is mobile
 */
export const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
};

/**
 * Utility function to get safe area insets for mobile
 */
export const getSafeAreaStyle = () => ({
  paddingTop: 'env(safe-area-inset-top)',
  paddingBottom: 'env(safe-area-inset-bottom)',
  paddingLeft: 'env(safe-area-inset-left)',
  paddingRight: 'env(safe-area-inset-right)'
});