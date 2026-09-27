import { useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../constants/theme';

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

export function formatDuration(seconds?: number | null): string | null {
  if (!seconds || seconds <= 0) return null;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins === 0) return `${secs}s`;
  return secs === 0 ? `${mins} min` : `${mins}:${String(secs).padStart(2, '0')}`;
}

export function YouTubePlayer({
  url,
  videoId,
  title,
  thumbnailUrl,
  durationSeconds,
  style,
}: {
  url?: string | null;
  videoId?: string | null;
  title: string;
  thumbnailUrl?: string | null;
  durationSeconds?: number | null;
  style?: object;
}) {
  const id = videoId ?? parseYouTubeId(url);
  const [playing, setPlaying] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (!id) return null;

  const embed = `https://www.youtube.com/embed/${id}?playsinline=1&rel=0&modestbranding=1`;
  const thumb = thumbnailUrl ?? youTubeThumbUrl(id);
  const duration = formatDuration(durationSeconds);

  const player = (
    <WebView
      source={{ uri: embed }}
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
}

const styles = StyleSheet.create({
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
  modalRoot: { flex: 1, backgroundColor: Colors.black, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  modalPlayer: { width: '100%', aspectRatio: 16 / 9, borderRadius: BorderRadius.md, overflow: 'hidden' },
  modalClose: { position: 'absolute', top: Spacing.xl, right: Spacing.lg, zIndex: 10, padding: Spacing.xs },
  modalTitle: { color: Colors.white, fontSize: 15, fontWeight: '600', marginTop: Spacing.lg, textAlign: 'center' },
});
