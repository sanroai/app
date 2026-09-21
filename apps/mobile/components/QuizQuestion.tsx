import { View, ScrollView, Text, StyleSheet, TouchableOpacity, Alert, type ViewStyle, type TextStyle } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useSavePracticeAnswer } from '../lib/hooks';
import { Colors, Spacing, BorderRadius } from '../constants/theme';

// Shared single question UI used by practice, quiz, challenge, attempt.
export interface QuizOption {
  id: string;
  text: string;
  order: number;
}
export interface QuizQuestion {
  id: string;
  text: string;
  type: string;
  marks: number;
  options: QuizOption[];
}

interface Props {
  question: QuizQuestion;
  index: number;
  total: number;
  selected: string | null;
  onSelect: (optionId: string) => void;
  reveal?: { correctId?: string; myAnswer?: string } | null;
  compact?: boolean;
}

export function QuizQuestionCard({ question, index, total, selected, onSelect, reveal, compact }: Props) {
  const options = question.options ?? [];

  if (options.length === 0) {
    return (
      <View style={styles.qCard}>
        <Text style={styles.qNum}>Q{index + 1}/{total}</Text>
        <Text style={styles.qText}>{question.text}</Text>
        <Text style={styles.aiHint}>Type an answer (free response).</Text>
      </View>
    );
  }

  return (
    <View style={[styles.qCard, compact && styles.compact]}>
      <View style={styles.qTop}>
        <Text style={styles.qNum}>Q{index + 1}{total ? `/${total}` : ''}</Text>
        <Text style={styles.qMarks}>{question.marks} mark{question.marks !== 1 ? 's' : ''}</Text>
      </View>
      <Text style={styles.qText}>{question.text}</Text>
      <View style={styles.opts}>
        {options.map((opt) => {
          const isSelected = selected === opt.id;
          let box: ViewStyle[] = [styles.opt];
          let textStyle: TextStyle | TextStyle[] = styles.optText;
          if (reveal) {
            if (opt.id === reveal.correctId) {
              box = [styles.opt, styles.optCorrect];
              textStyle = [styles.optText, { color: Colors.success }];
            } else if (reveal.myAnswer != null && opt.id === reveal.myAnswer && opt.id !== reveal.correctId) {
              box = [styles.opt, styles.optWrong];
              textStyle = [styles.optText, { color: Colors.error }];
            } else {
              box = [styles.opt, { opacity: 0.55 }];
            }
          } else if (isSelected) {
            box = [styles.opt, styles.optSelected];
            textStyle = [styles.optText, { color: Colors.primary }];
          }
          return (
            <TouchableOpacity key={opt.id} style={box} onPress={() => onSelect(opt.id)} disabled={!!reveal} accessibilityLabel={`Option ${String.fromCharCode(65 + opt.order)}: ${opt.text}`} accessibilityRole="button">
              <Text style={styles.optLetter}>{String.fromCharCode(65 + opt.order)}.</Text>
              <Text style={textStyle}>{opt.text}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  qCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.md },
  compact: { padding: Spacing.md },
  qTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  qNum: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  qMarks: { fontSize: 12, color: Colors.textSecondary },
  qText: { fontSize: 15, fontWeight: '500', color: Colors.text, lineHeight: 22 },
  aiHint: { fontSize: 13, color: Colors.textMuted, marginTop: Spacing.sm },
  opts: { marginTop: Spacing.md, gap: Spacing.sm },
  opt: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: 12 },
  optSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  optCorrect: { borderColor: Colors.success, backgroundColor: Colors.success + '15' },
  optWrong: { borderColor: Colors.error, backgroundColor: Colors.error + '10' },
  optLetter: { fontSize: 14, fontWeight: '700', color: Colors.textMuted, marginRight: Spacing.sm, width: 18 },
  optText: { fontSize: 14, color: Colors.text, flex: 1 },
});