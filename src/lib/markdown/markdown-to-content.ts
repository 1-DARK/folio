import { marked, type Token, type Tokens } from "marked";
import type { JSONContent } from "@tiptap/core";
import type { Schema } from "@tiptap/pm/model";

// Markdown → editor blocks, for pasting Markdown into a page.
//
// Uses marked's lexer for the syntax, then builds the editor's own JSON:
// headings, paragraphs, bold / italic / strike / code / links, bullet,
// numbered and to-do lists (nested), quotes, code blocks with their
// language, tables (first row = header), images, rules, and $…$ / $$…$$
// math. A block type the editor doesn't have degrades to the closest one
// it does (a to-do list becomes a bullet list, a table becomes paragraphs).

type Mark = NonNullable<JSONContent["marks"]>[number];

const decode = (s: string) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");

class Builder {
  private schema: Schema;
  constructor(schema: Schema) {
    this.schema = schema;
  }

  has(name: string) {
    return !!this.schema.nodes[name];
  }
  hasMark(name: string) {
    return !!this.schema.marks[name];
  }

  // ── Inline ──────────────────────────────────────────────────────────────
  inline(tokens: Token[] | undefined, marks: Mark[] = []): JSONContent[] {
    const out: JSONContent[] = [];
    for (const tok of tokens ?? []) {
      switch (tok.type) {
        case "text":
        case "escape": {
          const t = tok as Tokens.Text;
          if (t.tokens?.length) out.push(...this.inline(t.tokens, marks));
          else out.push(...this.textWithMath(decode(t.text), marks));
          break;
        }
        case "strong":
          out.push(...this.withMark(tok, marks, "bold"));
          break;
        case "em":
          out.push(...this.withMark(tok, marks, "italic"));
          break;
        case "del":
          out.push(...this.withMark(tok, marks, "strike"));
          break;
        case "codespan":
          out.push(
            this.text(
              decode((tok as Tokens.Codespan).text),
              this.hasMark("code") ? [...marks, { type: "code" }] : marks,
            ),
          );
          break;
        case "link": {
          const l = tok as Tokens.Link;
          const linkMarks = this.hasMark("link")
            ? [...marks, { type: "link", attrs: { href: l.href } }]
            : marks;
          out.push(...this.inline(l.tokens, linkMarks));
          break;
        }
        case "image": {
          // Inline images can't sit in a paragraph here: keep the alt text;
          // block-level images are handled in `blocks`.
          const img = tok as Tokens.Image;
          out.push(this.text(img.text || img.href, marks));
          break;
        }
        case "br":
          if (this.has("hardBreak")) out.push({ type: "hardBreak" });
          else out.push(this.text("\n", marks));
          break;
        case "html":
          out.push(this.text((tok as Tokens.HTML).text, marks));
          break;
        default:
          if ("text" in tok && typeof tok.text === "string")
            out.push(this.text(decode(tok.text), marks));
      }
    }
    return out.filter((n) => n.type !== "text" || n.text);
  }

  private withMark(tok: Token, marks: Mark[], name: string) {
    const t = tok as Tokens.Strong;
    return this.inline(
      t.tokens,
      this.hasMark(name) ? [...marks, { type: name }] : marks,
    );
  }

  private text(text: string, marks: Mark[]): JSONContent {
    return marks.length
      ? { type: "text", text, marks }
      : { type: "text", text };
  }

  // "a $x^2$ b" → text, inline math, text.
  private textWithMath(text: string, marks: Mark[]): JSONContent[] {
    if (!this.has("mathInline") || !text.includes("$")) {
      return [this.text(text, marks)];
    }
    const out: JSONContent[] = [];
    const re = /\$([^$\n]+?)\$/g;
    let last = 0;
    for (let m = re.exec(text); m; m = re.exec(text)) {
      if (m.index > last) out.push(this.text(text.slice(last, m.index), marks));
      out.push({ type: "mathInline", attrs: { latex: m[1].trim() } });
      last = m.index + m[0].length;
    }
    if (last < text.length) out.push(this.text(text.slice(last), marks));
    return out;
  }

  // ── Blocks ──────────────────────────────────────────────────────────────
  paragraph(content: JSONContent[]): JSONContent {
    return content.length
      ? { type: "paragraph", content }
      : { type: "paragraph" };
  }

  blocks(tokens: Token[]): JSONContent[] {
    const out: JSONContent[] = [];
    for (const tok of tokens) out.push(...this.block(tok));
    return out;
  }

