// Gives every question's options a distinct 0..n-1 `order`, then rotates that
// order per question so the correct answer does not sit in a predictable slot.
//
// Before this, the whole bank stored `order = 0` on almost every option (4728 of
// 6192), so the display order was whatever Postgres happened to return. The
// graded answer is the option TEXT, so reordering cannot change what is correct.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });

const before = await prisma.$queryRaw`
  select count(*) filter (where "order" = 0) as at_zero, count(*) as total from "QuestionOption"
`;
console.log('before:', JSON.stringify(before, (k, v) => (typeof v === 'bigint' ? Number(v) : v)));

const updated = await prisma.$executeRaw`
  with qr as (
    select id,
           "conceptId",
           (dense_rank() over (partition by "conceptId" order by id) - 1) as qrank
    from "Question"
  ),
  ranked as (
    select o.id,
           o."questionId",
           o."order" as cur,
           count(*) over (partition by o."questionId") as n,
           row_number() over (partition by o."questionId" order by o."order", o.ctid) - 1 as seq,
           qr."conceptId" as cid,
           qr.qrank
    from "QuestionOption" o
    join qr on qr.id = o."questionId"
  )
  update "QuestionOption" t
  set "order" = (r.seq + (abs(hashtext(coalesce(r.cid::text, r."questionId"::text))) + r.qrank) % greatest(r.n, 1)) % greatest(r.n, 1)
  from ranked r
  where t.id = r.id
`;
console.log('options reordered:', updated);

const after = await prisma.$queryRaw`
  select
    count(*) filter (where "order" = 0) as at_zero,
    count(*) as total,
    count(*) filter (where "order" = 0 and "isCorrect") as correct_first,
    count(*) filter (where "isCorrect") as correct_total
  from "QuestionOption"
`;
console.log('after:', JSON.stringify(after, (k, v) => (typeof v === 'bigint' ? Number(v) : v)));

const dupes = await prisma.$queryRaw`
  select count(*) as questions_with_duplicate_order from (
    select "questionId" from "QuestionOption" group by "questionId", "order" having count(*) > 1
  ) d
`;
console.log('integrity:', JSON.stringify(dupes, (k, v) => (typeof v === 'bigint' ? Number(v) : v)));

await prisma.$disconnect();
