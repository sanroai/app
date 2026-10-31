import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState, type ComponentProps, type ForwardRefExoticComponent, type RefAttributes } from 'react';
import { Image, Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { ChapterMarkerStrip } from './ChapterMarkerStrip';
import { normalizeSegments, type VideoSegment } from '../lib/chapter-hub';

/**
 * `react-native-webview` types the component as a plain function component, so
 * the imperative API (`injectJavaScript`) is not reachable through the ref and
 * `ref` is not an accepted prop. Re-type it once here instead of scattering
 * casts over the file.
 */
interface WebViewInstance {
  injectJavaScript: (script: string) => void;
}

const PlayerWebView = WebView as unknown as ForwardRefExoticComponent<
  ComponentProps<typeof WebView> & RefAttributes<WebViewInstance>
>;

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
]);

const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{6,20}$/;

export function parseYouTubeId(raw?: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  const host = url.hostname.toLowerCase();
  if (!YOUTUBE_HOSTS.has(host)) return null;

  const segments = url.pathname.split('/').filter(Boolean);
  let id: string | null = null;
  if (host === 'youtu.be') {
    id = segments[0] ?? null;
  } else if (url.pathname === '/watch') {
    id = url.searchParams.get('v');
  } else if (segments[0] === 'embed' || segments[0] === 'shorts' || segments[0] === 'live' || segments[0] === 'v') {
    id = segments[1] ?? null;
  } else {
    id = url.searchParams.get('v');
  }
  return id && VIDEO_ID_PATTERN.test(id) ? id : null;
}

