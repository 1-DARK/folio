import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { Plugin, PluginKey, TextSelection } from "@tiptap/pm/state";
import { AppendixView } from "./appendix-node-view";
import "./appendix-node.scss";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    appendix: {
      /** Insert an empty toggle block (open, cursor in the title). */
      insertAppendix: () => ReturnType;
      /** Alias — reads better at call sites. Pass 1–3 for a toggle heading. */
      insertToggle: (level?: 1 | 2 | 3) => ReturnType;
      /** A toggle whose title is styled as a heading. */
      insertToggleHeading: (level: 1 | 2 | 3) => ReturnType;
    };
  }
}

// ── Summary: the toggle's title line ────────────────────────────────────────
export const AppendixSummary = Node.create({
  name: "appendixSummary",
  content: "inline*",
  defining: true,
  isolating: true,

  parseHTML() {
    return [{ tag: 'div[data-type="appendix-summary"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "appendix-summary",
        class: "appendix-summary",
      }),
      0,
    ];
  },
});

// ── Content: the collapsible body ───────────────────────────────────────────
export const AppendixContent = Node.create({
  name: "appendixContent",
  content: "block+",
  defining: true,
  isolating: true,

  parseHTML() {
    return [{ tag: 'div[data-type="appendix-content"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "appendix-content",
        class: "appendix-content",
      }),
      0,
    ];
  },
});

// ── Wrapper: a Notion-style toggle. Owns the open/closed state. ──────────────
// (Kept the node name "appendix" for backward-compat with existing documents
// and the Hocuspocus schema; it now behaves and renders as a plain toggle —
// free-text title, no auto-lettering.)
export const Appendix = Node.create({
  name: "appendix",
  group: "block",
  content: "appendixSummary appendixContent",
  defining: true,
  isolating: true,
  draggable: true,

  addAttributes() {
    return {
      open: {
        default: true,
        parseHTML: (el) => el.getAttribute("data-open") !== "false",
        renderHTML: (attrs) => ({ "data-open": String(attrs.open) }),
      },
      // null: a plain toggle. 1–3: a toggle heading (title styled as H1–H3).
      level: {
        default: null,
        parseHTML: (el) => {
          const n = Number(el.getAttribute("data-level"));
          return n >= 1 && n <= 3 ? n : null;
        },
        renderHTML: (attrs) =>
          attrs.level ? { "data-level": String(attrs.level) } : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="appendix"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "appendix",
        class: "appendix",
      }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AppendixView);
  },

  addCommands() {
    const insert =
      (level?: 1 | 2 | 3) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ({ chain }: any) =>
        chain()
          .insertContent({
            type: this.name,
            attrs: { open: true, level: level ?? null },
            content: [
              { type: "appendixSummary" },
              { type: "appendixContent", content: [{ type: "paragraph" }] },
            ],
          })
          // insertContent leaves the cursor in the body; put it in the title.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .command(({ tr }: any) => {
            const { $from } = tr.selection;
            for (let d = $from.depth; d > 0; d--) {
              if ($from.node(d).type.name === this.name) {
                tr.setSelection(
                  TextSelection.create(tr.doc, $from.before(d) + 2),
                );
                return true;
              }
            }
            return true;
          })
          .run();
    return {
      insertAppendix: () => insert(),
      insertToggle: insert,
      insertToggleHeading: (level: 1 | 2 | 3) => insert(level),
    };
  },

  addKeyboardShortcuts() {
    return {
      // Enter in the title → open the toggle and jump into the body.
      Enter: ({ editor }) => {
        const { state } = editor;
        const { $from } = state.selection;
        if ($from.parent.type.name !== "appendixSummary") return false;

        const appendixDepth = $from.depth - 1;
        const appendixNode = $from.node(appendixDepth);
        if (appendixNode.type.name !== "appendix") return false;

        const appendixPos = $from.before(appendixDepth);
        const summaryNode = appendixNode.child(0);

        const tr = state.tr;
        if (!appendixNode.attrs.open) {
          tr.setNodeMarkup(appendixPos, undefined, {
            ...appendixNode.attrs,
            open: true,
          });
        }
        const contentTextPos = appendixPos + 1 + summaryNode.nodeSize + 2;
        tr.setSelection(TextSelection.near(tr.doc.resolve(contentTextPos), 1));
        editor.view.dispatch(tr.scrollIntoView());
        return true;
      },

      // Backspace in an empty title with an empty body → delete the block.
      Backspace: ({ editor }) => {
        const { state } = editor;
        const { $from, empty } = state.selection;
        if (!empty) return false;
        if ($from.parent.type.name !== "appendixSummary") return false;
        if ($from.parent.content.size > 0) return false;
        if ($from.parentOffset !== 0) return false;

        const appendixDepth = $from.depth - 1;
        const appendixNode = $from.node(appendixDepth);
        if (appendixNode.type.name !== "appendix") return false;

        const content = appendixNode.child(1);
        const contentIsEmpty =
          content.childCount === 1 &&
          content.firstChild?.type.name === "paragraph" &&
          content.firstChild.content.size === 0;
        if (!contentIsEmpty) return false;

        const appendixPos = $from.before(appendixDepth);
        const tr = state.tr.delete(
          appendixPos,
          appendixPos + appendixNode.nodeSize,
        );
        editor.view.dispatch(tr);
        return true;
      },
    };
  },

  addProseMirrorPlugins() {
    // The appendix-lettering plugin ("Appendix A/B: " prefixes) is removed — a
    // toggle has a free-text title. Only the auto-open guard remains, so the
    // caret is never left inside collapsed (display:none) content.
    return [
      new Plugin({
        key: new PluginKey("toggleAutoOpen"),
        appendTransaction: (transactions, _oldState, newState) => {
          if (!transactions.some((tr) => tr.selectionSet || tr.docChanged)) {
            return null;
          }
          const { $from } = newState.selection;
          let tr: typeof newState.tr | null = null;
          for (let d = $from.depth; d > 1; d--) {
            if ($from.node(d).type.name !== "appendixContent") continue;
            const appendix = $from.node(d - 1);
            if (appendix.type.name === "appendix" && !appendix.attrs.open) {
              const pos = $from.before(d - 1);
              tr = tr ?? newState.tr;
              tr.setNodeMarkup(pos, undefined, {
                ...appendix.attrs,
                open: true,
              });
            }
          }
          return tr;
        },
      }),
    ];
  },
});
