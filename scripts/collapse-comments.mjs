#!/usr/bin/env node
// One-shot script: collapse /** ... */ multi-line comments into single-line //.
// Run with: node scripts/collapse-comments.mjs <file> [<file>...]

import { readFileSync, writeFileSync } from 'node:fs';

const files = process.argv.slice(2);
if (!files.length) {
  console.error('usage: collapse-comments.mjs <file> [<file>...]');
  process.exit(1);
}

let changed = 0;
for (const file of files) {
  const before = readFileSync(file, 'utf8');
  const after = before.replace(
    /^([ \t]*)\/\*\*?([\s\S]*?)\*\/\s*\n/gm,
    (match, indent, body) => {
      const text = body
        .split('\n')
        .map((line) => line.replace(/^\s*\*\s?/, '').trim())
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (!text) return '';
      return `${indent}// ${text}\n`;
    },
  );
  if (before !== after) {
    writeFileSync(file, after);
    changed++;
    console.log(`rewrote ${file}`);
  }
}
console.log(`\n${changed} file(s) changed.`);
