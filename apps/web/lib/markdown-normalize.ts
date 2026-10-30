/**
 * Normalises model output before it reaches the Markdown renderer.
 *
 * LLM replies are not always clean GitHub-flavoured Markdown: Gemini often
 * emits raw HTML (`<br>`, `<b>`, `<ul><li>`), escaped entities (`&amp;`),
 * Windows newlines, and LaTeX delimiters (`\(x^2\)`, `$$...$$`). Without this
 * pass those tokens are shown to the student as literal text, which is what
 * "the formatting is not visible" looks like.
 *
 * Only known HTML tags are rewritten - a bare `<` in prose ("if x < 5") is left
 * alone, because a blanket `/<[^>]+>/` would eat the text between two angles.
 */
const INLINE_TAGS: Array<[RegExp, string]> = [
  [/<\s*(b|strong)\s*>/gi, '**'],
  [/<\s*\/\s*(b|strong)\s*>/gi, '**'],
  [/<\s*(i|em)\s*>/gi, '*'],
  [/<\s*\/\s*(i|em)\s*>/gi, '*'],
  [/<\s*(s|del|strike)\s*>/gi, '~~'],
  [/<\s*\/\s*(s|del|strike)\s*>/gi, '~~'],
  [/<\s*code\s*>/gi, '`'],
  [/<\s*\/\s*code\s*>/gi, '`'],
  [/<\s*br\s*\/?>/gi, '\n'],
  [/<\s*\/\s*p\s*>/gi, '\n\n'],
  [/<\s*p(\s[^<>]*)?>/gi, ''],
  [/<\s*li(\s[^<>]*)?>/gi, '\n- '],
  [/<\s*\/\s*li\s*>/gi, ''],
  [/<\s*(ul|ol)(\s[^<>]*)?>/gi, '\n'],
  [/<\s*\/\s*(ul|ol)\s*>/gi, '\n'],
  [/<\s*h([1-6])(\s[^<>]*)?>/gi, '\n$1 '],
  [/<\s*\/\s*h[1-6]\s*>/gi, '\n'],
  [/<\s*\/?\s*(div|section|article|table|thead|tbody|tr|td|th|blockquote|pre)(\s[^<>]*)?>/gi, '\n'],
  [/<\s*\/?\s*(span|font|center|small|big|u|sup|sub)(\s[^<>]*)?>/gi, ''],
];

const ENTITIES: Array<[RegExp, string]> = [
  [/&nbsp;/gi, ' '],
  [/&amp;/gi, '&'],
  [/&lt;/gi, '<'],
  [/&gt;/gi, '>'],
  [/&quot;/gi, '"'],
  [/&#0*39;/gi, "'"],
  [/&apos;/gi, "'"],
  [/&#x27;/gi, "'"],
  [/&mdash;/gi, '—'],
  [/&ndash;/gi, '–'],
  [/&hellip;/gi, '…'],
];

/**
 * LaTeX the model still emits for maths, converted to text a student can read.
 *
 * The previous pass wrapped `\(x^2\)` and `$$...$$` in backticks, which put raw
 * TeX (`\frac{10}{5}`, `\times`, `\implies`) in a monospace chip: an equation
 * looked like a code leak, not a worked solution. Neither client renders TeX, so
 * the delimiters are dropped and the common commands become Unicode.
 */
const SUPERSCRIPT: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', 'n': 'ⁿ', 'i': 'ⁱ', 'a': 'ᵃ', 'b': 'ᵇ', 'c': 'ᶜ', 'd': 'ᵈ', 'e': 'ᵉ', 'k': 'ᵏ',
  'm': 'ᵐ', 'o': 'ᵒ', 'p': 'ᵖ', 'r': 'ʳ', 's': 'ˢ', 't': 'ᵗ', 'u': 'ᵘ', 'v': 'ᵛ', 'w': 'ʷ', 'x': 'ˣ',
  'y': 'ʸ', '(': '⁽', ')': '⁾',
};

const SUBSCRIPT: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  '+': '₊', '-': '₋', 'n': 'ₙ', 'i': 'ᵢ', 'a': 'ₐ', 'e': 'ₑ', 'o': 'ₒ', 'x': 'ₓ', '(': '₍', ')': '₎',
};

