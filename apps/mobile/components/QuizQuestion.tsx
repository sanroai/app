import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../constants/theme';

// Shared question UI used by practice and assessment attempts.
//
// The selected value is the option TEXT, because that is what the API grades
// against (question.answer holds the text of the correct option). Sending the
// option id instead silently marked every answer wrong.
//
// MULTI_SELECT is the one exception: the API (gradeObjectiveResponse) parses
// the answer as a JSON array of option TEXTS. A single text does not parse, the
// selection came back empty and EVERY multi-select answer was recorded wrong -
// which silently damaged the concept mastery and denied the 5 XP per correct
// answer. The card therefore renders MULTI_SELECT as a toggle list and emits
// `JSON.stringify(selectedTexts)` through the same onSelect channel.
export interface QuizOption {
  /** Present on practice questions; the attempt API strips the option id. */
  id?: string;
  text: string;
  order: number;
}
export interface QuizQuestion {
  id: string;
  text: string;
  /** MULTI_SELECT -> toggle list. A missing or unknown type -> single select. */
  type?: string;
  marks: number;
  options: QuizOption[];
}

/**
 * Reads the selected option texts out of a MULTI_SELECT answer value.
 * A value that is not a JSON array yields no selection (single-select answers
 * and free text are simply not multi-select answers).
 */
export function parseSelectedTexts(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const trimmed = raw.trim();
  if (!trimmed.startsWith('[')) return [];
  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((entry) => String(entry));
  } catch {
    return [];
  }
}

interface Props {
  question: QuizQuestion;
  index: number;
  total: number;
  selected: string | null;
  onSelect: (optionText: string) => void;
  /** Force the multi-select toggle list (used when the type is missing). */
  multiSelect?: boolean;
  /** free-response questions (no options) */
  textAnswer?: string | null;
  onTextChange?: (value: string) => void;
  onTextBlur?: (value: string) => void;
  reveal?: { correctId?: string; myAnswer?: string } | null;
  compact?: boolean;
}

export function QuizQuestionCard({
  question,
  index,
  total,
  selected,
  onSelect,
  multiSelect,
  textAnswer,
  onTextChange,
  onTextBlur,
  reveal,
  compact,
}: Props) {
  const options = question.options ?? [];

  // MULTI_SELECT is a toggle list; every other type (including a missing or
  // unknown type) stays a single select.
  const isMulti = multiSelect ?? question.type === 'MULTI_SELECT';

  // The multi-select selection is the list of the selected option TEXTS (the
  // API grades the answer as a JSON array of them). The card keeps that list
  // and mirrors it from the `selected` prop, so it works with a parent that
  // stores the answer and with a parent that only listens.
  const [multiSelection, setMultiSelection] = useState<string[]>([]);
  const [syncedFrom, setSyncedFrom] = useState<string | null | undefined>(undefined);

  if (isMulti && selected !== syncedFrom) {
    setSyncedFrom(selected);
    setMultiSelection(parseSelectedTexts(selected));
  }

  if (options.length === 0) {
    // A written answer: the student needs a real input, not just a hint.
    return (
      <View style={styles.qCard}>
        <View style={styles.qTop}>
          <Text style={styles.qNum}>
            Q{index + 1}
            {total ? `/${total}` : ''}
          </Text>
          <Text style={styles.qMarks}>
            {question.marks} mark{question.marks !== 1 ? 's' : ''}
          </Text>
        </View>
        <Text style={styles.qText}>{question.text}</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Type your answer here..."
          placeholderTextColor={Colors.textMuted}
          multiline
          textAlignVertical="top"
          value={textAnswer ?? ''}
          onChangeText={onTextChange}
          onEndEditing={(e) => onTextBlur?.(e.nativeEvent.text)}
          accessibilityLabel={`Answer for question ${index + 1}`}
        />
      </View>
    );
  }

  // The API grades a MULTI_SELECT answer as a JSON array of the selected
  // option TEXTS, so the whole selection is emitted on every toggle.
  const toggleOption = (optionText: string) => {
    const next = multiSelection.includes(optionText)
      ? multiSelection.filter((text) => text !== optionText)
      : [...multiSelection, optionText];
    setMultiSelection(next);
    onSelect(JSON.stringify(next));
  };

  return (
    <View style={[styles.qCard, compact && styles.compact]}>
      <View style={styles.qTop}>
        <Text style={styles.qNum}>
          Q{index + 1}
          {total ? `/${total}` : ''}
        </Text>
        <Text style={styles.qMarks}>
          {question.marks} mark{question.marks !== 1 ? 's' : ''}
        </Text>
      </View>
      <Text style={styles.qText}>{question.text}</Text>
      {isMulti ? <Text style={styles.multiHint}>Select all that apply</Text> : null}
      <View style={styles.opts}>
        {options.map((opt, optIndex) => {
          const isSelected = isMulti ? multiSelection.includes(opt.text) : selected === opt.text;
          const textStyle = isSelected ? styles.optTextSelected : styles.optText;
          return (
            <TouchableOpacity
              // the attempt API strips the option id, so fall back to the
              // position in the list (the option order is not unique)
              key={opt.id ?? `${opt.order}-${opt.text}`}
              style={[styles.opt, isSelected && styles.optSelected]}
              onPress={() => (isMulti ? toggleOption(opt.text) : onSelect(opt.text))}
              disabled={!!reveal}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <Text style={styles.optLetter}>{String.fromCharCode(65 + optIndex)}.</Text>
              <Text style={textStyle}>{opt.text}</Text>
              {isMulti ? (
                <Ionicons
                  name={isSelected ? 'checkbox' : 'square-outline'}
                  size={18}
                  color={isSelected ? Colors.primary : Colors.textMuted}
                />
              ) : isSelected ? (
                <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
              ) : null}
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
  multiHint: { fontSize: 12, color: Colors.textMuted, marginTop: Spacing.sm },
  textInput: {
    marginTop: Spacing.md,
    minHeight: 96,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 14,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  opts: { marginTop: Spacing.md, gap: Spacing.sm },
  opt: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: 12 },
  optSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  optCorrect: { borderColor: Colors.success, backgroundColor: Colors.success + '15' },
  optWrong: { borderColor: Colors.error, backgroundColor: Colors.error + '10' },
  optLetter: { fontSize: 14, fontWeight: '700', color: Colors.textMuted, marginRight: Spacing.sm, width: 18 },
  optText: { fontSize: 14, color: Colors.text, flex: 1 },
  optTextSelected: { fontSize: 14, color: Colors.text, flex: 1, fontWeight: '600' },
});
