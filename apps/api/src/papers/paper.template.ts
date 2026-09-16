import { SECTION_LABELS } from './papers.service';

interface PaperQuestionRow {
  sectionName: string;
  sectionOrder: number;
  order: number;
  marks: number;
  question: {
    id: string;
    text: string;
    type: string;
    answer: string;
    explanation?: string | null;
    status: string;
    concept?: { name?: string } | null;
    options?: Array<{ text: string; isCorrect: boolean; order: number }>;
  };
}

interface ResolvedPaper {
  title: string;
  examName: string;
  grade: string;
  totalMarks: number;
  durationMinutes: number;
  date?: Date | null;
  instructions?: string | null;
  language?: string;
  questions: PaperQuestionRow[];
  subject: { name: string; code?: string | null };
  institution: { name: string; logoUrl?: string | null; address?: string | null; city?: string | null; state?: string | null };
}

function esc(s: string | null | undefined): string {
  return (s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(d?: Date | null): string {
  if (!d) return String(new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }));
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function objectiveAnswer(q: PaperQuestionRow['question']): string {
  if (!q.options || q.options.length === 0) return '';
  const letters = 'abcd'.split('');
  const correct = q.options
    .map((o, i) => ({ o, i }))
    .filter((x) => x.o.isCorrect)
    .map((x) => `(${letters[x.i] ?? x.i + 1})`)
    .join(', ');
  return `Correct option: ${correct || q.answer}`;
}

export function paperHTML(paper: ResolvedPaper, kind: 'STUDENT' | 'ANSWER_KEY'): string {
  const groups = new Map<string, PaperQuestionRow[]>();
  for (const q of paper.questions) {
    const arr = groups.get(q.sectionName) ?? [];
    arr.push(q);
    groups.set(q.sectionName, arr);
  }
  const ordered = [...groups.entries()].sort((a, b) => {
    const pa = a[1][0]?.sectionOrder ?? 0;
    const pb = b[1][0]?.sectionOrder ?? 0;
    return pa - pb;
  });

  const sectionHTML = ordered
    .map(([name, rows]) => {
      const label = SECTION_LABELS[rows[0]?.question.type ?? ''] ?? '';
      const marks = rows[0]?.marks ?? 0;
      const block = rows
        .map((r, i) => {
          const q = r.question;
          const options =
            q.type === 'MCQ' || q.type === 'MULTI_SELECT' || q.type === 'TRUE_FALSE'
              ? `<ol class="options">${(q.options ?? []).map((o, idx) => `<li>${esc(o.text)}</li>`).join('')}</ol>`
              : q.type === 'FILL_BLANK'
                ? '<div class="blank"></div>'
                : '<div class="blank tall"></div>';

          const answerBlock =
            kind === 'ANSWER_KEY'
              ? `<div class="answer">Answer: ${esc(q.answer)}${q.explanation ? `<div class="explanation">${esc(q.explanation)}</div>` : ''}</div>`
              : '';

          const conceptTag = q.concept?.name ? `<span class="concept">${esc(q.concept.name)}</span>` : '';
          return `<div class="q">
            <div class="qno">${i + 1}.</div>
            <div class="qbody">
              <div class="qtext">${esc(q.text)} ${conceptTag}</div>
              ${options}
              ${answerBlock}
            </div>
            <div class="qmarks">[${r.marks}]</div>
          </div>`;
        })
        .join('');
      return `<section>
        <h3 class="sechead">${esc(name)}${label ? ` <span class="secsub">(${esc(label)})</span>` : ''} <span class="secmarks">${rows.length} × ${marks} = ${rows.length * marks} Marks</span></h3>
        ${block}
      </section>`;
    })
    .join('');

  const header =
    kind === 'ANSWER_KEY'
      ? '<div class="ktag">ANSWER KEY - FOR TEACHER USE ONLY</div>'
      : '';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(paper.title)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Georgia, 'Times New Roman', serif; color: #111; margin: 0; font-size: 12.5px; line-height: 1.45; }
  .page { max-width: 190mm; margin: 0 auto; }
  .least { color: #666; font-size: 11px; }
  .insthead { display: flex; align-items: center; justify-content: center; border-bottom: 2px solid #111; padding-bottom: 8px; margin-bottom: 8px; }
  .logo { width: 50px; height: 50px; object-fit: contain; margin-right: 10px; }
  .inst { text-align: center; }
  .inst h1 { font-size: 18px; margin: 0 0 2px; letter-spacing: 0.5px; }
  .inst .addr { font-size: 10px; color: #444; }
  .ktag { background:#000; color:#fff; text-align:center; font-weight:700; padding:2px 8px; margin-bottom:8px; font-size:11px; letter-spacing:2px; }
  .titleblock { text-align: center; border: 1.5px solid #111; padding: 8px 12px; margin-bottom: 10px; }
  .titleblock h2 { font-size: 15px; margin: 0 0 4px; }
  .meta { display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; max-width: 320px; margin: 0 auto; }
  .instructions { border: 1px solid #999; padding: 6px 10px; margin-bottom: 10px; background: #fafafa; }
  .instructions h4 { margin: 0 0 3px; font-size: 11px; text-transform: uppercase; }
  .instructions p { margin: 0; font-size: 11px; }
  section { margin-bottom: 12px; }
  .sechead { font-size: 13px; font-weight: 700; border-bottom: 1px solid #111; padding-bottom: 3px; margin: 0 0 6px; }
  .secsub { font-weight: 400; }
  .secmarks { float: right; font-weight: 600; font-size: 11px; }
  .q { display: flex; margin-bottom: 8px; page-break-inside: avoid; break-inside: avoid; }
  .qno { width: 22px; font-weight: 600; }
  .qbody { flex: 1; }
  .qtext { margin-bottom: 2px; }
  .concept { display: inline-block; background:#eef; border:1px solid #ccd; color:#334; font-size:9.5px; padding:0 5px; border-radius:3px; margin-left:4px; }
  ol.options { margin: 3px 0 2px 18px; padding: 0; }
  ol.options li { margin-bottom: 1px; }
  .blank { border-bottom: 1px dotted #333; height: 16px; margin: 3px 0; }
  .blank.tall { height: 60px; }
  .qmarks { width: 42px; text-align: right; font-weight: 600; font-size: 11px; }
  .answer { margin-top: 4px; padding: 4px 8px; background: #f5f5dc; border-left: 3px solid #caa; font-size: 11px; }
  .answer .explanation { margin-top: 2px; color: #444; }
  printfoot { display: block; text-align: center; margin-top: 14px; font-size: 10.5px; color: #555; }
  @media print {
    .no-print { display:none; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { max-width: none; margin: 0; }
    section { page-break-inside: avoid; }
    .q { page-break-inside: avoid; break-inside: avoid; }
    .sechead { page-break-after: avoid; }
    .insthead { page-break-after: avoid; }
    .titleblock { page-break-after: avoid; }
    .instructions { page-break-after: avoid; }
  }
</style>
</head>
<body>
<div class="page">
  <div class="insthead">
    ${paper.institution.logoUrl ? `<img class="logo" src="${esc(paper.institution.logoUrl)}" alt="">` : ''}
    <div class="inst">
      <h1>${esc(paper.institution.name)}</h1>
      <div class="addr">${[paper.institution.address, paper.institution.city, paper.institution.state].filter(Boolean).join(', ')}</div>
    </div>
  </div>
  ${header}
  <div class="titleblock">
    <h2>${esc(paper.examName)}</h2>
    <div class="meta"><span>${esc(paper.subject.name)}${paper.subject.code ? ` (${esc(paper.subject.code)})` : ''}</span><span>Class ${esc(paper.grade)}</span></div>
    <div class="meta" style="margin-top:4px;"><span>Time: ${paper.durationMinutes} minutes</span><span>Total Marks: ${paper.totalMarks}</span></div>
    <div class="least" style="margin-top:3px;">${esc(formatDate(paper.date))}</div>
  </div>
  ${paper.instructions ? `<div class="instructions"><h4>General Instructions</h4><p>${esc(paper.instructions)}</p></div>` : ''}
  ${sectionHTML}
  <printfoot>*** End of Paper ***</printfoot>
</div>
</body>
</html>`;
}