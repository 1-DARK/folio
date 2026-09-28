import type { JSONContent } from "@tiptap/react";

// A tiny DSL for writing showcase documents in TypeScript instead of raw
// TipTap JSON. Every helper returns plain JSONContent in exactly the shape
// the page editor stores, so a showcase can later be copied into a real page.

export type Inline = string | JSONContent;
type Mark = NonNullable<JSONContent["marks"]>[number];

const toInline = (x: Inline): JSONContent =>
  typeof x === "string" ? { type: "text", text: x } : x;

const inlines = (xs: Inline[]): JSONContent[] =>
  xs.filter((x) => x !== "").map(toInline);

const marked = (text: string, ...marks: Mark[]): JSONContent => ({
  type: "text",
  text,
  marks,
});

// ── Marks ────────────────────────────────────────────────────────────────
export const b = (text: string) => marked(text, { type: "bold" });
export const i = (text: string) => marked(text, { type: "italic" });
export const u = (text: string) => marked(text, { type: "underline" });
export const s = (text: string) => marked(text, { type: "strike" });
export const code = (text: string) => marked(text, { type: "code" });
export const link = (text: string, href: string) =>
  marked(text, { type: "link", attrs: { href, target: "_blank" } });

export type HighlightColor =
  | "yellow"
  | "green"
  | "blue"
  | "purple"
  | "red"
  | "orange"
  | "gray";

export const hl = (text: string, color: HighlightColor = "yellow") =>
  marked(text, {
    type: "highlight",
    attrs: { color: `var(--tt-color-highlight-${color})` },
  });

/** Inline equation (LaTeX). */
export const m = (latex: string): JSONContent => ({
  type: "mathInline",
  attrs: { latex },
});

// ── Blocks ───────────────────────────────────────────────────────────────
export const doc = (...content: JSONContent[]): JSONContent => ({
  type: "doc",
  content,
});

export const title = (text: string): JSONContent => ({
  type: "title",
  content: [{ type: "text", text }],
});

export const h1 = (text: string): JSONContent => ({
  type: "heading",
  attrs: { level: 1 },
  content: [{ type: "text", text }],
});
export const h2 = (text: string): JSONContent => ({
  type: "heading",
  attrs: { level: 2 },
  content: [{ type: "text", text }],
});
export const h3 = (text: string): JSONContent => ({
  type: "heading",
  attrs: { level: 3 },
  content: [{ type: "text", text }],
});

export const p = (...content: Inline[]): JSONContent => {
  const c = inlines(content);
  return c.length ? { type: "paragraph", content: c } : { type: "paragraph" };
};

/** Empty line. */
export const br = (): JSONContent => ({ type: "paragraph" });

const item = (x: Inline | Inline[] | JSONContent[]): JSONContent => {
  const parts = Array.isArray(x) ? x : [x];
  // A list item whose parts are already blocks (e.g. a nested list).
  const isBlocks = parts.every(
    (y) => typeof y !== "string" && y.type !== "text" && y.type !== "mathInline",
  );
  return {
    type: "listItem",
    content: isBlocks ? (parts as JSONContent[]) : [p(...(parts as Inline[]))],
  };
};

export const ul = (...items: (Inline | Inline[])[]): JSONContent => ({
  type: "bulletList",
  content: items.map(item),
});

export const ol = (...items: (Inline | Inline[])[]): JSONContent => ({
  type: "orderedList",
  content: items.map(item),
});

/** Checklist: [done, text] pairs. */
export const todo = (...items: [boolean, ...Inline[]][]): JSONContent => ({
  type: "taskList",
  content: items.map(([checked, ...text]) => ({
    type: "taskItem",
    attrs: { checked },
    content: [p(...text)],
  })),
});

export const quote = (...content: JSONContent[]): JSONContent => ({
  type: "blockquote",
  content,
});

export const hr = (): JSONContent => ({ type: "horizontalRule" });

export const callout = (
  icon: string,
  content: JSONContent[],
  backgroundColor: HighlightColor = "gray",
): JSONContent => ({
  type: "callout",
  attrs: {
    iconName: icon,
    target: "Emoji",
    backgroundColor: `var(--tt-color-highlight-${backgroundColor})`,
  },
  content,
});

export const codeBlock = (language: string, text: string): JSONContent => ({
  type: "codeBlock",
  attrs: { language },
  content: text ? [{ type: "text", text }] : [],
});

/** Display equation (LaTeX). */
export const mathBlock = (latex: string): JSONContent => ({
  type: "mathBlock",
  attrs: { latex },
});

/** Side-by-side columns; widths default to an even split. */
export const columns = (...cols: JSONContent[][]): JSONContent => ({
  type: "columnBlock",
  content: cols.map((content) => ({
    type: "column",
    attrs: { width: `${100 / cols.length}%` },
    content: content.length ? content : [br()],
  })),
});

/** Table; the first row is the header row. */
export const table = (...rows: Inline[][]): JSONContent => ({
  type: "tableWrapper",
  content: [
    {
      type: "table",
      content: rows.map((row, r) => ({
        type: "tableRow",
        content: row.map((cell) => ({
          type: r === 0 ? "tableHeader" : "tableCell",
          content: [p(cell)],
        })),
      })),
    },
  ],
});

export const tabs = (
  ...items: { label: string; content: JSONContent[] }[]
): JSONContent => ({
  type: "tabs",
  attrs: { activeTab: "tab-0" },
  content: items.map((t, n) => ({
    type: "tab",
    attrs: { tabId: `tab-${n}`, label: t.label },
    content: t.content,
  })),
});

export const codeGroup = (
  ...items: { language: string; code: string }[]
): JSONContent => ({
  type: "codeGroup",
  content: items.map((it) => ({
    type: "codeGroupItem",
    attrs: { language: it.language },
    content: [codeBlock(it.language, it.code)],
  })),
});

/** Collapsible toggle block. */
export const toggle = (summary: string, content: JSONContent[]): JSONContent => ({
  type: "appendix",
  content: [
    { type: "appendixSummary", content: [{ type: "text", text: summary }] },
    { type: "appendixContent", content },
  ],
});
