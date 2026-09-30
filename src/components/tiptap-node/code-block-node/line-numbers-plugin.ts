import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Node as PMNode } from "@tiptap/pm/model";

// Line numbers for code blocks that turn them on. Each line gets a small
// widget at its start, positioned into the left gutter by CSS. Because the
// number sits in the line itself, it stays aligned when long lines wrap —
// a separate gutter column couldn't know where wrapped lines break.

export const codeLineNumbersKey = new PluginKey("codeLineNumbers");

function lineNumber(n: number) {
  return () => {
    const el = document.createElement("span");
    el.className = "code-line-number";
    el.textContent = String(n);
    el.setAttribute("aria-hidden", "true");
    el.contentEditable = "false";
    return el;
  };
}

function build(doc: PMNode, typeName: string): DecorationSet {
  const decorations: Decoration[] = [];
  doc.descendants((node, pos) => {
    if (node.type.name !== typeName) return true;
    if (node.attrs.lineNumbers) {
      const start = pos + 1; // inside the code block
      const text = node.textContent;
      let line = 1;
      decorations.push(
        Decoration.widget(start, lineNumber(line), {
          side: -1,
          key: `ln-${line}`,
          ignoreSelection: true,
        }),
      );
      for (let i = 0; i < text.length; i++) {
        if (text[i] === "\n") {
          line += 1;
          decorations.push(
            Decoration.widget(start + i + 1, lineNumber(line), {
              side: -1,
              key: `ln-${line}`,
              ignoreSelection: true,
            }),
          );
        }
      }
    }
    return false; // no code blocks inside code blocks
  });
  return DecorationSet.create(doc, decorations);
}

export function codeLineNumbersPlugin(typeName: string) {
  return new Plugin({
    key: codeLineNumbersKey,
    state: {
      init: (_, state) => build(state.doc, typeName),
      apply: (tr, old) => (tr.docChanged ? build(tr.doc, typeName) : old),
    },
    props: {
      decorations(state) {
        return codeLineNumbersKey.getState(state);
      },
    },
  });
}
