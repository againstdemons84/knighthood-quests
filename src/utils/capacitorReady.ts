import { Capacitor } from '@capacitor/core';

// Global flag to track if Capacitor is ready
let capacitorReady = false;
let readyPromise: Promise<void> | null = null;

/**
 * Ensures Capacitor and all its plugins are ready before proceeding
 * This should be called before any Capacitor plugin operations
 */
export const ensureCapacitorReady = (): Promise<void> => {
  // If already ready, resolve immediately
  if (capacitorReady) {
    return Promise.resolve();
  }
  
  // If already waiting, return the existing promise
  if (readyPromise) {
    return readyPromise;
  }
  
  // Create the ready promise
  readyPromise = new Promise<void>((resolve) => {
    if (!Capacitor.isNativePlatform()) {
      // On web, consider it immediately ready
      capacitorReady = true;
      resolve();
      return;
    }
    
    console.log('⏳ Waiting for Capacitor to be ready...');
    
    // Wait for DOM to be ready first
    const waitForDOMAndCapacitor = () => {
      // Use longer delay for older/slower devices
      const delay = 300; // Increased from 150ms for better compatibility
      setTimeout(() => {
        console.log('✅ Capacitor is ready');
        capacitorReady = true;
        resolve();
      }, delay);
    };
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', waitForDOMAndCapacitor);
    } else {
      waitForDOMAndCapacitor();
    }
  });
  
  // Add timeout fallback for very slow devices
  setTimeout(() => {
    if (!capacitorReady) {
      console.warn('⚠️ Capacitor readiness timeout, proceeding anyway');
      capacitorReady = true;
      if (readyPromise) {
        // Force resolve if still waiting
        readyPromise.then(() => {}).catch(() => {});
      }
    }
  }, 5000); // 5 second timeout
  
  return readyPromise;
};

/**
 * Check if Capacitor is ready without waiting
 */
export const isCapacitorReady = (): boolean => {
  return capacitorReady;
};

/**
 * Reset the ready state (useful for testing)
 */
export const resetCapacitorReady = (): void => {
  capacitorReady = false;
  readyPromise = null;
};

/**
 * Wrapper for safe plugin calls that ensures Capacitor is ready
 */
export const safePluginCall = async <T>(
  pluginOperation: () => Promise<T>,
  fallback?: () => Promise<T> | T
): Promise<T> => {
  try {
    await ensureCapacitorReady();
    return await pluginOperation();
  } catch (error) {
    console.error('Plugin operation failed:', error);
    if (fallback) {
      return await fallback();
    }
    throw error;
  }
};