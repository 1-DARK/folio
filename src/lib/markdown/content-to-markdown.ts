import type { JSONContent } from "@tiptap/core";

// Editor JSON → Markdown, for "Export → Markdown".
//
// Standard blocks map to GitHub-flavoured Markdown. Folio's own blocks
// keep their content in the closest plain form: a callout becomes a quote
// with its icon, a toggle a bold summary with its content, columns and
// tabs their contents in order, math $…$ / $$…$$, embeds and files links.
// Blocks with nothing to say in text (table of contents, breadcrumb,
// database views) are left out.

type Node = JSONContent;

const esc = (s: string) => s.replace(/([\\`*_[\]<>])/g, "\\$1");

function inline(nodes: Node[] | undefined): string {
  let out = "";
  for (const n of nodes ?? []) out += inlineNode(n);
  return out;
}

function inlineNode(n: Node): string {
  switch (n.type) {
    case "text": {
      let text = n.text ?? "";
      const marks = n.marks ?? [];
      const has = (t: string) => marks.some((m) => m.type === t);
      if (has("code")) {
        const ticks = text.includes("`") ? "``" : "`";
        text = `${ticks}${text}${ticks}`;
      } else {
        text = esc(text);
        if (has("bold")) text = `**${text}**`;
        if (has("italic")) text = `_${text}_`;
        if (has("strike")) text = `~~${text}~~`;
      }
      const link = marks.find((m) => m.type === "link");
      if (link?.attrs?.href) text = `[${text}](${link.attrs.href})`;
      return text;
    }
    case "hardBreak":
      return "  \n";
    case "mathInline":
      return `$${n.attrs?.latex ?? ""}$`;
    case "mention": {
      const date = n.attrs?.date as string | null | undefined;
      if (date) {
        const d = new Date(date);
        return Number.isNaN(d.getTime())
          ? `@${n.attrs?.label ?? ""}`
          : `@${d.toISOString().slice(0, 10)}`;
      }
      return `@${n.attrs?.label ?? n.attrs?.id ?? ""}`;
    }
    case "emoji":
      return `:${n.attrs?.name ?? ""}:`;
    case "image":
      return `![${n.attrs?.alt ?? ""}](${n.attrs?.src ?? ""})`;
    default:
      return inline(n.content);
  }
}

const indent = (text: string, prefix: string) =>
  text
    .split("\n")
    .map((line, i) => (i === 0 ? line : line ? prefix + line : line))
    .join("\n");

const quote = (text: string) =>
  text
    .split("\n")
    .map((l) => (l ? `> ${l}` : ">"))
    .join("\n");

function list(n: Node, ordered: boolean, task: boolean): string {
  const start = Number(n.attrs?.start ?? 1) || 1;
  return (n.content ?? [])
    .map((item, i) => {
      const marker = task
        ? `- [${item.attrs?.checked ? "x" : " "}] `
        : ordered
          ? `${start + i}. `
          : "- ";
      const body = (item.content ?? [])
        .map((child) => block(child))
        .filter(Boolean)
        .join("\n");
      return marker + indent(body, " ".repeat(marker.length));
    })
    .join("\n");
}

function table(n: Node): string {
  const rows = (n.content ?? []).map((row) =>
    (row.content ?? []).map((cell) =>
      (cell.content ?? [])
        .map((c) => inline(c.content))
        .join(" ")
        .replace(/\|/g, "\\|")
        .replace(/\n/g, " "),
    ),
  );
  if (!rows.length) return "";
  const width = Math.max(...rows.map((r) => r.length));
  const pad = (r: string[]) => [...r, ...Array(width - r.length).fill("")];
  const line = (r: string[]) => `| ${pad(r).join(" | ")} |`;
  return [
    line(rows[0]),
    `| ${Array(width).fill("---").join(" | ")} |`,
    ...rows.slice(1).map(line),
  ].join("\n");
}

function blocks(nodes: Node[] | undefined): string {
  return (nodes ?? [])
    .map((n) => block(n))
    .filter((s) => s !== "")
    .join("\n\n");
}

function block(n: Node): string {
  const a = n.attrs ?? {};
  switch (n.type) {
    case "title":
      return `# ${inline(n.content)}`;
    case "heading":
      return `${"#".repeat(Number(a.level) || 1)} ${inline(n.content)}`;
    case "paragraph":
      return inline(n.content);
    case "bulletList":
      return list(n, false, false);
    case "orderedList":
      return list(n, true, false);
    case "taskList":
      return list(n, false, true);
    case "blockquote":
      return quote(blocks(n.content));
    case "codeBlock":
      return (
        "```" +
        (a.language ?? "") +
        "\n" +
        (n.content ?? []).map((c) => c.text ?? "").join("") +
        "\n```"
      );
    case "horizontalRule":
      return "---";
    case "image":
      return (
        `![${a.alt ?? ""}](${a.src ?? ""})` +
        (a.caption ? `\n_${esc(String(a.caption))}_` : "")
      );
    case "mathBlock":
      return `$$\n${a.latex ?? ""}\n$$`;
    case "tableWrapper":
      return blocks(n.content);
    case "table":
      return table(n);
    case "callout": {
      const icon = a.target === "Emoji" && a.iconName ? `${a.iconName} ` : "";
      return quote(icon + blocks(n.content));
    }
    case "appendix": {
      const [summary, content] = n.content ?? [];
      return [`**${inline(summary?.content)}**`, blocks(content?.content)]
        .filter(Boolean)
        .join("\n\n");
    }
    case "tabs":
      return (n.content ?? [])
        .map((tab) =>
          [
            `**${esc(String(tab.attrs?.label ?? ""))}**`,
            blocks(tab.content),
          ].join("\n\n"),
        )
        .join("\n\n");
    case "codeGroup":
    case "columnBlock":
    case "column":
    case "container":
      return blocks(n.content);
    case "codeGroupItem":
      return blocks(n.content);
    case "pageLink":
      return `📄 ${esc(String(a.title ?? ""))}`;
    case "bookmark":
      return a.url ? `[${esc(String(a.title || a.url))}](${a.url})` : "";
    case "video":
    case "audio":
      return a.src
        ? `[${esc(String(a.fileName || a.caption || a.src))}](${a.src})`
        : "";
    case "file":
      return ((a.files as { name: string; url: string }[] | undefined) ?? [])
        .map((f) => `[${esc(f.name)}](${f.url})`)
        .join("\n");
    case "ctaButton":
      return a.href && /^https?:\/\//.test(String(a.href))
        ? `[${esc(String(a.label ?? ""))}](${a.href})`
        : esc(String(a.label ?? ""));
    case "youtube":
      return a.src ? `<${a.src}>` : "";
    case "tocNode":
    case "breadcrumb":
    case "database":
    case "imageUpload":
      return "";
    default:
      // Unknown block: its content, so no text is lost.
      return n.content ? blocks(n.content) || inline(n.content) : "";
  }
}

/** The whole document as Markdown. */
export function contentToMarkdown(doc: JSONContent): string {
  return (
    blocks(doc.content)
      .replace(/\n{3,}/g, "\n\n")
      .trim() + "\n"
  );
}
