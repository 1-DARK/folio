import { getSchema, type JSONContent } from "@tiptap/core";
import type { NodeType, Schema } from "@tiptap/pm/model";
import { SHOWCASE_EXTENSIONS } from "src/features/showcase/showcase-extensions";

// A published page is shown with the read-only showcase renderer, which has
// the page editor's nodes minus the ones that need a signed-in user
// (databases, comments, uploads, page links…). This turns a page's saved
// content into a document that renderer accepts:
//   • page links become a plain line — a link when the target is a visible
//     published page, its title otherwise;
//   • other unknown inline nodes become their label text;
//   • unknown blocks keep their children when they have any, else become a
//     short "not available" line;
//   • unknown marks (comments, suggestions) are dropped.

let schemaCache: Schema | null = null;
export function publishedSchema(): Schema {
  if (!schemaCache) schemaCache = getSchema(SHOWCASE_EXTENSIONS);
  return schemaCache;
}

export interface PublishedContentOptions {
  /** The address of a page when it's visible to visitors, else null. */
  linkFor: (pageId: string) => string | null;
  /** Text for blocks visitors can't see (a database, a file…). */
  unavailableText: string;
  /** Used when nothing else works. */
  fallbackTitle: string;
}

type Ctx = PublishedContentOptions & { schema: Schema };

const textOf = (node: JSONContent): string => {
  if (node.type === "text") return node.text ?? "";
  return (node.content ?? []).map(textOf).join("");
};

function labelOf(node: JSONContent): string {
  const a = (node.attrs ?? {}) as Record<string, unknown>;
  for (const key of ["label", "title", "text", "name"]) {
    const v = a[key];
    if (typeof v === "string" && v.trim()) return v;
  }
  return textOf(node);
}

function cleanMarks(
  marks: JSONContent["marks"],
  schema: Schema,
): JSONContent["marks"] {
  const kept = (marks ?? []).filter((m) => !!schema.marks[m.type]);
  return kept.length ? kept : undefined;
}

function textNode(
  text: string,
  ctx: Ctx,
  href?: string | null,
): JSONContent | null {
  if (!text) return null;
  const node: JSONContent = { type: "text", text };
  if (href && ctx.schema.marks.link) {
    node.marks = [{ type: "link", attrs: { href, target: null } }];
  }
  return node;
}

function paragraph(children: (JSONContent | null)[]): JSONContent {
  const content = children.filter((c): c is JSONContent => !!c);
  return content.length
    ? { type: "paragraph", content }
    : { type: "paragraph" };
}

function isInlineJson(node: JSONContent, schema: Schema): boolean {
  if (node.type === "text") return true;
  const t = node.type ? schema.nodes[node.type] : undefined;
  return !!t?.isInline;
}

function clean(node: JSONContent, parent: NodeType, ctx: Ctx): JSONContent[] {
  const { schema } = ctx;
  const inline = parent.inlineContent;

  if (node.type === "text") {
    if (!node.text) return [];
    return [{ ...node, marks: cleanMarks(node.marks, schema) }];
  }

  const type = node.type ? schema.nodes[node.type] : undefined;
  if (type) {
    const children = (node.content ?? []).flatMap((c) => clean(c, type, ctx));
    const out: JSONContent = { ...node, marks: cleanMarks(node.marks, schema) };
    if (children.length) out.content = children;
    else delete out.content;
    return [out];
  }

  // ── Not available to visitors ──
  const attrs = (node.attrs ?? {}) as Record<string, unknown>;

  if (node.type === "pageLink" && typeof attrs.pageId === "string") {
    const title = labelOf(node) || ctx.fallbackTitle;
    const text = textNode(title, ctx, ctx.linkFor(attrs.pageId));
    if (!text) return [];
    return inline ? [text] : [paragraph([text])];
  }

  if (inline) {
    const label = labelOf(node);
    const text = textNode(label, ctx);
    return text ? [text] : [];
  }

  // A block: keep what's inside it, if anything.
  const inner = (node.content ?? []).flatMap((c) => clean(c, parent, ctx));
  if (inner.length) {
    // Inline leftovers can't sit directly in a block container.
    if (inner.every((c) => !isInlineJson(c, schema))) return inner;
    const blocks: JSONContent[] = [];
    let run: JSONContent[] = [];
    const flush = () => {
      if (run.length) blocks.push(paragraph(run));
      run = [];
    };
    for (const c of inner) {
      if (isInlineJson(c, schema)) run.push(c);
      else {
        flush();
        blocks.push(c);
      }
    }
    flush();
    return blocks;
  }

  const placeholder = textNode(ctx.unavailableText, ctx);
  if (placeholder) placeholder.marks = [{ type: "italic" }];
  return [paragraph([placeholder])];
}

/** The page's saved content, ready for the read-only renderer. */
export function toPublishedDoc(
  content: JSONContent | null | undefined,
  options: PublishedContentOptions,
): JSONContent {
  const schema = publishedSchema();
  const ctx: Ctx = { ...options, schema };
  const fallback: JSONContent = {
    type: "doc",
    content: [
      {
        type: "title",
        content: [{ type: "text", text: options.fallbackTitle }],
      },
      { type: "paragraph" },
    ],
  };
  if (!content || content.type !== "doc") return fallback;

  const docType = schema.topNodeType;
  const doc: JSONContent = {
    type: "doc",
    content: (content.content ?? []).flatMap((c) => clean(c, docType, ctx)),
  };
  try {
    schema.nodeFromJSON(doc).check();
    return doc;
  } catch {
    // A structure the schema still rejects (e.g. a block where only list
    // items may go): show the text rather than nothing.
    const blocks = doc.content ?? [];
    const hasTitle = blocks[0]?.type === "title";
    const title = hasTitle ? textOf(blocks[0]) : "";
    return {
      type: "doc",
      content: [
        {
          type: "title",
          content: [{ type: "text", text: title || options.fallbackTitle }],
        },
        ...blocks
          .slice(hasTitle ? 1 : 0)
          .map(textOf)
          .filter(Boolean)
          .map((line) => paragraph([textNode(line, ctx)])),
      ],
    };
  }
}
