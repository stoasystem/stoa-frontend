// The contrast gate's second half: a token it rates may be defined in the
// token file and nowhere else. scripts/check-contrast.mjs runs this over every
// source it names; tests/component/contrastGuard.test.ts poisons each form.
//
// A rated token defined anywhere else -- legacy-bridge.css loading later, a
// page's own CSS, an inline style on the entry HTML or in JSX -- would win on
// screen while the gate went on rating the token file's value.

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Blank out a comment, keeping its newlines so line numbers stay right.
const blank = (text) => text.replace(/[^\n]/g, ' ');

// JS/TS comments, skipping what is inside quotes and template literals so a
// URL's `//` in a string is not taken for one. Regular expression literals
// are not recognised; a quote inside one can only make this strip less.
function stripScriptComments(source) {
  let out = '';
  let quote = null;
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    const next = source[i + 1];
    if (quote) {
      out += ch;
      if (ch === '\\') {
        out += next ?? '';
        i += 1;
      } else if (ch === quote || (ch === '\n' && quote !== '`')) {
        quote = null;
      }
      continue;
    }
    if (ch === '/' && next === '/') {
      const end = source.indexOf('\n', i);
      const stop = end === -1 ? source.length : end;
      out += blank(source.slice(i, stop));
      i = stop - 1;
      continue;
    }
    if (ch === '/' && next === '*') {
      const end = source.indexOf('*/', i + 2);
      const stop = end === -1 ? source.length : end + 2;
      out += blank(source.slice(i, stop));
      i = stop - 1;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') quote = ch;
    out += ch;
  }
  return out;
}

export function stripComments(source, extension) {
  const cssComments = (text) => text.replace(/\/\*[\s\S]*?\*\//g, blank);
  if (extension === '.css') return cssComments(source);
  if (extension === '.html') return cssComments(source.replace(/<!--[\s\S]*?-->/g, blank));
  return stripScriptComments(source);
}

/**
 * Where `source` defines one of `tokens`. Recognised, in every file type:
 *   a declaration `--x:` after start of line, whitespace, `;`, `{` or a quote
 *     (CSS, a `style="..."` attribute, a style or cssText string, a template);
 *   a Tailwind arbitrary property `[--x:`;
 *   an object key `'--x':` or a computed one `['--x' as string]:`;
 *   `setProperty('--x', ...)`.
 * Reading a token (`var(--x)`, `getPropertyValue('--x')`) is not a definition.
 */
export function findForeignDefinitions(source, extension, tokens) {
  const text = stripComments(source, extension);
  const found = [];
  for (const token of tokens) {
    const name = escapeRegExp(token);
    const patterns = [
      new RegExp(`(^|[\\s;{"'\`])${name}\\s*:`, 'm'),
      new RegExp(`\\[${name}\\s*:`),
      new RegExp(`['"\`]${name}['"\`]\\s*:`),
      new RegExp(`\\[\\s*['"\`]${name}['"\`][^\\]\\n]*\\]\\s*:`),
      new RegExp(`setProperty\\(\\s*['"\`]${name}['"\`]`),
    ];
    const indexes = patterns.map((pattern) => text.search(pattern)).filter((index) => index !== -1);
    if (indexes.length) {
      const index = Math.min(...indexes);
      found.push({ token, line: text.slice(0, index).split('\n').length });
    }
  }
  return found;
}
