import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';
import { ensureCapacitorReady, safePluginCall } from './capacitorReady';

export const initializeNativeFeatures = async () => {
  console.log('🚀 Initializing native features...');
  console.log('📱 Platform:', Capacitor.getPlatform());
  console.log('🔍 Is native platform:', Capacitor.isNativePlatform());
  
  if (Capacitor.isNativePlatform()) {
    try {
      // Ensure Capacitor is ready before making any plugin calls
      await ensureCapacitorReady();
      
      console.log('⚙️ Configuring status bar...');
      await safePluginCall(
        () => StatusBar.setStyle({ style: Style.Dark }),
        () => Promise.resolve()
      );
      await safePluginCall(
        () => StatusBar.setBackgroundColor({ color: '#1a1a1a' }),
        () => Promise.resolve()
      );
      
      console.log('✅ Native features initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing native features:', error);
    }
  } else {
    console.log('🌐 Running in web mode, skipping native features');
  }
};

// Separate function to hide splash screen after React has rendered
export const hideSplashScreenWhenReady = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      console.log('🖼️ Waiting a moment for React to render...');
      // Wait a bit longer to ensure React has actually rendered content
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('🖼️ Now hiding splash screen...');
      await safePluginCall(
        () => SplashScreen.hide(),
        () => Promise.resolve()
      );
      
      console.log('✅ Splash screen hidden successfully');
    } catch (error) {
      console.error('❌ Error hiding splash screen:', error);
    }
  }
};

// Optional: Add back button handling for Android
export const setupBackButtonHandler = () => {
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
    document.addEventListener('ionBackButton', (ev: any) => {
      ev.detail.register(-1, () => {
        if (window.location.pathname === '/' || window.location.pathname === '/knighthood-quests/') {
          // Exit app when on home page
          if ('exitApp' in window) {
            (window as any).exitApp();
          }
        } else {
          // Navigate back in browser history
          window.history.back();
        }
      });
    });
  }
};