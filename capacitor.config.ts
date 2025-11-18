import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.knighthood.quests',
  appName: 'Knight of Sufferlandria',
  webDir: 'build',
  server: {
    androidScheme: 'https',
    hostname: 'localhost',
    // Add better error handling and debugging
    errorPath: 'error.html'
  },
  android: {
    // Improve compatibility with older devices
    webContentsDebuggingEnabled: true,
    allowMixedContent: true,
    captureInput: true,
    // Better memory management
    loggingBehavior: 'debug'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0, // We'll control it manually
      backgroundColor: '#1a1a1a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      // Add timeout for splash screen
      launchAutoHide: false
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1a1a1a'
    }
  }
};

export default config;
