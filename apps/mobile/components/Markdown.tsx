import { StyleSheet, Text, View } from 'react-native';
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
  selectable = false,
}: {
  children?: string | null;
  style?: StyleSheet.NamedStyles<unknown>;
  /** Let a student long-press the text to select and copy it (chapter notes). */
  selectable?: boolean;
}) {
  if (!children || !children.trim()) return null;
  const merged = style ? ({ ...rules, ...style } as StyleSheet.NamedStyles<any>) : rules;
  // Every leaf of the markdown tree is rendered by the `text` rule and wrapped by
  // `textgroup`; Android only honours `selectable` on the outermost Text, so both
  // are overridden when the caller asks for copyable text.
  const overrides = selectable
    ? {
        text: (node: { key: string; content?: string }, _children: unknown, _parent: unknown, styles: { text: unknown }) => (
          <Text key={node.key} selectable style={styles.text as never}>
            {node.content}
          </Text>
        ),
        // Inline runs are wrapped by `textgroup`; selection only works on the
        // outermost Text, so it has to be selectable as well.
        textgroup: (node: { key: string }, children: unknown, _parent: unknown, styles: { textgroup: unknown }) => (
          <Text key={node.key} selectable style={styles.textgroup as never}>
            {children as never}
          </Text>
        ),
      }
    : undefined;
  return (
    <View>
      <MarkdownDisplay style={merged} rules={overrides as never}>
        {normalizeMarkdown(children)}
      </MarkdownDisplay>
    </View>
  );
}
