import { normalizeMarkdown } from './markdown-normalize';

describe('normalizeMarkdown', () => {
  it('leaves plain GitHub-flavoured markdown intact', () => {
    const input = '## Steps\n\n**Bold** and *italic* and `code`\n\n- one\n- two';
    expect(normalizeMarkdown(input)).toBe(input);
  });

  it('converts raw HTML tags the model emits into markdown', () => {
    expect(normalizeMarkdown('<b>Bold</b> and <i>italic</i>')).toBe('**Bold** and *italic*');
    expect(normalizeMarkdown('line one<br>line two')).toBe('line one  \nline two');
    expect(normalizeMarkdown('<ul><li>one</li><li>two</li></ul>')).toContain('- one');
    expect(normalizeMarkdown('<h2>Heading</h2>')).toContain('## Heading');
    expect(normalizeMarkdown('<p>Para</p>')).toContain('Para');
  });

  it('decodes HTML entities', () => {
    expect(normalizeMarkdown('Salt &amp; pepper&nbsp;here')).toBe('Salt & pepper here');
    expect(normalizeMarkdown('&lt;tag&gt;')).toBe('<tag>');
  });

  it('breaks a heading that is glued to the paragraph above it', () => {
    expect(normalizeMarkdown('Intro\n## Steps')).toBe('Intro\n\n## Steps');
  });

  it('converts LaTeX maths into readable text instead of raw TeX', () => {
    expect(normalizeMarkdown('Area is \\(a^2\\)')).toBe('Area is a²');
    expect(normalizeMarkdown('$$x = 2$$')).toBe('x = 2');
    expect(normalizeMarkdown('$x^2 - 5x + 6 = 0$')).toBe('x² - 5x + 6 = 0');
    expect(normalizeMarkdown('$2x + 3y = 12$')).toBe('2x + 3y = 12');
    expect(normalizeMarkdown('$$\\frac{10}{5} = 2$$')).toBe('10/5 = 2');
    expect(normalizeMarkdown('$$\\frac{x+1}{2} = y$$')).toBe('(x+1)/2 = y');
    expect(normalizeMarkdown('$$a \\times b = c$$')).toBe('a × b = c');
    expect(normalizeMarkdown('\\(\\sqrt{2}\\)')).toBe('√2');
    expect(normalizeMarkdown('$$\\angle A = 90^{\\circ}$$')).toBe('∠ A = 90°');
    expect(normalizeMarkdown('$$y = \\text{m}x$$')).toBe('y = mx');
    expect(normalizeMarkdown('$$x \\le 5 \\implies y \\ge 2$$')).toBe('x ≤ 5 ⇒ y ≥ 2');
  });

  it('strips delimiters even when the maths has no command', () => {
    expect(normalizeMarkdown('x \\implies y')).toBe('x ⇒ y');
    expect(normalizeMarkdown('\\frac{3}{4} of it')).toBe('3/4 of it');
  });

  it('keeps currency dollars and bare angle brackets', () => {
    expect(normalizeMarkdown('It costs $5 and $10.')).toBe('It costs $5 and $10.');
    expect(normalizeMarkdown('if x < 5 and y > 2')).toBe('if x < 5 and y > 2');
  });

  it('keeps autolink angle brackets', () => {
    expect(normalizeMarkdown('See <https://example.com>')).toBe('See <https://example.com>');
  });

  it('collapses runs of blank lines and normalises CRLF', () => {
    expect(normalizeMarkdown('a\r\n\r\n\r\n\r\nb')).toBe('a\n\nb');
  });

  it('drops a stray unclosed tag name without eating prose', () => {
    expect(normalizeMarkdown('a < b')).toBe('a < b');
  });

  it('drops an unmatched emphasis marker from a truncated reply', () => {
    expect(normalizeMarkdown('Stop (**S')).toBe('Stop (S');
    expect(normalizeMarkdown('**Bold** stays bold')).toBe('**Bold** stays bold');
    expect(normalizeMarkdown('```js\nconst a = 1;\n```')).toContain('```js');
  });

  it('keeps a single newline as a line break in a worked solution', () => {
    expect(normalizeMarkdown('Step 1: x = 2\nStep 2: y = 3')).toBe('Step 1: x = 2  \nStep 2: y = 3');
    expect(normalizeMarkdown('Intro\n\n- one\n- two')).toBe('Intro\n\n- one\n- two');
    expect(normalizeMarkdown('```js\nconst a = 1;\nconst b = 2;\n```')).toBe('```js\nconst a = 1;\nconst b = 2;\n```');
  });

  it('balances emphasis per line so one stray opener cannot leak', () => {
    expect(normalizeMarkdown('12. **5 (x² + 1)')).toBe('12. 5 (x² + 1)');
    expect(normalizeMarkdown('1. **one**\n2. **two')).toBe('1. **one**\n2. two');
  });
});

