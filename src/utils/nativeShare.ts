import { Share } from '@capacitor/share';
import { Clipboard } from '@capacitor/clipboard';
import { Capacitor } from '@capacitor/core';
import { safePluginCall } from './capacitorReady';

export const shareScenarioNative = async (scenario: any) => {
  const workoutIds = scenario.workouts.map((w: any) => w.id).join(',');
  const shareUrl = `${window.location.origin}/knighthood-quests/share/?workouts=${workoutIds}&name=${encodeURIComponent(scenario.name)}`;
  
  // Check if we're running on a native platform
  if (Capacitor.isNativePlatform()) {
    try {
      console.log('📱 Preparing native share...');
      
      // Use native sharing on mobile with safe plugin call
      await safePluginCall(
        () => Share.share({
          title: `Knight of Sufferlandria Challenge: ${scenario.name}`,
          text: `Check out my Sufferlandria quest: "${scenario.name}" - a brutal path to knighthood!`,
          url: shareUrl,
          dialogTitle: 'Share Your Quest'
        }),
        // Fallback to clipboard if share fails
        async () => {
          try {
            await safePluginCall(() => Clipboard.write({ string: shareUrl }));
            alert(`Share link copied to clipboard!\n\nAnyone with this link can view and save "${scenario.name}" to their own scenarios.`);
            return {}; // Return empty ShareResult
          } catch {
            // Final fallback - show the URL
            alert(`Share URL: ${shareUrl}\n\nCopy this link to share your scenario.`);
            return {}; // Return empty ShareResult
          }
        }
      );
      
      console.log('✅ Native share completed successfully');
    } catch (error) {
      console.error('All native sharing methods failed:', error);
      // Final fallback - show the URL
      alert(`Share URL: ${shareUrl}\n\nCopy this link to share your scenario.`);
    }
  } else {
    // Web fallback (existing behavior)
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert(`Share link copied to clipboard!\n\nAnyone with this link can view and save "${scenario.name}" to their own scenarios.`);
    } catch (error) {
      // Final fallback: show the URL in a prompt for manual copying
      prompt('Copy this link to share your scenario:', shareUrl);
    }
  }
};