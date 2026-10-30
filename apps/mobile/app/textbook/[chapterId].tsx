import { useCallback, useMemo, useRef, useState } from 'react';
import type { ElementRef } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ZoomablePage } from '../../components/ZoomablePage';
import { useChapterHub, useChapterPages } from '../../lib/hooks';
import { absoluteApiUrl } from '../../lib/api';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';

/** Every rendered NCERT page is 1240 px wide; the aspect ratio keeps the layout stable. */
const PAGE_ASPECT = 1689 / 1240;

/** The "Page n of m" line under a page, plus its margins. */
const CAPTION_HEIGHT = 30;

/**
 * The chapter textbook, read as page images inside the app.
 *
 * Android's WebView cannot render a PDF and handing the file to Chrome only
 * downloads it, so the reader shows the rendered pages (the same NCERT content,
 * one image per page) in a vertical scroller. Pages are short-lived signed links
 * (no header needed) and only the pages around the viewport are mounted: a
 * decoded 1240 px page is ~8 MB, so mounting a whole chapter would run the phone
 * out of memory.
 *
 * The scroller is gesture-handler's own `ScrollView` on purpose. A page has a
 * pinch-to-zoom gesture and a plain RN scroll view wins that two-finger gesture
 * on Android: the page never scaled and, because the pinch was cancelled too,
 * nothing else happened either. Wrapping the scroll in gesture-handler attaches
 * a native handler with a `handlerTag`, which is what the page's pinch needs in
 * order to block it (`blocksExternalGesture`).
 */
export default function TextbookScreen() {
  const { chapterId = '' } = useLocalSearchParams<{ chapterId: string }>();
  const router = useRouter();
  const { data: chapter } = useChapterHub(chapterId);
  const { data, isLoading, error, refetch } = useChapterPages(chapterId);
  const [failed, setFailed] = useState<Record<number, boolean>>({});
  // A zoomed page is larger than the screen and is moved with one finger, so the
  // scroller must not scroll underneath it (the tap gesture then reports zoom out).
  const [zoomed, setZoomed] = useState(false);
  const [visibleIndex, setVisibleIndex] = useState(0);
  const scrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);

  const width = Dimensions.get('window').width;
  const pageHeight = Math.round(width * PAGE_ASPECT);
  const stride = pageHeight + CAPTION_HEIGHT + Spacing.sm;
  const pages = useMemo(() => data?.pages ?? [], [data]);

  const retry = useCallback(() => {
    setFailed({});
    void refetch();
  }, [refetch]);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.round(event.nativeEvent.contentOffset.y / stride);
      const clamped = Math.min(Math.max(next, 0), Math.max(pages.length - 1, 0));
      setVisibleIndex((current) => (current === clamped ? current : clamped));
    },
    [pages.length, stride],
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ marginTop: Spacing.md, color: Colors.textMuted }}>Opening the textbook…</Text>
      </View>
    );
  }

  if (error || !pages.length) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: Colors.background,
          padding: Spacing.xl,
        }}
      >
        <Ionicons name="book-outline" size={44} color={Colors.textMuted} />
        <Text style={{ marginTop: Spacing.md, fontSize: 16, fontWeight: '700', color: Colors.text }}>
          The textbook is not available
        </Text>
        <Text style={{ marginTop: Spacing.xs, textAlign: 'center', color: Colors.textMuted }}>
          {error
            ? 'We could not load the pages. Check your connection and try again.'
            : 'This chapter has no textbook pages on the server yet. The chapter notes cover the same content.'}
        </Text>
        <TouchableOpacity
          onPress={retry}
          style={{
            marginTop: Spacing.lg,
            paddingHorizontal: Spacing.lg,
            paddingVertical: Spacing.sm,
            borderRadius: BorderRadius.lg,
            backgroundColor: Colors.primary,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>Try again</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: Spacing.md }}>
          <Text style={{ color: Colors.primary, fontWeight: '600' }}>Back to the chapter</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <Stack.Screen options={{ title: chapter?.name ?? 'Textbook' }} />
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        scrollEnabled={!zoomed}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingTop: Spacing.sm, paddingBottom: Spacing.xl }}
      >
        <Text
          style={{
            marginHorizontal: Spacing.lg,
            marginBottom: Spacing.sm,
            textAlign: 'center',
            fontSize: 12,
            color: Colors.textMuted,
          }}
        >
          Tap a page to zoom · pinch to adjust · tap again to fit
        </Text>
        {pages.map((page, index) => (
          <View key={page.index} style={{ marginBottom: Spacing.sm }}>
            {failed[page.index] ? (
              <TouchableOpacity
                onPress={retry}
                style={{
                  height: pageHeight,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: Colors.surface,
                }}
              >
                <Ionicons name="refresh" size={28} color={Colors.textMuted} />
                <Text style={{ marginTop: Spacing.xs, color: Colors.textMuted }}>
                  Page {page.index} did not load — tap to retry
                </Text>
              </TouchableOpacity>
            ) : Math.abs(index - visibleIndex) <= 1 ? (
              <ZoomablePage
                uri={absoluteApiUrl(page.path)}
                width={width}
                height={pageHeight}
                label={`${chapter?.name ?? 'Chapter'} page ${page.index}`}
                zoomed={zoomed}
                onZoomChange={setZoomed}
                scrollRef={scrollRef}
                onError={() => setFailed((current) => ({ ...current, [page.index]: true }))}
              />
            ) : (
              <View style={{ width, height: pageHeight, backgroundColor: Colors.surface }} />
            )}
            <Text
              style={{
                marginTop: Spacing.xs,
                marginBottom: Spacing.xs,
                textAlign: 'center',
                fontSize: 12,
                color: Colors.textMuted,
              }}
            >
              Page {page.index} of {pages.length}
            </Text>
          </View>
        ))}
        <View style={{ alignItems: 'center', paddingTop: Spacing.lg, paddingBottom: Spacing.xl }}>
          <Text style={{ color: Colors.textMuted, fontSize: 12 }}>
            End of chapter · {pages.length} page{pages.length === 1 ? '' : 's'}
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              marginTop: Spacing.md,
              flexDirection: 'row',
              alignItems: 'center',
              gap: Spacing.xs,
              paddingHorizontal: Spacing.lg,
              paddingVertical: Spacing.sm,
              borderRadius: BorderRadius.lg,
              backgroundColor: Colors.primary,
            }}
          >
            <Ionicons name="arrow-back" size={16} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '700' }}>Back to the chapter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
