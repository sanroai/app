import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

export const SYSTEM_INSTITUTION_ID = '00000000-0000-0000-0000-00000000a5a1';
export const SYSTEM_INSTITUTION_CODE = 'SANRO-AI';
export const DEFAULT_SUPER_ADMIN_EMAIL = 'admin@sanroai.com';

export type SystemSeedResult = {
  plans: number;
  achievements: number;
  systemInstitution: string | null;
  superAdmin: string | null;
  superAdminCreated: boolean;
  warnings: string[];
};

/**
 * SYSTEM SEED — the minimum records the platform needs to run.
 *
 * Creates/updates ONLY:
 *   1. Subscription plan catalog (pricing configuration)
 *   2. Achievement badge catalog (gamification definitions)
 *   3. The "Sanro AI" system institution (required by /admin/people/*)
 *   4. The bootstrap Super Admin account
 *
 * Never creates demo schools, demo users, curriculum, content or questions.
 */
export async function seedSystem(prisma: PrismaClient): Promise<SystemSeedResult> {
  const warnings: string[] = [];

  // 1. Plan catalog (platform pricing configuration)
  await prisma.plan.upsert({
    where: { key: 'INSTITUTION' },
    update: {},
    create: { key: 'INSTITUTION', name: 'Institution Plan', perSeat: 100, priceYearly: 29999, active: true },
  });
  await prisma.plan.upsert({
    where: { key: 'STUDENT_MONTHLY' },
    update: {},
    create: { key: 'STUDENT_MONTHLY', name: 'Student Monthly', priceMonthly: 249, active: true },
  });
  await prisma.plan.upsert({
    where: { key: 'STUDENT_YEARLY' },
    update: {},
    create: { key: 'STUDENT_YEARLY', name: 'Student Yearly', priceYearly: 2499, active: true },
  });
  const plans = await prisma.plan.count();

  // 2. Achievement badge catalog (definitions only — no grants)
  const achievementDefs = [
    { key: 'FIRST_LOGIN', name: 'First Steps', description: 'Logged in for the first time', xp: 25, icon: 'star' },
    { key: 'FIRST_ASSESSMENT', name: 'First Assessment', description: 'Completed your first assessment', xp: 50, icon: 'clipboard' },
    { key: 'PERFECT_SCORE', name: 'Perfect Score', description: 'Scored 100% on any assessment', xp: 100, icon: 'trophy' },
    { key: 'STREAK_3', name: 'On Fire', description: 'Logged in 3 days in a row', xp: 30, icon: 'flame' },
    { key: 'STREAK_7', name: 'Week Warrior', description: 'Logged in 7 days in a row', xp: 75, icon: 'zap' },
    { key: 'CHAPTER_MASTER', name: 'Chapter Master', description: 'Completed all concepts in a chapter', xp: 150, icon: 'book' },
    { key: 'SPEED_DEMON', name: 'Speed Demon', description: 'Completed an assessment in under 5 minutes', xp: 40, icon: 'clock' },
    { key: 'PRACTICE_PRO', name: 'Practice Pro', description: 'Completed 5 practice quizzes', xp: 60, icon: 'brain' },
  ];
  for (const d of achievementDefs) {
    await prisma.achievement.upsert({ where: { key: d.key }, update: {}, create: d });
  }
  const achievements = await prisma.achievement.count();

  // 3. System institution (root requirement for /admin/people/* and direct subscribers)
  const existingSystem = await prisma.institution.findFirst({ where: { isSystemInstitution: true } });
  let systemInstitution: string | null = existingSystem?.id ?? null;
  if (!existingSystem) {
    const created = await prisma.institution.create({
      data: {
        id: SYSTEM_INSTITUTION_ID,
        name: 'SANRO AI',
        type: 'SANRO_PLATFORM',
        isSystemInstitution: true,
        status: 'ACTIVE',
        code: SYSTEM_INSTITUTION_CODE,
      },
    });
    systemInstitution = created.id;
  }

  // 4. Bootstrap Super Admin — credentials come from env, never hard-coded here.
  const email = (process.env.SEED_SUPER_ADMIN_EMAIL || DEFAULT_SUPER_ADMIN_EMAIL).trim().toLowerCase();
  const password = process.env.SEED_SUPER_ADMIN_PASSWORD;
  const name = process.env.SEED_SUPER_ADMIN_NAME || 'Super Admin';

  const existingAdmin = await prisma.user.findUnique({ where: { email } });
  let superAdmin: string | null = existingAdmin?.id ?? null;
  let superAdminCreated = false;

  if (password) {
    const passwordHash = bcrypt.hashSync(password, 10);
    if (existingAdmin) {
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { isSuperAdmin: true, isActive: true, passwordHash, name: existingAdmin.name || name },
      });
    } else {
      const created = await prisma.user.create({
        data: { name, email, passwordHash, isSuperAdmin: true, isActive: true },
      });
      superAdmin = created.id;
      superAdminCreated = true;
    }
    superAdmin ??= email;
  } else if (existingAdmin) {
    if (!existingAdmin.passwordHash) {
      warnings.push(
        `Super admin ${email} exists but has no password hash and SEED_SUPER_ADMIN_PASSWORD is not set.`,
      );
    }
    await prisma.user.update({ where: { id: existingAdmin.id }, data: { isSuperAdmin: true } });
  } else {
    warnings.push(
      `No super admin exists and SEED_SUPER_ADMIN_PASSWORD is not set. Set it in apps/api/.env then re-run db:seed.`,
    );
  }

  return { plans, achievements, systemInstitution, superAdmin, superAdminCreated, warnings };
}
