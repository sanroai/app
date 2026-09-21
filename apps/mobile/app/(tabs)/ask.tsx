import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAskAI } from '../../lib/hooks';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

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
          <Ionicons name="chatbubble-ellipses-outline" size={56} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Ask anything</Text>
          <Text style={styles.emptySub}>Get instant help with concepts, formulas, or practice questions.</Text>
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
          <Ionicons name="arrow-up" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.lg, gap: Spacing.sm, borderBottomLeftRadius: BorderRadius.xxl, borderBottomRightRadius: BorderRadius.xxl },
  headerTitle: { color: Colors.white, fontSize: 22, fontWeight: '700' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xxl },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, marginTop: Spacing.lg },
  emptySub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm },
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
  sendBtnDisabled: { opacity: 0.4 },
});
