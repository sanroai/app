// Applies the same repair to a local database (the deployed one uses
// POST /questions/repair-encoding).
import { createRequire } from 'node:module';
import { repairMojibake } from '../../apps/api/src/common/text/repair-encoding.ts';

const require = createRequire(new URL('../../apps/api/package.json', import.meta.url));
const { PrismaClient } = require('@prisma/client');

const db = process.argv[2] ?? 'sanro_dev';
process.env.DATABASE_URL = `postgresql://postgres:postgres@localhost:5432/${db}`;

const prisma = new PrismaClient();
let questions = 0;
let options = 0;
try {
  for (const row of await prisma.question.findMany({ select: { id: true, text: true, answer: true } })) {
    const text = repairMojibake(row.text);
    const answer = repairMojibake(row.answer);
    if (text === row.text && answer === row.answer) continue;
    await prisma.question.update({ where: { id: row.id }, data: { text, answer } });
    questions += 1;
  }
  for (const option of await prisma.questionOption.findMany({ select: { id: true, text: true } })) {
    const text = repairMojibake(option.text);
    if (text === option.text) continue;
    await prisma.questionOption.update({ where: { id: option.id }, data: { text } });
    options += 1;
  }
} finally {
  await prisma.$disconnect();
}
console.log(`  ${db}: repaired ${questions} questions, ${options} options`);