const TEX_SYMBOLS: Record<string, string> = {
  times: '×', div: '÷', cdot: '·', pm: '±', mp: '∓',
  le: '≤', leq: '≤', ge: '≥', geq: '≥', ne: '≠', neq: '≠', approx: '≈', equiv: '≡', lt: '<', gt: '>',
  Rightarrow: '⇒', implies: '⇒', Longrightarrow: '⇒', Leftarrow: '⇐', Leftrightarrow: '⇔', iff: '⇔',
  to: '→', rightarrow: '→', mapsto: '↦', therefore: '∴', because: '∵',
  infty: '∞', sum: '∑', prod: '∏', int: '∫', partial: '∂', nabla: '∇',
  angle: '∠', triangle: '△', perp: '⊥', parallel: '∥', circ: '°', degree: '°',
  ldots: '…', dots: '…', cdots: '⋯',
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', varepsilon: 'ε', zeta: 'ζ', eta: 'η',
  theta: 'θ', vartheta: 'ϑ', iota: 'ι', kappa: 'κ', lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', pi: 'π',
  rho: 'ρ', sigma: 'σ', tau: 'τ', upsilon: 'υ', phi: 'φ', varphi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω',
  Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ', Xi: 'Ξ', Pi: 'Π', Sigma: 'Σ', Phi: 'Φ', Psi: 'Ψ',
  Omega: 'Ω',
};

/** `x+1` needs brackets inside a fraction or a root; `10` does not. */
function wrapMath(part: string): string {
  const trimmed = part.trim();
  if (!trimmed) return '';
  if (/^\(.*\)$/.test(trimmed)) return trimmed;
  return /[+\-−×÷*/=\s]/.test(trimmed) ? `(${trimmed})` : trimmed;
}

function toScript(body: string, map: Record<string, string>): string {
  const trimmed = body.trim();
  if (!trimmed) return '';
  const chars = [...trimmed];
  return chars.every((char) => map[char]) ? chars.map((char) => map[char]).join('') : body;
}

