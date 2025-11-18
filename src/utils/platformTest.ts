import { Capacitor } from '@capacitor/core';

// Simple test to verify platform detection and routing
export const testPlatformDetection = () => {
  const tests = {
    'Capacitor.isNativePlatform()': Capacitor.isNativePlatform(),
    'Capacitor.getPlatform()': Capacitor.getPlatform(),
    'window.Capacitor exists': typeof window !== 'undefined' && !!(window as any).Capacitor,
    'Location protocol': typeof window !== 'undefined' ? window.location.protocol : 'N/A',
    'Location hostname': typeof window !== 'undefined' ? window.location.hostname : 'N/A',
    'Location href': typeof window !== 'undefined' ? window.location.href : 'N/A',
    'Base tag href': typeof document !== 'undefined' ? document.querySelector('base')?.href || 'No base tag' : 'N/A'
  };
  
  console.log('🧪 Platform Detection Tests:', tests);
  return tests;
};

// Test what the router basename should be
export const getRouterBasename = () => {
  // Check if we're in a Capacitor environment
  const isCapacitor = typeof window !== 'undefined' && (
    Capacitor.isNativePlatform() ||
    window.location.protocol === 'capacitor:'
  );
  
  // For Capacitor, always use root
  if (isCapacitor) {
    console.log('🎯 Router basename determination: Using "/" for Capacitor');
    return '/';
  }
  
  // For web environments, always use the knighthood-quests path
  // This matches our Vite config and GitHub Pages deployment
  const basename = '/knighthood-quests';
  
  console.log('🎯 Router basename determination:', {
    isCapacitor: false,
    currentPath: window.location.pathname,
    currentHost: window.location.hostname,
    currentProtocol: window.location.protocol,
    basename,
    reasons: {
      'Capacitor.isNativePlatform()': Capacitor.isNativePlatform(),
      'capacitor protocol': window.location.protocol === 'capacitor:',
      'using web basename': true
    }
  });
  
  return basename;
};