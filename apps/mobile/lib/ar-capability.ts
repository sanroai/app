import { NativeModules, Platform } from 'react-native';

const AR_MODULE_NAMES = ['ExpoAR', 'ARNativeModule', 'ARModule', 'ViroReact', 'SceneView', 'ExpoArModule'];

export interface ArCapability {
  available: boolean;
  reason: string;
  platform: string;
}

export function detectArCapability(): ArCapability {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
    return {
      available: false,
      reason: 'AR experiences are only available on Android and iOS devices.',
      platform: Platform.OS,
    };
  }

  const modules = NativeModules as Record<string, unknown>;
  const hasNativeAr = AR_MODULE_NAMES.some((name) => Boolean(modules[name]));

  if (!hasNativeAr) {
    return {
      available: false,
      reason: 'This build does not include a native AR runtime. Use the interactive 3D preview to rotate and zoom the model.',
      platform: Platform.OS,
    };
  }

  return {
    available: true,
    reason: 'AR is available on this device.',
    platform: Platform.OS,
  };
}
