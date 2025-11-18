import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initializeNativeFeatures, setupBackButtonHandler, hideSplashScreenWhenReady } from './utils/nativeInit';
import { logDeviceInfo, checkDeviceCompatibility } from './utils/deviceInfo';

// Initialize native features and render app
const initializeApp = async () => {
  console.log('🏁 Starting app initialization...');
  
  // Log device information for debugging
  await logDeviceInfo();
  
  // Check device compatibility
  const isCompatible = await checkDeviceCompatibility();
  if (!isCompatible) {
    console.warn('⚠️ This device may have compatibility issues');
  }
  
  // Initialize native features (but don't hide splash screen yet)
  await initializeNativeFeatures();
  setupBackButtonHandler();
  
  console.log('🎨 Rendering React app...');
  const container = document.getElementById('root');
  const root = createRoot(container!);
  root.render(<App />);
  
  console.log('✅ App initialization complete');
  
  // Hide splash screen after React has had time to render
  setTimeout(() => {
    hideSplashScreenWhenReady();
  }, 100);
};

// Start the app
initializeApp().catch(error => {
  console.error('❌ App initialization failed:', error);
  // Render app anyway as fallback
  const container = document.getElementById('root');
  const root = createRoot(container!);
  root.render(<App />);
  
  // Still try to hide splash screen even if init failed
  setTimeout(() => {
    hideSplashScreenWhenReady();
  }, 1000);
});