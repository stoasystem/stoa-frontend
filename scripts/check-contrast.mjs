#!/usr/bin/env node
// Contrast gate: rates every foreground/background token pair declared in
// scripts/contrast-pairs.json against the token file that file names, using
// WCAG 2.1 relative luminance.
//
// Exit 0: every gated pair meets its threshold (a table of readings is printed).
// Exit 1: a gated pair is below its threshold, or a "gate": false pair now
//         meets it (each one is named).
// Exit 2: the inputs cannot be rated, or the theme mapping cannot be trusted
//         (missing token, unreadable value, bad JSON, nested rule, a block the
//         pairs use that no theme reads, two themes on the same blocks, a
//         theme with no gated pair).
//
// The token source is data, not code: "tokens.file" and "tokens.themes" in the
// pairs file say which CSS file and which of its blocks each theme reads, so
// moving the tokens (ticket #18) is an edit to the pairs file only.
//
// It rates token definitions only. It cannot see colours written inline in
// JSX, or layers composited at render time other than a declared "over".

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PAIRS_FILE = 'scripts/contrast-pairs.json';
const THRESHOLDS = { text: 4.5, large: 3, ui: 3 };

class InputError extends Error {}

// Returns Map<blockPath, Map<token, value>>. A block's path is its selector,
// prefixed by the at-rules it sits in: ":root", "@media (...) :root". A rule
// nested inside a style rule (CSS nesting) is refused rather than guessed at:
// its parent's declarations would otherwise be read without it or not at all.
function readBlocks(css) {
  const blocks = new Map();
  const source = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const stack = [];
  let start = 0;
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === '{') {
      const prelude = source.slice(start, i).split(';').pop().trim().replace(/\s+/g, ' ');
      const parent = stack.at(-1);
      if (parent && !parent.prelude.startsWith('@')) {
        throw new InputError(`"${prelude}" is nested inside "${parent.prelude}"; the gate reads flat rules and at-rules only`);
      }
      stack.push({ prelude, body: i + 1 });
      start = i + 1;
    } else if (ch === '}') {
      const block = stack.pop();
      if (!block) throw new InputError('unbalanced "}" in the token file');
      const body = source.slice(block.body, i);
      if (!body.includes('{')) {
        const path = [...stack.map((b) => b.prelude), block.prelude].join(' ');
        const tokens = blocks.get(path) ?? new Map();
        for (const declaration of body.split(';')) {
          const match = declaration.match(/^\s*(--[\w-]+)\s*:\s*([\s\S]+?)\s*$/);
          if (match) tokens.set(match[1], match[2].replace(/\s+/g, ' '));
        }
        blocks.set(path, tokens);
      }
      start = i + 1;
    }
  }
  if (stack.length) throw new InputError('unclosed "{" in the token file');
  return blocks;
}