export function youTubeThumbUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * YouTube refuses to play inside a plain WebView: a top-level navigation sends no
 * `Origin`/`Referer`, so the player config fails ("Video player configuration
 * error", Error 153), and an embed whose origin is youtube.com itself is rejected
 * as same-origin ("This video is unavailable", Error 152-4).
 *
 * The working shape is: load a small HTML wrapper with a real https base URL and
 * embed the player with the SAME origin in `origin=`. The wrapper's origin then
 * matches the `origin` parameter, YouTube can validate the request and the video
 * plays. (The same error appears in Flutter's youtube_player_iframe.)
 */
const EMBED_ORIGIN = 'https://app.sanroai.com';

export function youTubeEmbedHtml(videoId: string, startSeconds?: number | null): string {
  const start =
    typeof startSeconds === 'number' && Number.isFinite(startSeconds) && startSeconds > 0
      ? Math.floor(startSeconds)
      : 0;
  // cc_load_policy=0 keeps captions off: without it the embed inherits the viewer's
  // own YouTube caption preference and auto-plays subtitles over the lesson.
  const src = `https://www.youtube.com/embed/${videoId}?playsinline=1&rel=0&modestbranding=1&enablejsapi=1&autoplay=1&cc_load_policy=0&hl=en${
    start > 0 ? `&start=${start}` : ''
  }&origin=${encodeURIComponent(EMBED_ORIGIN)}`;
  return [
    '<!DOCTYPE html><html><head>',
    '<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">',
    '<style>html,body{margin:0;padding:0;height:100%;background:#000;overflow:hidden}',
    '#player{width:100%;height:100%;border:0;display:block}</style></head><body>',
    `<iframe id="player" src="${src}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`,
    '</body></html>',
  ].join('');
}

export function formatDuration(seconds?: number | null): string | null {
  if (!seconds || seconds <= 0) return null;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins === 0) return `${secs}s`;
  return secs === 0 ? `${mins} min` : `${mins}:${String(secs).padStart(2, '0')}`;
}

/**
 * Ask the YouTube iframe to jump to `seconds`.
 *
 * The embed is inside our own HTML wrapper, so the command has to be posted to
 * the iframe's window: `postMessage({event:'command',func:'seekTo',args:[n]})`.
 * The wrapper keeps `id="player"` on the iframe for exactly this reason, and
 * the embed URL carries `enablejsapi=1` so the iframe accepts commands.
 */
export function seekScript(seconds: number): string {
  const target = Math.max(0, Math.floor(seconds));
  return (
    `document.getElementById('player').contentWindow.postMessage(` +
    `JSON.stringify({event:'command',func:'seekTo',args:[${target}]}),'*');true;`
  );
}

export interface YouTubePlayerHandle {
  /** Jump the video to `seconds`. */
  seekTo: (seconds: number) => void;
}

/**
 * How often the seek command is repeated. The wrapper page can finish loading
 * before the YouTube iframe inside it is ready, and the first command is then
 * silently dropped - the chapter marker appears to do nothing. The web player
 * retries as well.
 */
const SEEK_RETRY_ATTEMPTS = 3;
const SEEK_RETRY_DELAY_MS = 600;

interface Props {
  url?: string | null;
  videoId?: string | null;
  title: string;
  thumbnailUrl?: string | null;
  durationSeconds?: number | null;
  /** Chapter markers - the points the video is split at. */
  segments?: VideoSegment[] | null;
  /** Called when the student picks a chapter marker. */
  onSeek?: (seconds: number) => void;
  /**
   * Start the lesson at this timestamp instead of 0. Used when a concept row in
   * the chapter hub is tapped: the student lands on the part that teaches it.
   */
  startSeconds?: number | null;
  /** Mount the player immediately instead of the thumbnail (concept deep link). */
  autoPlay?: boolean;
  /** Render the marker list collapsed (chapter hub: concept rows carry the timings). */
  collapseMarkers?: boolean;
  style?: object;
}

export const YouTubePlayer = forwardRef<YouTubePlayerHandle, Props>(function YouTubePlayer(
  { url, videoId, title, thumbnailUrl, durationSeconds, segments, onSeek, startSeconds, autoPlay, collapseMarkers, style },
  ref,
) {
  const id = videoId ?? parseYouTubeId(url);
  const initialStart =
    typeof startSeconds === 'number' && Number.isFinite(startSeconds) && startSeconds > 0
      ? Math.floor(startSeconds)
      : 0;
  const [playing, setPlaying] = useState(autoPlay === true || initialStart > 0);
  const [expanded, setExpanded] = useState(false);
  const [activeMarker, setActiveMarker] = useState<number | null>(initialStart > 0 ? initialStart : null);
  const webViewRef = useRef<WebViewInstance | null>(null);
  const pendingSeek = useRef<number | null>(initialStart > 0 ? initialStart : null);
  const seekTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markers = normalizeSegments(segments);

  const clearSeekTimer = useCallback(() => {
    if (seekTimerRef.current !== null) {
      clearTimeout(seekTimerRef.current);
      seekTimerRef.current = null;
    }
  }, []);

  /**
   * Post the seek command to the iframe and repeat it a few times: the wrapper
   * can report "loaded" before the YouTube iframe inside it is ready, and the
   * command is then dropped - the chapter marker appears to do nothing.
   */
  const postSeek = useCallback(
    (target: number) => {
      clearSeekTimer();
      let attempt = 0;
      const send = () => {
        attempt += 1;
        webViewRef.current?.injectJavaScript(seekScript(target));
        if (attempt < SEEK_RETRY_ATTEMPTS) {
          seekTimerRef.current = setTimeout(send, SEEK_RETRY_DELAY_MS);
        }
      };
      send();
    },
    [clearSeekTimer],
  );

  useEffect(() => {
    return () => {
      if (seekTimerRef.current !== null) clearTimeout(seekTimerRef.current);
    };
  }, []);

  const seekTo = useCallback(
    (seconds: number) => {
      const target = Math.max(0, Math.floor(seconds));
      setActiveMarker(target);
      // The player only exists once the student starts the video, so a marker
      // tapped on the thumbnail has to be applied after the WebView loads.
      setPlaying(true);
      if (webViewRef.current) {
        postSeek(target);
        pendingSeek.current = null;
      } else {
        pendingSeek.current = target;
      }
    },
    [postSeek],
  );

  useImperativeHandle(ref, () => ({ seekTo }), [seekTo]);

  const handleLoadEnd = useCallback(() => {
    const target = pendingSeek.current;
    if (target === null) return;
    pendingSeek.current = null;
    postSeek(target);
  }, [postSeek]);

  const handleMarker = useCallback(
    (seconds: number) => {
      seekTo(seconds);
      onSeek?.(seconds);
    },
    [seekTo, onSeek],
  );

  if (!id) return null;

  const thumb = thumbnailUrl ?? youTubeThumbUrl(id);
  const duration = formatDuration(durationSeconds);

  const player = (
    <PlayerWebView
      ref={webViewRef}
      source={{ html: youTubeEmbedHtml(id, initialStart), baseUrl: EMBED_ORIGIN }}
      originWhitelist={['https://*']}
      // keep the lesson inside the app: the embed's title/logo links use
      // intent:// and would otherwise hand the student over to the YouTube app
      onShouldStartLoadWithRequest={(req: { url: string }) => {
        const url = req.url.toLowerCase();
        if (url.startsWith('intent://') || url.startsWith('market://') || url.startsWith('youtube://')) {
          return false;
        }
        return true;
      }}
      onLoadEnd={handleLoadEnd}
      style={styles.webview}
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      allowsFullscreenVideo
      javaScriptEnabled
      domStorageEnabled
      startInLoadingState
      renderLoading={() => <View style={styles.webviewFallback} />}
    />
  );

  return (
    <View style={styles.wrapper}>
      <View style={[styles.frame, style]}>
        {playing ? (
          <View style={styles.frame}>
            {player}
            <Pressable
              style={styles.expand}
              onPress={() => setExpanded(true)}
              accessibilityLabel={`Expand ${title}`}
              accessibilityRole="button"
              hitSlop={8}
            >
              <Ionicons name="expand" size={16} color={Colors.white} />
            </Pressable>
            {/* fallback: a school network can block the embed, but never the YouTube app */}
            <Pressable
              style={styles.openYouTube}
              onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${id}`).catch(() => {})}
              accessibilityLabel={`Open ${title} on YouTube`}
              accessibilityRole="button"
              hitSlop={8}
            >
              <Ionicons name="logo-youtube" size={14} color={Colors.white} />
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.frame} onPress={() => setPlaying(true)} accessibilityLabel={`Play ${title}`} accessibilityRole="button">
            <Image source={{ uri: thumb }} style={styles.thumb} resizeMode="cover" />
            <View style={styles.overlay}>
              <View style={styles.playCircle}>
                <Ionicons name="play" size={26} color={Colors.white} style={{ marginLeft: 3 }} />
              </View>
            </View>
            {duration ? (
              <View style={styles.duration}>
                <Text style={styles.durationText}>{duration}</Text>
              </View>
            ) : null}
          </Pressable>
        )}
      </View>

      <ChapterMarkerStrip
        segments={markers}
        activeStartSeconds={activeMarker}
        onSelect={handleMarker}
        collapsible={collapseMarkers === true}
      />

      <Modal visible={expanded} animationType="fade" onRequestClose={() => setExpanded(false)} statusBarTranslucent>
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalClose} onPress={() => setExpanded(false)} accessibilityLabel="Close video" hitSlop={8}>
            <Ionicons name="close" size={24} color={Colors.white} />
          </Pressable>
          <View style={styles.modalPlayer}>{player}</View>
          <Text style={styles.modalTitle} numberOfLines={2}>
            {title}
          </Text>
        </View>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { width: '100%' },
  frame: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.black,
  },
  thumb: { width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.25)' },
  playCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  duration: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  durationText: { color: Colors.white, fontSize: 11, fontWeight: '600' },
  webview: { flex: 1, backgroundColor: Colors.black },
  webviewFallback: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.black },
  expand: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  openYouTube: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  modalRoot: { flex: 1, backgroundColor: Colors.black, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  modalPlayer: { width: '100%', aspectRatio: 16 / 9, borderRadius: BorderRadius.md, overflow: 'hidden' },
  modalClose: { position: 'absolute', top: Spacing.xl, right: Spacing.lg, zIndex: 10, padding: Spacing.xs },
  modalTitle: { color: Colors.white, fontSize: 15, fontWeight: '600', marginTop: Spacing.lg, textAlign: 'center' },
});
