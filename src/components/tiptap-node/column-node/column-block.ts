import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import ColumnBlockView from "./column-block-view";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    columnBlock: {
      insertColumns: (count: 2 | 3 | 4) => ReturnType;
      /** Replace the selected (or surrounding) columns block with its blocks,
       *  left column first. */
      unwrapColumns: () => ReturnType;
    };
  }
}

export const ColumnBlock = Node.create({
  name: "columnBlock",
  group: "block",
  content: "column*",
  draggable: true,
  isolating: true,
  topNode: true,

  parseHTML() {
    return [{ tag: "div[data-type='column-block']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "column-block" }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ColumnBlockView);
  },

  addCommands() {
    return {
      insertColumns:
        (count: 2 | 3 | 4) =>
        ({ commands }) => {
          return commands.insertContent({
            type: "columnBlock",
            content: Array.from({ length: count }, () => ({
              type: "column",
              attrs: { width: `${100 / count}%` },
              content: [{ type: "paragraph" }],
            })),
          });
        },
      unwrapColumns:
        () =>
        ({ state, tr, dispatch }) => {
          const { selection } = state;
          let pos: number | null = null;
          const selected = (selection as { node?: typeof state.doc }).node;
          if (selected?.type.name === this.name) {
            pos = selection.from;
          } else {
            const { $from } = selection;
            for (let d = $from.depth; d > 0; d--) {
              if ($from.node(d).type.name === this.name) {
                pos = $from.before(d);
                break;
              }
            }
          }
          if (pos === null) return false;
          const block = state.doc.nodeAt(pos);
          if (!block) return false;

          const blocks: (typeof block)[] = [];
          block.forEach((column) =>
            column.forEach((child) => blocks.push(child)),
          );
          if (blocks.length === 0)
            blocks.push(state.schema.nodes.paragraph.create());

          if (dispatch) {
            tr.replaceWith(pos, pos + block.nodeSize, blocks);
            dispatch(tr.scrollIntoView());
          }
          return true;
        },
    };
  },
});
