import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { useAuthStore } from '../lib/auth-store';

interface Props {
  visible: boolean;
  /** Absolute URL of the PDF. */
  url: string | null;
  onClose: () => void;
}

/**
 * The chapter PDF viewer.
 *
 * `GET /learning/chapters/:chapterId/pdf` is behind the JWT guard, so the
 * system browser cannot open it (it sends no Authorization header). The WebView
 * can: it loads the URL with the student's bearer token, which is the only way
 * to read the chapter PDF inside the app. "Open in browser" stays available as
 * a fallback for devices whose WebView cannot display a PDF.
 */
export function ChapterPdfViewer({ visible, url, onClose }: Props) {
  const token = useAuthStore((s) => s.token);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      setError(null);
    }
  }, [visible, url]);

  const openInBrowser = async () => {
    if (!url) return;
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert('Chapter PDF', `Open this link to read the chapter PDF:\n${url}`);
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert('Chapter PDF', `The PDF could not be opened in the browser. Open this link instead:\n${url}`);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.title}>Chapter PDF</Text>
          <TouchableOpacity
            onPress={openInBrowser}
            accessibilityRole="button"
            accessibilityLabel="Open the chapter PDF in the browser"
            hitSlop={8}
          >
            <Ionicons name="open-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Close the chapter PDF" hitSlop={8}>
            <Ionicons name="close" size={22} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={30} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.errorBtn} onPress={openInBrowser} accessibilityRole="button">
              <Text style={styles.errorBtnText}>Open in browser</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.body}>
            {url ? (
              <WebView
                source={{ uri: url, headers: token ? { Authorization: `Bearer ${token}` } : undefined }}
                originWhitelist={['http://*', 'https://*']}
                style={styles.web}
                javaScriptEnabled
                domStorageEnabled
                onLoadStart={() => setLoading(true)}
                onLoadEnd={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setError('The chapter PDF could not be loaded. Check your connection and try again.');
                }}
                onHttpError={(event) => {
                  setLoading(false);
                  const status = event.nativeEvent.statusCode;
                  setError(
                    status === 401 || status === 403
                      ? 'Your session expired, so the PDF could not be opened. Sign in again and retry.'
                      : `The chapter PDF could not be loaded (HTTP ${status}).`,
                  );
                }}
              />
            ) : null}
            {loading ? (
              <View style={styles.overlay} pointerEvents="none">
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.overlayText}>Loading the chapter PDF…</Text>
              </View>
            ) : null}
            <Text style={styles.hint}>
              If the PDF does not appear on this device, open it in your browser instead.
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: 17, fontWeight: '700', color: Colors.text },
  body: { flex: 1, padding: Spacing.md },
  web: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, overflow: 'hidden' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background + 'CC',
  },
  overlayText: { fontSize: 13, color: Colors.textSecondary, marginTop: Spacing.md },
  hint: { fontSize: 11, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.sm },
  errorBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  errorText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.md, lineHeight: 20 },
  errorBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    marginTop: Spacing.lg,
  },
  errorBtnText: { color: Colors.white, fontSize: 14, fontWeight: '600' },
});
