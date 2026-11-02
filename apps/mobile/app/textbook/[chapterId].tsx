import { useCallback, useMemo, useRef, useState } from 'react';
import type { ElementRef } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
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
 * How many rows are kept mounted around the viewport.
 *
 * A decoded 1240 px page is ~8 MB in memory, so a whole book (164-224 pages now
 * that classes 3-4 open their full textbook) cannot be a plain stack of children:
 * laying out and decoding every page is what made scrolling hang. The list is
 * virtualised, and only the visible row plus one either side is mounted.
 */
const WINDOW_SIZE = 3;

type TextbookPage = { index: number; path: string };

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
  const scrollRef = useRef<FlatList<TextbookPage>>(null);

  const width = Dimensions.get('window').width;
  const pageHeight = Math.round(width * PAGE_ASPECT);
  const stride = pageHeight + CAPTION_HEIGHT + Spacing.sm;
  const pages = useMemo(() => data?.pages ?? [], [data]);

  const retry = useCallback(() => {
    setFailed({});
    void refetch();
  }, [refetch]);

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
      <FlatList<TextbookPage>
        ref={scrollRef}
        data={pages}
        keyExtractor={(page) => String(page.index)}
        style={{ flex: 1 }}
        scrollEnabled={!zoomed}
        contentContainerStyle={{ paddingTop: Spacing.sm, paddingBottom: Spacing.xl }}
        // Every row is exactly the same height, so the list can jump straight to a
        // scroll offset instead of measuring 200 rows first.
        getItemLayout={(_, index) => ({ length: stride, offset: stride * index, index })}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        windowSize={WINDOW_SIZE}
        updateCellsBatchingPeriod={50}
        ListHeaderComponent={
          <>
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
            {data?.bookLevel ? (
              <Text
                style={{
                  marginHorizontal: Spacing.lg,
                  marginBottom: Spacing.sm,
                  textAlign: 'center',
                  fontSize: 12,
                  fontWeight: '600',
                  color: Colors.primary,
                }}
              >
                The full Class {chapter?.grade ?? ''} textbook — your chapter’s topic is inside, scroll to find it
              </Text>
            ) : null}
          </>
        }
        renderItem={({ item }) => (
          <View style={{ height: stride }}>
            {failed[item.index] ? (
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
                  Page {item.index} did not load — tap to retry
                </Text>
              </TouchableOpacity>
            ) : (
              <ZoomablePage
                uri={absoluteApiUrl(item.path)}
                width={width}
                height={pageHeight}
                label={`${chapter?.name ?? 'Chapter'} page ${item.index}`}
                zoomed={zoomed}
                onZoomChange={setZoomed}
                scrollRef={scrollRef}
                onError={() => setFailed((current) => ({ ...current, [item.index]: true }))}
              />
            )}
            <Text
              style={{
                height: CAPTION_HEIGHT,
                lineHeight: CAPTION_HEIGHT,
                textAlign: 'center',
                fontSize: 12,
                color: Colors.textMuted,
              }}
            >
              Page {item.index} of {pages.length}
            </Text>
          </View>
        )}
        ListFooterComponent={
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
        }
      />
    </View>
  );
}
