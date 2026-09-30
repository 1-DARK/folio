// The languages the code block offers: the id lowlight knows (registered in
// code-block-node.ts), the name people see, and other words that find it.

export interface CodeLanguage {
  id: string;
  label: string;
  aliases?: string[];
}

export const CODE_LANGUAGES: CodeLanguage[] = [
  { id: "plaintext", label: "Plain text", aliases: ["text", "txt", "none"] },
  { id: "bash", label: "Bash", aliases: ["shell", "sh", "zsh", "terminal"] },
  { id: "c", label: "C", aliases: ["h"] },
  { id: "cpp", label: "C++", aliases: ["c++", "cc", "hpp"] },
  { id: "css", label: "CSS" },
  { id: "go", label: "Go", aliases: ["golang"] },
  { id: "html", label: "HTML", aliases: ["htm"] },
  { id: "java", label: "Java" },
  { id: "javascript", label: "JavaScript", aliases: ["js", "node"] },
  { id: "json", label: "JSON" },
  { id: "jsx", label: "JSX", aliases: ["react"] },
  { id: "markdown", label: "Markdown", aliases: ["md"] },
  { id: "python", label: "Python", aliases: ["py"] },
  { id: "rust", label: "Rust", aliases: ["rs"] },
  { id: "scss", label: "SCSS", aliases: ["sass"] },
  { id: "sql", label: "SQL", aliases: ["postgres", "mysql", "sqlite"] },
  { id: "tsx", label: "TSX" },
  { id: "typescript", label: "TypeScript", aliases: ["ts"] },
  { id: "xml", label: "XML", aliases: ["svg"] },
  { id: "yaml", label: "YAML", aliases: ["yml"] },
];

export function languageLabel(id: string | null | undefined): string {
  return CODE_LANGUAGES.find((l) => l.id === id)?.label ?? id ?? "Plain text";
}

/** Languages matching a search, best matches (name starts with it) first. */
export function searchLanguages(query: string): CodeLanguage[] {
  const q = query.trim().toLowerCase();
  if (!q) return CODE_LANGUAGES;
  const words = (l: CodeLanguage) => [
    l.label.toLowerCase(),
    l.id,
    ...(l.aliases ?? []),
  ];
  const starts = CODE_LANGUAGES.filter((l) =>
    words(l).some((w) => w.startsWith(q)),
  );
  const contains = CODE_LANGUAGES.filter(
    (l) => !starts.includes(l) && words(l).some((w) => w.includes(q)),
  );
  return [...starts, ...contains];
}
