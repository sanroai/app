import { StyleSheet, View } from 'react-native';
import MarkdownDisplay from 'react-native-markdown-display';
import { Colors, Spacing } from '../constants/theme';
import { normalizeMarkdown } from '../lib/markdown-normalize';

const rules = StyleSheet.create({
  body: { fontSize: 14, lineHeight: 22, color: Colors.text },
  heading1: { fontSize: 20, fontWeight: '700', color: Colors.text, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  heading2: { fontSize: 17, fontWeight: '700', color: Colors.text, marginTop: Spacing.md, marginBottom: Spacing.xs },
  heading3: { fontSize: 15, fontWeight: '600', color: Colors.text, marginTop: Spacing.md, marginBottom: Spacing.xs },
  heading4: { fontSize: 14, fontWeight: '600', color: Colors.text, marginTop: Spacing.sm, marginBottom: Spacing.xs },
  heading5: { fontSize: 13, fontWeight: '600', color: Colors.text, marginTop: Spacing.sm, marginBottom: Spacing.xs },
  heading6: { fontSize: 12, fontWeight: '600', color: Colors.textMuted, marginTop: Spacing.sm, marginBottom: Spacing.xs },
  strong: { fontWeight: '700', color: Colors.text },
  em: { fontStyle: 'italic' },
  s: { textDecorationLine: 'line-through', color: Colors.textSecondary },
  link: { color: Colors.primary, textDecorationLine: 'underline' },
  bullet_list: { marginBottom: Spacing.sm },
  ordered_list: { marginBottom: Spacing.sm },
  li: { fontSize: 14, lineHeight: 22, color: Colors.text, marginBottom: 2 },
  blockquote: {
    backgroundColor: Colors.primary + '10',
    borderLeftColor: Colors.primaryLight,
    borderLeftWidth: 4,
    borderRadius: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  code_inline: {
    backgroundColor: Colors.surfaceSecondary,
    color: Colors.text,
    fontSize: 12,
    fontFamily: 'monospace',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  code_block: {
    backgroundColor: Colors.text,
    color: Colors.surface,
    fontSize: 12,
    fontFamily: 'monospace',
    padding: Spacing.sm,
    borderRadius: 8,
    marginBottom: Spacing.sm,
  },
  fence: {
    backgroundColor: Colors.text,
    color: Colors.surface,
    fontSize: 12,
    fontFamily: 'monospace',
    padding: Spacing.sm,
    borderRadius: 8,
    marginBottom: Spacing.sm,
  },
  hr: { backgroundColor: Colors.border, height: 1, marginVertical: Spacing.md },
  table: { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, marginBottom: Spacing.sm },
  thead: { backgroundColor: Colors.surfaceSecondary },
  th: { padding: 8, fontWeight: '700', fontSize: 13, color: Colors.text, borderRightWidth: 1, borderRightColor: Colors.border },
  td: { padding: 8, fontSize: 13, color: Colors.text, borderRightWidth: 1, borderRightColor: Colors.border },
  tr: { borderBottomWidth: 1, borderBottomColor: Colors.border },
});

export function Markdown({
  children,
  style,
}: {
  children?: string | null;
  style?: StyleSheet.NamedStyles<unknown>;
}) {
  if (!children || !children.trim()) return null;
  const merged = style ? ({ ...rules, ...style } as StyleSheet.NamedStyles<any>) : rules;
  return (
    <View>
      <MarkdownDisplay style={merged}>{normalizeMarkdown(children)}</MarkdownDisplay>
    </View>
  );
}