function hslToRgb(h, s, l) {
  const hue = ((h % 360) + 360) % 360;
  const sat = s / 100;
  const light = l / 100;
  const a = sat * Math.min(light, 1 - light);
  const channel = (n) => {
    const k = (n + hue / 30) % 12;
    return (light - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255;
  };
  return [channel(0), channel(8), channel(4)];
}

// Alpha outside 0-1 is refused: a browser would clamp it, and a token that
// relies on that is more likely a typo than a colour.
const alphaOf = (raw) => {
  if (raw === undefined) return 1;
  const alpha = raw.endsWith('%') ? Number(raw.slice(0, -1)) / 100 : Number(raw);
  return alpha >= 0 && alpha <= 1 ? alpha : NaN;
};

// Returns { rgb: [r, g, b] in 0-255, alpha: 0-1 } or null. Accepts #hex (3, 4,
// 6, 8 digits), rgb()/rgba(), hsl()/hsla() and the bare "h s% l% [/ a]"
// triplet that the current brand-tokens.css uses.
function parseColour(value) {
  const hex = value.match(/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (hex) {
    const digits = hex[1].length <= 4 ? [...hex[1]].map((d) => d + d).join('') : hex[1];
    const bytes = digits.match(/../g).map((pair) => parseInt(pair, 16));
    return { rgb: bytes.slice(0, 3), alpha: bytes.length === 4 ? bytes[3] / 255 : 1 };
  }
  const num = String.raw`(-?\d*\.?\d+)`;
  const sep = String.raw`\s*[,\s]\s*`;
  const alpha = String.raw`(?:\s*[,/]\s*(\d*\.?\d+%?))?`;
  const rgb = value.match(new RegExp(String.raw`^rgba?\(\s*${num}${sep}${num}${sep}${num}${alpha}\s*\)$`, 'i'));
  if (rgb) return { rgb: rgb.slice(1, 4).map(Number), alpha: alphaOf(rgb[4]) };
  const hslBody = String.raw`${num}(?:deg)?${sep}${num}%${sep}${num}%${alpha}`;
  const hsl = value.match(new RegExp(String.raw`^(?:hsla?\(\s*${hslBody}\s*\)|${hslBody})$`, 'i'));
  if (hsl) {
    // The function form fills groups 1-4, the bare triplet groups 5-8.
    const [h, s, l, a] = hsl[1] !== undefined ? hsl.slice(1, 5) : hsl.slice(5, 9);
    return { rgb: hslToRgb(Number(h), Number(s), Number(l)), alpha: alphaOf(a) };
  }
  return null;
}

// Paints colour `top` onto opaque `under`, then rounds to the 8-bit sRGB that a
// browser puts on screen.
function paint(top, under) {
  const blended = top.rgb.map((c, i) => c * top.alpha + (under ? under[i] : 0) * (1 - top.alpha));
  return blended.map((c) => Math.min(255, Math.max(0, Math.round(c))));
}

// Follows var() aliases to a colour. Returns { colour, chain }.
function resolveToken(theme, name, seen = []) {
  if (seen.includes(name)) throw new InputError(`${theme.name}: ${[...seen, name].join(' -> ')}: var() cycle`);
  const value = theme.tokens.get(name);
  if (value === undefined) {
    const path = seen.length ? `${seen.join(' -> ')} -> ${name}` : name;
    throw new InputError(`${theme.name}: ${path}: not defined in ${theme.where}`);
  }
  const alias = value.match(/^var\(\s*(--[\w-]+)\s*\)$/);
  if (alias) return resolveToken(theme, alias[1], [...seen, name]);
  const colour = parseColour(value);
  if (!colour) throw new InputError(`${theme.name}: ${name}: "${value}" is not a colour the gate can read`);
  if (Number.isNaN(colour.alpha)) throw new InputError(`${theme.name}: ${name}: "${value}" has an alpha outside 0-1`);
  if (!colour.rgb.every((c) => c >= 0 && c <= 255)) {
    throw new InputError(`${theme.name}: ${name}: "${value}" has a channel outside 0-255`);
  }
  return { colour, chain: [...seen, name] };
}

function relativeLuminance([r, g, b]) {
  const linear = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

function contrastRatio(a, b) {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const toHex = (rgb) => `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
// Truncate, never round up: 4.497 must not print as 4.50 next to a failure.
const formatRatio = (r) => `${(Math.floor(r * 100) / 100).toFixed(2)}:1`;
const describe = ({ chain, colour }, painted) =>
  `${chain.join(' -> ')} = ${colour.alpha < 1 ? `${toHex(colour.rgb)} at ${colour.alpha}, painted ${toHex(painted)}` : toHex(painted)}`;

function loadConfig() {
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(resolve(ROOT, PAIRS_FILE), 'utf8'));
  } catch (error) {
    throw new InputError(`${PAIRS_FILE}: ${error.message}`);
  }
  const { tokens, pairs } = parsed;
  const themesOk = typeof tokens?.themes === 'object' && tokens.themes !== null && !Array.isArray(tokens.themes);
  if (typeof tokens?.file !== 'string' || !themesOk) {
    throw new InputError(`${PAIRS_FILE}: "tokens" needs a string "file" and a "themes" object`);
  }
  const themeNames = Object.keys(tokens.themes);
  if (themeNames.length === 0) throw new InputError(`${PAIRS_FILE}: tokens.themes names no theme`);
  for (const [name, paths] of Object.entries(tokens.themes)) {
    if (!Array.isArray(paths) || paths.length === 0 || !paths.every((p) => typeof p === 'string')) {
      throw new InputError(`${PAIRS_FILE}: tokens.themes.${name} must be a non-empty array of block paths`);
    }
  }
  // Two themes reading the same blocks would rate one set of values twice and
  // call it both themes.
  const blockSet = (name) => JSON.stringify([...new Set(tokens.themes[name])].sort());
  themeNames.forEach((a, index) => {
    for (const b of themeNames.slice(index + 1)) {
      if (blockSet(a) === blockSet(b)) {
        throw new InputError(`${PAIRS_FILE}: tokens.themes.${a} and .${b} read the same blocks; each theme needs its own`);
      }
    }
  });
  if (!Array.isArray(pairs) || pairs.length === 0) {
    throw new InputError(`${PAIRS_FILE}: "pairs" must be a non-empty array`);
  }
  pairs.forEach((pair, index) => {
    const where = `${PAIRS_FILE}: pairs[${index}]`;
    if (typeof pair?.fg !== 'string' || typeof pair.bg !== 'string' || !Object.hasOwn(THRESHOLDS, pair.kind)) {
      throw new InputError(`${where} needs string "fg", "bg" and "kind" one of ${Object.keys(THRESHOLDS).join('/')}`);
    }
    if (!Object.hasOwn(tokens.themes, pair.theme)) {
      throw new InputError(`${where}: "theme" must be one of ${themeNames.join('/')}`);
    }
    if (pair.over !== undefined && typeof pair.over !== 'string') throw new InputError(`${where}: "over" must be a token name`);
    if (pair.gate !== undefined && typeof pair.gate !== 'boolean') throw new InputError(`${where}: "gate" must be true or false`);
    // An exemption names the issue that will settle it, so it has an owner.
    if (pair.gate === false && (typeof pair.why !== 'string' || !/#\d+/.test(pair.why))) {
      throw new InputError(`${where}: "gate": false needs a "why" that cites an issue (#<number>)`);
    }
  });
  // "gate": false must not be a way to switch a theme off.
  for (const name of themeNames) {
    if (!pairs.some((pair) => pair.theme === name && pair.gate !== false)) {
      throw new InputError(`${PAIRS_FILE}: theme "${name}" has no gated pair`);
    }
  }
  return { tokens, pairs };
}

function loadThemes(tokens) {
  let css;
  try {
    css = readFileSync(resolve(ROOT, tokens.file), 'utf8');
  } catch (error) {
    throw new InputError(`${tokens.file}: ${error.message}`);
  }
  const blocks = readBlocks(css);
  const themes = new Map();
  for (const [name, paths] of Object.entries(tokens.themes)) {
    const merged = new Map();
    for (const path of paths) {
      const block = blocks.get(path);
      if (!block) throw new InputError(`tokens.themes.${name}: no "${path}" block in ${tokens.file}`);
      for (const [token, value] of block) merged.set(token, value);
    }
    themes.set(name, { name, tokens: merged, where: `${paths.join(' + ')} of ${tokens.file}` });
  }
  return { themes, blocks };
}

// A block that no theme reads but that defines a token the pairs use means the
// theme mapping is wrong: the gate would rate some other value for that token,
// or none, and pass. Refuse instead.
function checkUnreadBlocks(tokens, blocks, used) {
  const read = new Set(Object.values(tokens.themes).flat());
  for (const [path, block] of blocks) {
    if (read.has(path)) continue;
    const hit = [...block.keys()].filter((token) => used.has(token));
    if (hit.length) {
      throw new InputError(
        `"${path}" in ${tokens.file} defines ${hit.join(', ')}, which the pairs use, but no entry of tokens.themes reads it`,
      );
    }
  }
}

function ratePair(themes, pair) {
  const theme = themes.get(pair.theme);
  const fg = resolveToken(theme, pair.fg);
  const bg = resolveToken(theme, pair.bg);
  const over = pair.over === undefined ? null : resolveToken(theme, pair.over);
  if (over && over.colour.alpha < 1) throw new InputError(`${pair.theme}: "over" ${pair.over} must be opaque`);
  if (bg.colour.alpha < 1 && !over) {
    throw new InputError(`${pair.theme}: ${pair.bg} is translucent; the pair needs "over", the token it sits on`);
  }
  const bgPainted = paint(bg.colour, over?.colour.rgb);
  const fgPainted = paint(fg.colour, bgPainted);
  const ratio = contrastRatio(fgPainted, bgPainted);
  const required = THRESHOLDS[pair.kind];
  const gated = pair.gate !== false;
  const chains = [fg, bg, over].filter(Boolean).flatMap((r) => r.chain);
  return { ...pair, fgRes: fg, bgRes: bg, fgPainted, bgPainted, ratio, required, gated, ok: ratio >= required, chains };
}

function main() {
  const { tokens, pairs } = loadConfig();
  const { themes, blocks } = loadThemes(tokens);
  checkUnreadBlocks(tokens, blocks, new Set(pairs.flatMap((p) => [p.fg, p.bg, p.over].filter(Boolean))));
  const rows = pairs.map((pair) => ratePair(themes, pair));
  // Again with every token the var() chains passed through.
  checkUnreadBlocks(tokens, blocks, new Set(rows.flatMap((r) => r.chains)));

  const result = (r) => {
    if (r.gated) return r.ok ? 'ok' : 'FAIL';
    return r.ok ? 'STALE (not gated, passes)' : 'below (not gated)';
  };
  const table = [
    ['theme', 'foreground', 'background', 'fg', 'bg', 'ratio', 'need', 'kind', 'result', 'use'],
    ...rows.map((r) => [
      r.theme,
      r.fg,
      r.over ? `${r.bg} over ${r.over}` : r.bg,
      toHex(r.fgPainted),
      toHex(r.bgPainted),
      formatRatio(r.ratio),
      `${r.required}:1`,
      r.kind,
      result(r),
      r.use ?? '',
    ]),
  ];
  const widths = table[0].map((_, col) => Math.max(...table.map((row) => row[col].length)));
  console.log(`Contrast gate (WCAG 2.1): ${tokens.file} x ${PAIRS_FILE}`);
  for (const row of table) console.log(row.map((cell, col) => cell.padEnd(widths[col])).join('  ').trimEnd());

  const gated = rows.filter((r) => r.gated);
  const exempt = rows.filter((r) => !r.gated && !r.ok);
  const stale = rows.filter((r) => !r.gated && r.ok);
  const failures = gated.filter((r) => !r.ok);
  const perTheme = [...themes.keys()]
    .map((name) => `${name} ${gated.filter((r) => r.theme === name).length}`)
    .join(', ');

  if (exempt.length) {
    console.log('');
    console.log(`Not gated (${exempt.length}), below threshold until the cited issue settles them:`);
    for (const r of exempt) console.log(`  ${r.theme} ${r.fg} / ${r.bg} ${formatRatio(r.ratio)} (${r.kind}): ${r.why}`);
  }

  console.log('');
  if (failures.length === 0 && stale.length === 0) {
    console.log(`${gated.length} gated pairs (${perTheme}), all meet their threshold.`);
    return 0;
  }
  for (const r of failures) {
    console.log(`FAIL ${r.theme} ${r.fg} / ${r.bg} ${formatRatio(r.ratio)} required ${r.required}:1 (${r.kind})`);
    console.log(`     fg: ${describe(r.fgRes, r.fgPainted)}`);
    console.log(`     bg: ${describe(r.bgRes, r.bgPainted)}${r.over ? ` over ${r.over}` : ''}`);
  }
  // An exemption that no longer fails would sit there hiding the next regression.
  for (const r of stale) {
    console.log(`STALE ${r.theme} ${r.fg} / ${r.bg} ${formatRatio(r.ratio)} meets ${r.required}:1 (${r.kind}); remove its "gate": false`);
  }
  const parts = [];
  if (failures.length) parts.push(`${failures.length} of ${gated.length} gated pairs below threshold`);
  if (stale.length) parts.push(`${stale.length} exemption(s) no longer needed`);
  console.log(`${parts.join('; ')}.`);
  return 1;
}

try {
  process.exitCode = main();
} catch (error) {
  if (!(error instanceof InputError)) throw error;
  console.error(`check-contrast: ${error.message}`);
  process.exitCode = 2;
}
