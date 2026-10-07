// Checks the translation files before a merge:
//   • no key appears twice in the same object (JSON.parse would silently keep
//     only the last one, so a duplicate can hide or overwrite a translation);
//   • every key in English exists in French, and the other way round.
// Usage: node scripts/check-i18n.mjs   (exit code 1 when something is wrong)

import { readFileSync } from "node:fs";

const LOCALES = ["en", "fr"];
const fileFor = (lng) => `src/i18n/locales/${lng}/common.json`;

// A small JSON reader that remembers every key, so duplicates can be found.
// Returns a flat list of leaf paths ("toolbar.bold") and any duplicates.
function readKeys(text, file) {
  let i = 0;
  const leaves = new Set();
  const duplicates = [];

  const line = () => text.slice(0, i).split("\n").length;
  const fail = (msg) => {
    throw new Error(`${file}:${line()}: ${msg}`);
  };
  const ws = () => {
    while (/\s/.test(text[i] ?? "")) i++;
  };
  const str = () => {
    if (text[i] !== '"') fail("expected a string");
    const start = i++;
    while (text[i] !== '"') {
      if (i >= text.length) fail("unterminated string");
      if (text[i] === "\\") i++;
      i++;
    }
    i++;
    return JSON.parse(text.slice(start, i));
  };
  const value = (path) => {
    ws();
    const c = text[i];
    if (c === "{") return object(path);
    if (c === "[") return array(path);
    if (c === '"') {
      str();
    } else {
      const m = /^(true|false|null|-?\d+(\.\d+)?([eE][+-]?\d+)?)/.exec(text.slice(i));
      if (!m) fail("unexpected value");
      i += m[0].length;
    }
    if (path) leaves.add(path);
  };
  const array = (path) => {
    i++;
    ws();
    let n = 0;
    if (text[i] === "]") return void i++;
    for (;;) {
      value(`${path}[${n++}]`);
      ws();
      if (text[i] === ",") i++;
      else if (text[i] === "]") return void i++;
      else fail("expected , or ]");
    }
  };
  const object = (path) => {
    i++;
    const seen = new Set();
    ws();
    if (text[i] === "}") return void i++;
    for (;;) {
      ws();
      const at = line();
      const key = str();
      const full = path ? `${path}.${key}` : key;
      if (seen.has(key)) duplicates.push(`${full} (line ${at})`);
      seen.add(key);
      ws();
      if (text[i] !== ":") fail("expected :");
      i++;
      value(full);
      ws();
      if (text[i] === ",") i++;
      else if (text[i] === "}") return void i++;
      else fail("expected , or }");
    }
  };

  value("");
  ws();
  if (i < text.length) fail("unexpected content after the end");
  return { leaves, duplicates };
}

let problems = 0;
const keys = {};

for (const lng of LOCALES) {
  const file = fileFor(lng);
  try {
    const { leaves, duplicates } = readKeys(readFileSync(file, "utf8"), file);
    keys[lng] = leaves;
    for (const d of duplicates) {
      console.error(`✖ ${file}: duplicate key ${d}`);
      problems++;
    }
  } catch (e) {
    console.error(`✖ ${e.message}`);
    problems++;
  }
}

// Plural forms differ between languages, so compare keys without the suffix.
const base = (k) => k.replace(/_(zero|one|two|few|many|other)$/, "");
if (keys.en && keys.fr) {
  for (const [a, b] of [
    ["en", "fr"],
    ["fr", "en"],
  ]) {
    const other = new Set([...keys[b]].map(base));
    const missing = [...new Set([...keys[a]].map(base))].filter((k) => !other.has(k));
    for (const k of missing) {
      console.error(`✖ "${k}" is in ${a} but missing from ${b}`);
      problems++;
    }
  }
}

if (problems) {
  console.error(`\n${problems} translation problem(s).`);
  process.exit(1);
}
console.log("✔ Translations OK (no duplicates, en and fr match).");
