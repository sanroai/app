import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useConceptDetail, useAskAI } from '../../lib/hooks';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

export default function AskScreen() {
  const { conceptId = '' } = useLocalSearchParams<{ conceptId: string }>();
  const { data: concept } = useConceptDetail(conceptId);
  const askAI = useAskAI();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [waiting, setWaiting] = useState(false);

  const suggestions = concept
    ? [
        `Explain ${concept.name} in simple terms`,
        `Give me practice problems on ${concept.name}`,
        `What are the key formulas for ${concept.name}?`,
      ]
    : [];

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || waiting) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: message }]);
    setWaiting(true);
    try {
      const res = await askAI.mutateAsync({
        message,
        context: { conceptId },
      });
      const reply = res?.answer ?? res?.reply ?? res?.explanation ?? 'I could not find an answer. Please try again.';
      setMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setMessages((prev) => [...prev, { role: 'assistant', text: `Error: ${e.message || 'Something went wrong.'}` }]);
    } finally {
      setWaiting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="fitness" size={20} color={Colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Ask Sanro AI</Text>
          <Text style={styles.headerSub}>Context-aware tutor</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.msgList}>
        {messages.length === 0 && (
          <View style={styles.suggest}>
            <Text style={styles.suggestTitle}>Ask anything about {concept?.name ?? 'this concept'}</Text>
            {suggestions.map((s, i) => (
              <TouchableOpacity key={i} style={styles.suggestBtn} onPress={() => send(s)} disabled={waiting}>
                <Ionicons name="sparkles" size={14} color={Colors.primary} />
                <Text style={styles.suggestText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {messages.map((m, i) => (
          <View key={i} style={[styles.bubble, m.role === 'user' ? styles.userBubble : styles.aiBubble]}>
            <Text style={[styles.bubbleText, m.role === 'user' && { color: Colors.white }]}>{m.text}</Text>
          </View>
        ))}
        {waiting && (
          <View style={[styles.bubble, styles.aiBubble]}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        )}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask a question…"
          placeholderTextColor={Colors.textMuted}
          multiline
          editable={!waiting}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || waiting) && styles.sendBtnDisabled]}
          disabled={!input.trim() || waiting}
          onPress={() => send(input)}
        >
          <Ionicons name="send" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.md, borderBottomLeftRadius: BorderRadius.xxl, borderBottomRightRadius: BorderRadius.xxl },
  headerIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: Colors.white, fontSize: 18, fontWeight: '700' },
  headerSub: { color: Colors.primaryLight, fontSize: 12 },
  msgList: { padding: Spacing.lg },
  suggest: { padding: Spacing.md },
  suggestTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, textAlign: 'center', marginBottom: Spacing.lg },
  suggestBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm },
  suggestText: { flex: 1, fontSize: 14, color: Colors.text },
  bubble: { maxWidth: '85%', padding: Spacing.md, borderRadius: BorderRadius.lg, marginBottom: Spacing.sm },
  userBubble: { alignSelf: 'flex-end', backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, color: Colors.text, lineHeight: 20 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', padding: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.surface, gap: Spacing.sm },
  input: { flex: 1, backgroundColor: Colors.surfaceSecondary, borderRadius: BorderRadius.lg, padding: Spacing.md, fontSize: 14, maxHeight: 120, color: Colors.text },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.5 },
});