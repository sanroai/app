import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from './Card';
import { Icon3D } from './Icon3D';
import { Colors, Spacing, BorderRadius, Pastel } from '../constants/theme';
import { RemediationMasteryBar } from './RemediationList';
import {
  planProgress,
  stepAction,
  stepActionLabel,
  stepStatusMeta,
  type StepAction,
} from '../lib/remediation-format';
import type { RemediationItem, RemediationPlan } from '../lib/remediation-hooks';

interface StepRowProps {
  item: RemediationItem;
  action: StepAction;
  onPress: () => void;
  busy?: boolean;
}

/** One step of the plan: what it is, where it stands and what to do next. */
export function RemediationStepRow({ item, action, onPress, busy }: StepRowProps) {
  const status = stepStatusMeta(item.status);
  const label = stepActionLabel(action);

  return (
    <View style={[styles.stepRow, status.done && styles.stepRowDone]}>
      <View style={styles.stepBody}>
        <Text style={[styles.stepTitle, status.done && styles.stepTitleDone]} numberOfLines={2}>
          {item.title ?? 'Step'}
        </Text>
        <Text style={styles.stepMeta}>
          {(item.contentType ?? '').replace(/_/g, ' ').toLowerCase()} · {status.label}
        </Text>
      </View>

      {status.done ? (
        <View style={[styles.statusChip, { backgroundColor: status.bg }]}>
          <Ionicons
            name={item.status?.toUpperCase() === 'SKIPPED' ? 'remove-circle' : 'checkmark-circle'}
            size={14}
            color={status.color}
          />
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.actionBtn, busy && styles.actionBtnBusy]}
          onPress={onPress}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${item.title ?? 'step'}`}
        >
          <Ionicons
            name={action === 'practice' ? 'flash' : 'book'}
            size={14}
            color={Colors.primary}
          />
          <Text style={styles.actionText}>{busy ? 'Starting…' : label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

interface PlanCardProps {
  plan: RemediationPlan;
  onOpenConcept: (conceptId: string) => void;
  onStartPractice: (conceptId: string) => void;
  /** The concept whose practice session is currently starting. */
  busyConceptId?: string | null;
}

/** One remediation plan: the concept, the progress and the steps. */
export function RemediationPlanCard({
  plan,
  onOpenConcept,
  onStartPractice,
  busyConceptId,
}: PlanCardProps) {
  const { done, total, percent } = planProgress(plan);
  const conceptName = plan.concept?.name ?? 'Concept';
  const conceptId = plan.concept?.id ?? plan.conceptId;
  const items = plan.items ?? [];
  const finished = (plan.status ?? '').toUpperCase() === 'COMPLETED';

  return (
    <Card style={styles.planCard}>
      <View style={styles.planTop}>
        <View style={styles.planIcon}>
          <Icon3D name="light-bulb" size={26} />
        </View>
        <View style={styles.planBody}>
          <Text style={styles.planName} numberOfLines={2}>
            {conceptName}
          </Text>
          <Text style={styles.planMeta}>
            {done} of {total} {total === 1 ? 'step' : 'steps'} done
          </Text>
        </View>
        <View style={[styles.planPct, finished && styles.planPctDone]}>
          <Text style={[styles.planPctText, finished && styles.planPctTextDone]}>{percent}%</Text>
        </View>
      </View>

      <View style={styles.planBarWrap}>
        <RemediationMasteryBar percent={percent} color={finished ? Colors.success : Colors.primary} />
      </View>

      {items.length === 0 ? (
        <TouchableOpacity
          style={styles.planFallback}
          onPress={() => onOpenConcept(conceptId)}
          accessibilityRole="button"
          accessibilityLabel={`Open ${conceptName}`}
        >
          <Text style={styles.planFallbackText}>No steps yet - open the concept</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.steps}>
          {items.map((item) => {
            const action = stepAction(item.contentType);
            return (
              <RemediationStepRow
                key={item.id}
                item={item}
                action={action}
                busy={busyConceptId === conceptId}
                onPress={() => {
                  if (action === 'practice') onStartPractice(conceptId);
                  else onOpenConcept(conceptId);
                }}
              />
            );
          })}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  planCard: { marginBottom: Spacing.md },
  planTop: { flexDirection: 'row', alignItems: 'center' },
  planIcon: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.md,
    backgroundColor: Pastel.lemon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planBody: { flex: 1, marginHorizontal: Spacing.md },
  planName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  planMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  planPct: {
    backgroundColor: Colors.primary + '15',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  planPctDone: { backgroundColor: Colors.success + '18' },
  planPctText: { fontSize: 13, fontWeight: '800', color: Colors.primary },
  planPctTextDone: { color: Colors.success },
  planBarWrap: { marginTop: Spacing.md },
  steps: { marginTop: Spacing.md, gap: 6 },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  stepRowDone: { backgroundColor: Pastel.mint },
  stepBody: { flex: 1 },
  stepTitle: { fontSize: 13, fontWeight: '600', color: Colors.text },
  stepTitleDone: { color: Colors.textSecondary, textDecorationLine: 'line-through' },
  stepMeta: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  actionBtnBusy: { opacity: 0.55 },
  actionText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  planFallback: { marginTop: Spacing.md, alignItems: 'center' },
  planFallbackText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
});
