# SANRO AI — Analytics

## 1. Event Taxonomy

Product events (server-side, per student/institution as relevant):

- learning_started
- concept_opened
- video_started
- practice_started
- assessment_started
- assessment_submitted
- diagnosis_generated
- fix_started
- remediation_completed
- retest_started
- retest_completed
- improvement_recorded

Avoid collecting unnecessary personal/device information.

## 2. Derived Metrics

- XP, streak, mastery — from gamification profile + ConceptMastery
- Concept evidence: attempted/correct/accuracy
- Improvement: before/after on retest for the same concept
- Institutional analytics: completion, average performance, concept gaps,
  remediation progress, retest improvement

## 3. Dashboard Consumption

- Student: focus today, progress summary, recent activity
- Teacher: class analytics, weak concepts, students needing attention
- Principal: institution-level trend + comparison across classes
- Parent: child improvement + weak areas
- Super Admin: platform usage + content completeness

## 4. Reports

Student / Teacher-Class / Parent / Institution / Assessment / Concept /
Remediation / Improvement. Exports: PDF + CSV. Reports use real data only.

## 5. Integrity

No fake statistics, fake mastery, fake charts. Demo data only via explicit
seed. Historical measurements reference immutable attempt data.