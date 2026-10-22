import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAskAI } from '../../lib/hooks';
import { Icon3D } from '../../components/Icon3D';
import { Colors, Spacing, BorderRadius, Shadow, Pastel } from '../../constants/theme';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

const SUGGESTIONS = [
  'Explain the reactivity series simply',
  'Why is methane a covalent compound?',
  'How do I balance chemical equations?',
  'Give me 5 questions on acids and bases',
  'What is Ohms law with a real example?',
  'Summarise the chapter on life processes',
];

export default function AskScreen() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const askAI = useAskAI();

  const handleSend = async () => {
    const text = input.trim();
    if (!text || askAI.isPending) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    try {
      const res = await askAI.mutateAsync({ message: text });
      const reply = (res as { answer?: string; explanation?: string; reply?: string }).answer
        || (res as { explanation?: string }).explanation
        || (res as { reply?: string }).reply
        || 'Sorry, I could not generate a response.';
      setMessages((prev) => [...prev, { id: `${Date.now()}-ai`, role: 'assistant', text: reply }]);
    } catch {
      setMessages((prev) => [...prev, { id: `${Date.now()}-err`, role: 'assistant', text: 'Something went wrong. Please try again.' }]);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Ionicons name="sparkles" size={22} color={Colors.white} />
        <Text style={styles.headerTitle}>Ask Sanro AI</Text>
      </View>

      {messages.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View style={styles.heroTile}>
            <Icon3D name="sparkles" size={64} />
          </View>
          <Text style={styles.emptyTitle}>Ask anything</Text>
          <Text style={styles.emptySub}>Get instant help with concepts, formulas, or practice questions.</Text>

          <Text style={styles.suggestLabel}>TRY ASKING</Text>
          <View style={styles.suggestGrid}>
            {SUGGESTIONS.map((s) => (
              <TouchableOpacity
                key={s}
                style={styles.suggestChip}
                activeOpacity={0.85}
                onPress={() => setInput(s)}
              >
                <Ionicons name="sparkles-outline" size={13} color={Colors.primary} />
                <Text style={styles.suggestText} numberOfLines={3}>
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.aiBubble]}>
              <Text style={[styles.bubbleText, item.role === 'user' ? styles.userText : styles.aiText]}>{item.text}</Text>
            </View>
          )}
        />
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask a question…"
          placeholderTextColor={Colors.textMuted}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || askAI.isPending) && styles.sendBtnDisabled]}
          disabled={!input.trim() || askAI.isPending}
          onPress={handleSend}
        >
          <Ionicons
            name="arrow-up"
            size={22}
            color={!input.trim() || askAI.isPending ? Colors.textMuted : Colors.white}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.lg, gap: Spacing.sm, borderBottomLeftRadius: BorderRadius.xxl, borderBottomRightRadius: BorderRadius.xxl },
  headerTitle: { color: Colors.white, fontSize: 22, fontWeight: '700' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  heroTile: { width: 96, height: 96, borderRadius: BorderRadius.xl, backgroundColor: Pastel.violet, alignItems: 'center', justifyContent: 'center', ...Shadow.md },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: Colors.text, marginTop: Spacing.lg, letterSpacing: -0.3 },
  emptySub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm, lineHeight: 20 },
  suggestLabel: { alignSelf: 'flex-start', fontSize: 11, fontWeight: '800', color: Colors.textMuted, letterSpacing: 1, marginTop: Spacing.xxl },
  suggestGrid: { alignSelf: 'stretch', flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md },
  suggestChip: { width: '47.5%', flexGrow: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  suggestText: { flex: 1, fontSize: 13, color: Colors.text, lineHeight: 18, fontWeight: '500' },
  list: { padding: Spacing.lg, paddingBottom: Spacing.md },
  bubble: { maxWidth: '80%', borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm },
  userBubble: { alignSelf: 'flex-end', backgroundColor: Colors.primary },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: Colors.surface },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  userText: { color: Colors.white },
  aiText: { color: Colors.text },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', padding: Spacing.md, gap: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  input: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: 14, color: Colors.text, maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: '#e3ddd3' },
});
