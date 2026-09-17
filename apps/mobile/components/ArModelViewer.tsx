import { useMemo, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../constants/theme';

export interface ArViewerHotspot {
  id: string;
  label: string;
  position: [number, number, number];
}

interface Props {
  src: string;
  poster?: string | null;
  title: string;
  hotspots?: ArViewerHotspot[] | null;
  onFirstInteraction?: () => void;
  height?: number;
}

function buildHtml(src: string, poster: string | null, title: string, hotspots: ArViewerHotspot[]) {
  const hotspotMarkup = hotspots
    .map(
      (h) =>
        `<button slot="hotspot-${h.id}" data-position="${h.position.join(' ')}" type="button">${h.label}</button>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<style>
  html, body { margin: 0; padding: 0; background: #f8fafc; height: 100%; }
  model-viewer { width: 100%; height: 100%; background: transparent; --poster-color: transparent; }
  .hint {
    position: absolute; top: 10px; left: 10px; z-index: 5;
    background: rgba(255,255,255,0.92); color: #475569;
    font-family: -apple-system, Roboto, sans-serif; font-size: 11px; font-weight: 600;
    padding: 5px 10px; border-radius: 999px;
  }
  .error {
    position: absolute; inset: 0; display: none; flex-direction: column;
    align-items: center; justify-content: center; gap: 6px;
    font-family: -apple-system, Roboto, sans-serif; color: #64748b; padding: 20px; text-align: center;
  }
  model-viewer [slot^="hotspot"] {
    background: #7c3aed; border: 2px solid #fff; border-radius: 999px; color: #fff;
    font-family: -apple-system, Roboto, sans-serif; font-size: 11px; font-weight: 600;
    padding: 4px 9px; white-space: nowrap;
  }
</style>
</head>
<body>
  <div class="hint" id="hint">Drag to rotate - pinch to zoom</div>
  <model-viewer
    src=${JSON.stringify(src)}
    ${poster ? `poster=${JSON.stringify(poster)}` : ''}
    alt=${JSON.stringify(title)}
    camera-controls
    touch-action="pan-y"
    shadow-intensity="1"
    exposure="1"
    id="viewer"
  >${hotspotMarkup}</model-viewer>
  <div class="error" id="error">
    <div>3D preview could not load.</div>
    <div>Check your connection and try again.</div>
  </div>
  <script type="module" src="https://unpkg.com/@google/model-viewer@3.5.0/dist/model-viewer.min.js"></script>
  <script>
    (function () {
      var viewer = document.getElementById('viewer');
      var error = document.getElementById('error');
      var sent = false;
      function notify() {
        if (sent) return;
        sent = true;
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage('ready');
      }
      if (!viewer) return;
      viewer.addEventListener('load', function () {
        notify();
      });
      viewer.addEventListener('error', function () {
        error.style.display = 'flex';
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage('error');
      });
      viewer.addEventListener('camera-change', notify);
      setTimeout(function () {
        if (!window.customElements || !customElements.get('model-viewer')) {
          error.style.display = 'flex';
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage('error');
        }
      }, 12000);
    })();
  </script>
</body>
</html>`;
}

export function ArModelViewer({ src, poster, title, hotspots, onFirstInteraction, height = 320 }: Props) {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [ready, setReady] = useState(false);

  const html = useMemo(() => buildHtml(src, poster ?? null, title, hotspots ?? []), [src, poster, title, hotspots]);

  if (failed) {
    return (
      <View style={[styles.fallback, { height }]}>
        {poster ? <Image source={{ uri: poster }} style={styles.poster} resizeMode="cover" /> : null}
        <View style={styles.fallbackOverlay}>
          <Ionicons name="cube-outline" size={28} color={Colors.textMuted} />
          <Text style={styles.fallbackTitle}>3D preview unavailable</Text>
          <Text style={styles.fallbackText}>Check your internet connection and try again.</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => {
              setFailed(false);
              setReady(false);
              setAttempt((a) => a + 1);
            }}
          >
            <Ionicons name="refresh" size={16} color={Colors.white} />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      <WebView
        key={attempt}
        originWhitelist={['*']}
        source={{ html }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        onMessage={(event) => {
          const data = event.nativeEvent.data;
          if (data === 'error') setFailed(true);
          if ((data === 'ready' || data === 'interaction') && !ready) {
            setReady(true);
            onFirstInteraction?.();
          }
        }}
        onError={() => setFailed(true)}
        onHttpError={() => setFailed(true)}
      />
      {!ready && (
        <View style={styles.loading} pointerEvents="none">
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.loadingText}>Loading 3D model...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  webview: { flex: 1, backgroundColor: 'transparent' },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceSecondary,
  },
  loadingText: { fontSize: 12, color: Colors.textSecondary },
  fallback: {
    width: '100%',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  poster: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%', opacity: 0.25 },
  fallbackOverlay: { alignItems: 'center', justifyContent: 'center', gap: 6, padding: Spacing.lg },
  fallbackTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  fallbackText: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center' },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: Spacing.sm,
  },
  retryText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
});