function mathToText(source: string): string {
  let text = source;

  text = text.replace(
    /\\(?:d|t)?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g,
    (_m, a: string, b: string) => `${wrapMath(a)}/${wrapMath(b)}`,
  );
  text = text.replace(/\\sqrt\s*\[([^\]]*)\]\s*\{([^{}]*)\}/g, (_m, n: string, x: string) => `${n}√${wrapMath(x)}`);
  text = text.replace(/\\sqrt\s*\{([^{}]*)\}/g, (_m, x: string) => `√${wrapMath(x)}`);
  text = text.replace(/\\(?:text|textrm|textbf|textit|mathrm|mathbf|mathit|operatorname|mbox)\s*\{([^{}]*)\}/g, '$1');

  text = text.replace(/\^\{([^{}]*)\}/g, (_m, body: string) => toScript(body, SUPERSCRIPT));
  text = text.replace(/\^(\w)/g, (_m, char: string) => toScript(char, SUPERSCRIPT));
  text = text.replace(/_\{([^{}]*)\}/g, (_m, body: string) => toScript(body, SUBSCRIPT));
  text = text.replace(/_(\w)/g, (_m, char: string) => toScript(char, SUBSCRIPT));

  // `\\` is a row break inside aligned/cases blocks; the row spacing commands and
  // the grouping-size prefixes carry no meaning in plain text.
  text = text.replace(/\\\\/g, '\n');
  text = text.replace(/\\(?:quad|qquad|,|;|:|!|\s)/g, ' ');
  text = text.replace(/\\(?:left|right|big|Big|bigg|Bigg)\s*/g, '');
  text = text.replace(/\\(?:begin|end)\s*\{[^{}]*\}/g, '');
  text = text.replace(/\\([%$&_#{}])/g, '$1');

  // Remaining commands: known symbols become Unicode, unknown ones lose the
  // backslash (`\sin` reads as `sin`, which is what the student needs to see).
  text = text.replace(/\\([a-zA-Z]+)/g, (match, name: string) => TEX_SYMBOLS[name] ?? name);

  text = text.replace(/[{}]/g, '');
  return text.replace(/[ \t]{2,}/g, ' ').replace(/[ \t]+$/gm, '').trim();
}

export function normalizeMarkdown(input: string): string {
  let text = input.replace(/\r\n?/g, '\n').replace(/\u00a0/g, ' ');

  for (const [pattern, replacement] of INLINE_TAGS) {
    text = text.replace(pattern, (_match, level: string | undefined) =>
      replacement.includes('$1') ? replacement.replace('$1', '#'.repeat(Number(level ?? 1))) : replacement,
    );
  }

  // Any remaining known tag (e.g. <table class="x">) is dropped rather than shown.
  text = text.replace(/<\/?[a-z][a-z0-9]*(\s[^<>]*)?\/?>/gi, '');

  // Entities are decoded after tags are stripped, so "&lt;tag&gt;" stays the
  // literal text the model meant instead of being deleted as a tag.
  for (const [pattern, replacement] of ENTITIES) text = text.replace(pattern, replacement);

  // LaTeX → readable maths. Block equations become their own paragraph (a
  // display equation), inline maths stays inline. A `$...$` that carries no
  // maths token is left alone so a price ("$5") is never mangled.
  text = text
    .replace(/\\\[([\s\S]*?)\\\]/g, (_m, body: string) => `\n\n${mathToText(body)}\n\n`)
    .replace(/\$\$([\s\S]*?)\$\$/g, (_m, body: string) => `\n\n${mathToText(body)}\n\n`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_m, body: string) => mathToText(body))
    .replace(/\$([^$\n]+)\$/g, (match, body: string) =>
      /[\\^_=]/.test(body) ? mathToText(body) : match,
    );

  // A model slip: TeX with no delimiter at all. Only engage when a known maths
  // command is present, so ordinary prose (and a price) is never altered.
  if (/\\(?:frac|dfrac|sqrt|times|div|cdot|pm|leq|geq|neq|approx|Rightarrow|implies|theta|pi|angle|circ|text)\b/.test(text)) {
    text = mathToText(text);
  }

  // A heading glued to the paragraph above it never parses ("text\n# Head" needs
  // a blank line), so give every ATX heading its own block.
  text = text.replace(/([^\n])\n(#{1,6}\s)/g, '$1\n\n$2');

  // Three or more blank lines collapse to one blank line.
  text = text.replace(/\n{3,}/g, '\n\n').replace(/[ \t]+$/gm, '');

  return balanceDelimiters(hardenLineBreaks(text).trim());
}

/**
 * A single newline is a line break in a chat reply, not a soft wrap.
 *
 * Markdown joins "Step 1: a = 1\nStep 2: b = 2" into one paragraph, so a worked
 * solution arrived as a wall of text ("x - 2 = 0 ⇒ x = 2 x - 3 = 0 ⇒ x = 3").
 * Two trailing spaces make it a hard break; blocks (headings, lists, tables,
 * quotes, fences) already break on their own and are left alone.
 */
function hardenLineBreaks(text: string): string {
  const lines = text.split('\n');
  const out: string[] = [];
  let inFence = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      out.push(line);
      continue;
    }
    if (inFence) {
      out.push(line);
      continue;
    }
    const next = lines[index + 1];
    const nextStartsBlock =
      next === undefined || !next.trim() || /^\s*(#{1,6}\s|[-*+]\s|\d+[.)]\s|>|\||```)/.test(next);
    if (!nextStartsBlock && line.trim() && !/[ \t]$/.test(line)) {
      out.push(`${line}  `);
    } else {
      out.push(line);
    }
  }

  return out.join('\n');
}

/**
 * A streamed or token-limited reply can end mid-bold (`Stop (**S`), which the
 * renderer then prints literally. Dropping the unmatched opener keeps the text
 * readable instead of leaking `**` into the bubble.
 */
function balanceDelimiters(text: string): string {
  let out = text;

  if ((out.match(/```/g) ?? []).length % 2 === 1) {
    const last = out.lastIndexOf('```');
    out = out.slice(0, last) + out.slice(last + 3);
  }

  // Emphasis is balanced per line: a reply that bolds each answer ("12. **5")
  // can leave one opener, and a document-wide pass removed the wrong end of the
  // pair (the last token in the reply), which is how `**5` reached the screen.
  const hasFence = out.includes('```');
  out = out
    .split('\n')
    .map((line) => balanceLine(line, hasFence))
    .join('\n');

  return out;
}

function balanceLine(line: string, hasFence: boolean): string {
  let out = line;
  for (const token of ['**', '__', '~~', '`']) {
    if (token === '`' && hasFence) continue;
    if ((out.split(token).length - 1) % 2 === 1) {
      const last = out.lastIndexOf(token);
      out = out.slice(0, last) + out.slice(last + token.length);
    }
  }
  return out;
}
