import { NativeModules, Platform } from "react-native";

interface WidgetBridgeNative {
  refresh(): Promise<number>;
}

const native: WidgetBridgeNative | undefined =
  Platform.OS === "android" ? NativeModules.WidgetBridge : undefined;

/**
 * Asks the Android home-screen widget to re-fetch the on-chain UbiPool now,
 * instead of waiting for its scheduled 30-min update. Safe to call on iOS
 * (no-op) and safe to call when no widget is on the home screen (returns 0).
 */
export async function refreshUbiWidget(): Promise<void> {
  if (!native) return;
  try {
    await native.refresh();
  } catch {
    // best-effort — widget refresh is decorative, must not block tx success
  }
}
