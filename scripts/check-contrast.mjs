#!/usr/bin/env node
// Contrast gate: rates every foreground/background token pair declared in
// scripts/contrast-pairs.json against the :root values in
// src/styles/brand-tokens.css, using WCAG 2.1 relative luminance.
//
// Exit 0: every pair meets its threshold (a table of readings is printed).
// Exit 1: at least one pair is below its threshold (each one is named).
// Exit 2: the inputs cannot be rated (missing token, unreadable value, bad JSON).
//
// It rates token definitions only. It cannot see colours written inline in
// JSX, translucent layers composited at render time, or a dark theme block.

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TOKENS_FILE = 'src/styles/brand-tokens.css';
const PAIRS_FILE = 'scripts/contrast-pairs.json';
const THRESHOLDS = { text: 4.5, large: 3, ui: 3 };

class InputError extends Error {}

function readRootTokens(css) {
  const tokens = new Map();
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const rule of withoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (rule[1].trim() !== ':root') continue;
    for (const declaration of rule[2].split(';')) {
      const match = declaration.match(/^\s*(--[\w-]+)\s*:\s*([\s\S]+?)\s*$/);
      if (match) tokens.set(match[1], match[2].replace(/\s+/g, ' '));
    }
  }
  return tokens;
}

function hslToRgb(h, s, l) {
  const hue = ((h % 360) + 360) % 360;
  const sat = s / 100;
  const light = l / 100;
  const a = sat * Math.min(light, 1 - light);
  const channel = (n) => {
    const k = (n + hue / 30) % 12;
    return light - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  // Browsers resolve colours to 8-bit sRGB; rate what is actually painted.
  return [channel(0), channel(8), channel(4)].map((v) => Math.round(v * 255));
}

function parseColour(value) {
  const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const digits = hex[1].length === 3 ? [...hex[1]].map((d) => d + d).join('') : hex[1];
    return [0, 2, 4].map((i) => parseInt(digits.slice(i, i + 2), 16));
  }
  const hsl = value.match(/^(-?\d*\.?\d+)(?:deg)?\s+(\d*\.?\d+)%\s+(\d*\.?\d+)%$/);
  if (hsl) return hslToRgb(Number(hsl[1]), Number(hsl[2]), Number(hsl[3]));
  return null;
}

// Follows var() aliases to a colour. Returns { rgb, chain }.
function resolveToken(tokens, name, seen = []) {
  if (seen.includes(name)) throw new InputError(`${[...seen, name].join(' -> ')}: var() cycle`);
  const value = tokens.get(name);
  if (value === undefined) {
    const path = seen.length ? `${seen.join(' -> ')} -> ${name}` : name;
    throw new InputError(`${path}: not defined in the :root block of ${TOKENS_FILE}`);
  }
  const alias = value.match(/^var\(\s*(--[\w-]+)\s*\)$/);
  if (alias) return resolveToken(tokens, alias[1], [...seen, name]);
  const rgb = parseColour(value);
  if (!rgb) {
    throw new InputError(
      `${name}: "${value}" is not a #hex or "h s% l%" colour (translucent values cannot be rated without a backdrop)`,
    );
  }
  return { rgb, chain: [...seen, name] };
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

const toHex = (rgb) => `#${rgb.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
// Truncate, never round up: 4.497 must not print as 4.50 next to a failure.
const formatRatio = (r) => `${(Math.floor(r * 100) / 100).toFixed(2)}:1`;
const describe = ({ chain, rgb }) => `${chain.join(' -> ')} = ${toHex(rgb)}`;

function loadPairs() {
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(resolve(ROOT, PAIRS_FILE), 'utf8'));
  } catch (error) {
    throw new InputError(`${PAIRS_FILE}: ${error.message}`);
  }
  if (!Array.isArray(parsed.pairs) || parsed.pairs.length === 0) {
    throw new InputError(`${PAIRS_FILE}: "pairs" must be a non-empty array`);
  }
  parsed.pairs.forEach((pair, index) => {
    if (typeof pair.fg !== 'string' || typeof pair.bg !== 'string' || !(pair.kind in THRESHOLDS)) {
      throw new InputError(
        `${PAIRS_FILE}: pairs[${index}] needs string "fg", "bg" and "kind" one of ${Object.keys(THRESHOLDS).join('/')}`,
      );
    }
  });
  return parsed.pairs;
}

function main() {
  const tokens = readRootTokens(readFileSync(resolve(ROOT, TOKENS_FILE), 'utf8'));
  const rows = loadPairs().map((pair) => {
    const fg = resolveToken(tokens, pair.fg);
    const bg = resolveToken(tokens, pair.bg);
    const ratio = contrastRatio(fg.rgb, bg.rgb);
    const required = THRESHOLDS[pair.kind];
    return { ...pair, fgColour: fg, bgColour: bg, ratio, required, ok: ratio >= required };
  });

  const table = [
    ['foreground', 'background', 'fg', 'bg', 'ratio', 'need', 'kind', 'result'],
    ...rows.map((r) => [
      r.fg,
      r.bg,
      toHex(r.fgColour.rgb),
      toHex(r.bgColour.rgb),
      formatRatio(r.ratio),
      `${r.required}:1`,
      r.kind,
      r.ok ? 'ok' : 'FAIL',
    ]),
  ];
  const widths = table[0].map((_, col) => Math.max(...table.map((row) => row[col].length)));
  console.log(`Contrast gate (WCAG 2.1): ${TOKENS_FILE} x ${PAIRS_FILE}`);
  for (const row of table) console.log(row.map((cell, col) => cell.padEnd(widths[col])).join('  ').trimEnd());

  const failures = rows.filter((r) => !r.ok);
  if (failures.length === 0) {
    console.log(`${rows.length} pairs, all meet their threshold.`);
    return 0;
  }
  console.log('');
  for (const r of failures) {
    console.log(`FAIL ${r.fg} / ${r.bg} ${formatRatio(r.ratio)} required ${r.required}:1 (${r.kind})`);
    console.log(`     fg: ${describe(r.fgColour)}`);
    console.log(`     bg: ${describe(r.bgColour)}`);
  }
  console.log(`${failures.length} of ${rows.length} pairs below threshold.`);
  return 1;
}

try {
  process.exitCode = main();
} catch (error) {
  if (!(error instanceof InputError)) throw error;
  console.error(`check-contrast: ${error.message}`);
  process.exitCode = 2;
}