  block(tok: Token): JSONContent[] {
    switch (tok.type) {
      case "space":
        return [];
      case "heading": {
        const h = tok as Tokens.Heading;
        const content = this.inline(h.tokens);
        if (!this.has("heading")) return [this.paragraph(content)];
        return [
          {
            type: "heading",
            attrs: { level: Math.min(6, Math.max(1, h.depth)) },
            ...(content.length ? { content } : {}),
          },
        ];
      }
      case "paragraph": {
        const p = tok as Tokens.Paragraph;
        // $$ … $$ alone in a paragraph: a math block.
        const math = /^\$\$\s*([\s\S]+?)\s*\$\$$/.exec(p.text.trim());
        if (math && this.has("mathBlock")) {
          return [{ type: "mathBlock", attrs: { latex: math[1] } }];
        }
        // An image alone on its line: an image block.
        const only = p.tokens?.filter(
          (t) => !(t.type === "text" && !(t as Tokens.Text).text.trim()),
        );
        if (
          only?.length === 1 &&
          only[0].type === "image" &&
          this.has("image")
        ) {
          const img = only[0] as Tokens.Image;
          return [{ type: "image", attrs: { src: img.href, alt: img.text } }];
        }
        return [this.paragraph(this.inline(p.tokens))];
      }
      case "text": {
        // Loose text at block level (inside list items).
        const t = tok as Tokens.Text;
        return [this.paragraph(this.inline(t.tokens ?? [t]))];
      }
      case "blockquote": {
        const inner = this.blocks((tok as Tokens.Blockquote).tokens);
        if (!this.has("blockquote")) return inner;
        return [
          {
            type: "blockquote",
            content: inner.length ? inner : [this.paragraph([])],
          },
        ];
      }
      case "code": {
        const c = tok as Tokens.Code;
        if (!this.has("codeBlock"))
          return [this.paragraph([this.text(c.text, [])])];
        return [
          {
            type: "codeBlock",
            attrs: { language: c.lang?.trim().split(/\s+/)[0] || null },
            ...(c.text ? { content: [{ type: "text", text: c.text }] } : {}),
          },
        ];
      }
      case "hr":
        return this.has("horizontalRule") ? [{ type: "horizontalRule" }] : [];
      case "list":
        return [this.list(tok as Tokens.List)];
      case "table":
        return this.table(tok as Tokens.Table);
      case "html": {
        const text = (tok as Tokens.HTML).text.trim();
        return text ? [this.paragraph([this.text(text, [])])] : [];
      }
      default:
        if ("text" in tok && typeof tok.text === "string" && tok.text.trim())
          return [this.paragraph([this.text(tok.text, [])])];
        return [];
    }
  }

  list(list: Tokens.List): JSONContent {
    const isTask =
      list.items.some((i) => i.task) &&
      this.has("taskList") &&
      this.has("taskItem");
    const listType = isTask
      ? "taskList"
      : list.ordered && this.has("orderedList")
        ? "orderedList"
        : "bulletList";
    const itemType = isTask ? "taskItem" : "listItem";

    const items = list.items.map((item) => {
      const tokens = item.tokens.filter((t) => t.type !== "checkbox");
      let content = this.blocks(tokens);
      // A list item starts with a paragraph.
      if (content[0]?.type !== "paragraph") {
        content = [this.paragraph([]), ...content];
      }
      return {
        type: itemType,
        ...(isTask ? { attrs: { checked: !!item.checked } } : {}),
        content,
      };
    });

    const start = Number(list.start);
    return {
      type: listType,
      ...(listType === "orderedList" && start > 1 ? { attrs: { start } } : {}),
      content: items,
    };
  }

  table(t: Tokens.Table): JSONContent[] {
    const cell = (type: string, c: Tokens.TableCell): JSONContent => ({
      type,
      content: [this.paragraph(this.inline(c.tokens))],
    });
    if (!this.has("table") || !this.has("tableRow") || !this.has("tableCell")) {
      // No tables: one paragraph per row, cells separated by " | ".
      return [t.header, ...t.rows].map((row) =>
        this.paragraph([
          this.text(row.map((c) => decode(c.text)).join(" | "), []),
        ]),
      );
    }
    const headerType = this.has("tableHeader") ? "tableHeader" : "tableCell";
    const table: JSONContent = {
      type: "table",
      content: [
        { type: "tableRow", content: t.header.map((c) => cell(headerType, c)) },
        ...t.rows.map((row) => ({
          type: "tableRow",
          content: row.map((c) => cell("tableCell", c)),
        })),
      ],
    };
    // The page editor wraps tables (scroll + handles).
    return [
      this.has("tableWrapper")
        ? { type: "tableWrapper", content: [table] }
        : table,
    ];
  }
}

/** Markdown → a list of blocks for `insertContent`. */
export function markdownToContent(
  markdown: string,
  schema: Schema,
): JSONContent[] {
  const tokens = marked.lexer(markdown.replace(/\r\n?/g, "\n"), { gfm: true });
  return new Builder(schema).blocks(tokens);
}

// Lines that only Markdown would write. Two kinds of hint, or one strong
// one, before treating pasted text as Markdown — plain prose stays prose.
const STRONG = [
  /^#{1,6}\s+\S/m, // # Heading
  /^```/m, // code fence
  /^\s*[-*+]\s+\[[ xX]\]\s+/m, // - [ ] task
  /^\|.+\|\s*\n\|?\s*:?-{3,}/m, // table header + separator
];
const WEAK = [
  /^\s*[-*+]\s+\S/m, // - item
  /^\s*\d+[.)]\s+\S/m, // 1. item
  /^>\s?\S/m, // > quote
  /\*\*[^*\n]+\*\*/, // **bold**
  /\[[^\]\n]+\]\(\S+\)/, // [text](url)
  /^(-{3,}|\*{3,})\s*$/m, // ---
  /`[^`\n]+`/, // `code`
  /\$\$[\s\S]+?\$\$/, // $$ math $$
];

/** Whether pasted plain text looks like Markdown worth converting. */
export function looksLikeMarkdown(text: string): boolean {
  if (!text.includes("\n") && !STRONG.some((re) => re.test(text))) {
    // One line: only a heading or fence counts (a lone **bold** stays text).
    return false;
  }
  if (STRONG.some((re) => re.test(text))) return true;
  // Two list lines or more: a list.
  const listLines = text
    .split("\n")
    .filter((l) => /^\s*([-*+]|\d+[.)])\s+\S/.test(l)).length;
  if (listLines >= 2) return true;
  return WEAK.filter((re) => re.test(text)).length >= 2;
}
