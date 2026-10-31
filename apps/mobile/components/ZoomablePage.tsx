import { Image, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import type { GestureType } from 'react-native-gesture-handler';
import type { MutableRefObject } from 'react';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const MAX_SCALE = 4;
const ZOOMED = 1.05;

/** Distance from the centre that the page may travel at a given zoom. */
function panLimit(size: number, scale: number): number {
  'worklet';
  return (size * (scale - 1)) / 2;
}

function clamp(value: number, min: number, max: number): number {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

interface ZoomablePageProps {
  uri: string;
  width: number;
  height: number;
  label: string;
  onError?: () => void;
  /** The page is larger than the screen: one finger now pans it, not the list. */
  zoomed?: boolean;
  /** The page is larger than the screen, so the list must stop scrolling. */
  onZoomChange?: (zoomed: boolean) => void;
  /**
   * The scroll view that owns the vertical drag. The pinch blocks it, otherwise
   * Android's native scroll handler claims the two-finger gesture and the page
   * never scales (the list did not even scroll - both gestures lost).
   */
  scrollRef?: { current: unknown };
}

/**
 * One NCERT page that can be read at full size.
 *
 * A rendered page is 1240 px wide, so fitted to a phone it shows the whole page
 * with the body text at roughly half its printed size. A tap enlarges it (2.2x),
 * pinch refines that (up to 4x) and once it is larger than the screen one finger
 * moves it (the reader stops scrolling the list meanwhile); the box keeps the
 * fitted size so the list does not jump.
 *
 * The gestures are composed simultaneously and the pinch is listed first.
 * They used to be `Gesture.Exclusive(tap, pinch|pan)`, which made the pinch wait
 * for the tap to fail - on the device the two-finger gesture was consumed and
 * the page never scaled. A simultaneous group lets the pinch take over the
 * moment the second finger lands, while the tap still fires on a one-finger tap.
 */
export function ZoomablePage({
  uri,
  width,
  height,
  label,
  onError,
  zoomed = false,
  onZoomChange,
  scrollRef,
}: ZoomablePageProps) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const originX = useSharedValue(0);
  const originY = useSharedValue(0);

  const report = (zoomed: boolean) => {
    onZoomChange?.(zoomed);
  };

  const reset = (notify = true) => {
    'worklet';
    scale.value = withTiming(1);
    savedScale.value = 1;
    x.value = withTiming(0);
    y.value = withTiming(0);
    originX.value = 0;
    originY.value = 0;
    if (notify) runOnJS(report)(false);
  };

  const pinchBase = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((event) => {
      const next = clamp(savedScale.value * event.scale, 1, MAX_SCALE);
      scale.value = next;
      const limitX = panLimit(width, next);
      const limitY = panLimit(height, next);
      x.value = clamp(x.value, -limitX, limitX);
      y.value = clamp(y.value, -limitY, limitY);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= 1.02) {
        reset();
        return;
      }
      const limitX = panLimit(width, scale.value);
      const limitY = panLimit(height, scale.value);
      x.value = withTiming(clamp(x.value, -limitX, limitX));
      y.value = withTiming(clamp(y.value, -limitY, limitY));
      originX.value = x.value;
      originY.value = y.value;
      runOnJS(report)(true);
    });

  const externalScroll = scrollRef as unknown as MutableRefObject<GestureType | undefined> | undefined;
  const pinch = externalScroll ? pinchBase.blocksExternalGesture(externalScroll) : pinchBase;

  // One finger pans a zoomed page (the list scrolling is switched off while
  // zoomed, so nothing competes); at fit scale the gesture is disabled and one
  // finger scrolls the book instead.
  const pan = Gesture.Pan()
    .enabled(zoomed)
    .minPointers(1)
    .onStart(() => {
      originX.value = x.value;
      originY.value = y.value;
    })
    .onUpdate((event) => {
      if (scale.value <= 1) return;
      const limitX = panLimit(width, scale.value);
      const limitY = panLimit(height, scale.value);
      x.value = clamp(originX.value + event.translationX, -limitX, limitX);
      y.value = clamp(originY.value + event.translationY, -limitY, limitY);
    })
    .onEnd(() => {
      originX.value = x.value;
      originY.value = y.value;
    });

  const tapZoom = Gesture.Tap()
    .maxDuration(250)
    .maxDistance(14)
    .onEnd((event) => {
      if (scale.value > ZOOMED) {
        reset();
        return;
      }
      // Zoom towards the tapped point: the line under the finger stays put, so a
      // tap on a figure or a paragraph opens right there.
      const next = 2.2;
      const limitX = panLimit(width, next);
      const limitY = panLimit(height, next);
      const targetX = clamp(-(event.x - width / 2) * (next - 1), -limitX, limitX);
      const targetY = clamp(-(event.y - height / 2) * (next - 1), -limitY, limitY);
      scale.value = withTiming(next);
      savedScale.value = next;
      x.value = withTiming(targetX);
      y.value = withTiming(targetY);
      originX.value = targetX;
      originY.value = targetY;
      runOnJS(report)(true);
    });

  const gestures = Gesture.Simultaneous(pinch, pan, tapZoom);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: scale.value }],
  }));

  return (
    <View style={{ width, height, overflow: 'hidden', backgroundColor: '#fff' }}>
      <GestureDetector gesture={gestures}>
        <Animated.View style={[{ width, height }, style]}>
          <Image
            source={{ uri }}
            style={{ width, height }}
            resizeMode="contain"
            onError={onError}
            accessibilityLabel={label}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
