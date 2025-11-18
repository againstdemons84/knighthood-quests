import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';

/**
 * Logs detailed device information for debugging compatibility issues
 */
export const logDeviceInfo = async () => {
  if (!Capacitor.isNativePlatform()) {
    console.log('🌐 Running on web platform');
    return;
  }

  try {
    const info = await Device.getInfo();
    console.log('📱 Device Information:', {
      platform: info.platform,
      operatingSystem: info.operatingSystem,
      osVersion: info.osVersion,
      manufacturer: info.manufacturer,
      model: info.model,
      isVirtual: info.isVirtual,
      webViewVersion: info.webViewVersion,
      memUsed: info.memUsed
    });

    // Log specific compatibility concerns
    if (info.isVirtual) {
      console.log('🤖 Running on virtual device (emulator)');
    }
    
    if (info.webViewVersion) {
      console.log('🌐 WebView version:', info.webViewVersion);
    }
    
    // Check for potential memory issues
    if (info.memUsed && info.memUsed > 0.8) {
      console.warn('⚠️ High memory usage detected:', info.memUsed);
    }
    
  } catch (error) {
    console.error('❌ Failed to get device info:', error);
  }
};

/**
 * Check if the current device/emulator might have compatibility issues
 */
export const checkDeviceCompatibility = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) {
    return true; // Web is always compatible
  }

  try {
    const info = await Device.getInfo();
    
    // Check for known problematic configurations
    const concerns: string[] = [];
    
    if (info.model?.includes('Medium Phone') || info.model?.includes('API')) {
      concerns.push('Generic emulator device detected');
    }
    
    if (info.osVersion) {
      const androidVersion = parseInt(info.osVersion.split('.')[0]);
      if (androidVersion < 7) {
        concerns.push(`Old Android version: ${info.osVersion}`);
      }
    }
    
    if (concerns.length > 0) {
      console.warn('⚠️ Potential compatibility concerns:', concerns);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Failed to check device compatibility:', error);
    return false; // Assume incompatible if we can't check
  }
};