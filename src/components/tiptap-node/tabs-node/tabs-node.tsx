import { Node, mergeAttributes, type Editor } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  NodeViewContent,
  useEditorState,
  type NodeViewProps,
} from "@tiptap/react";
import { Fragment } from "@tiptap/pm/model";
import { useEffect, useRef, useState } from "react";
import {
  TabList,
  TabItem,
  TabAddButton,
} from "src/components/tiptap-ui-primitive/tabs/tabs";
import "./tabs-node.scss";

let _seq = 0;
const uid = () => `tab_${Date.now().toString(36)}_${(_seq++).toString(36)}`;

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    tabs: {
      /** Insert a tabs block with two starter tabs. */
      insertTabs: () => ReturnType;
    };
  }
}

// ── "am I the active tab?", read through useEditorState (a boolean, so the
// panel re-renders only when it actually changes) ──
function useIsActiveTab(
  editor: Editor,
  getPos: NodeViewProps["getPos"],
  tabId: string,
) {
  return (
    useEditorState({
      editor,
      selector: ({ editor }) => {
        try {
          const pos = typeof getPos === "function" ? getPos() : null;
          if (pos == null) return false;
          const parent = editor.state.doc.resolve(pos).parent;
          return (
            parent?.type?.name === "tabs" && parent.attrs.activeTab === tabId
          );
        } catch {
          return false;
        }
      },
    }) ?? false
  );
}

// ── Tab panel view ──────────────────────────────────────────────────────────
function TabView({ node, editor, getPos }: NodeViewProps) {
  const active = useIsActiveTab(editor, getPos, node.attrs.tabId);
  return (
    <NodeViewWrapper
      as="div"
      className="tab-panel"
      data-tab-id={node.attrs.tabId}
      style={{ display: active ? "block" : "none" }}
    >
      <NodeViewContent className="tab-panel__content" />
    </NodeViewWrapper>
  );
}

// ── Tabs container view ───────────────────────────────────────────────────────
function TabsView({ node, editor, getPos, updateAttributes }: NodeViewProps) {
  const base = typeof getPos === "function" ? getPos() : null;

  const tabs: { id: string; label: string; pos: number; size: number }[] = [];
  node.forEach((child, offset) => {
    tabs.push({
      id: child.attrs.tabId,
      label: child.attrs.label,
      pos: base != null ? base + 1 + offset : -1,
      size: child.nodeSize,
    });
  });

  const activeTab = node.attrs.activeTab as string | null;

  // self-heal: if the stored active tab is missing/stale, point it at the first
  useEffect(() => {
    if (tabs.length === 0) return;
    const valid = tabs.some((t) => t.id === activeTab);
    if (!valid) updateAttributes({ activeTab: tabs[0].id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, tabs.length]);

  const setActive = (id: string) => updateAttributes({ activeTab: id });

  const addTab = () => {
    if (base == null) return;
    const id = uid();
    const endOfContent = base + node.nodeSize - 1; // just inside the closing token
    editor
      .chain()
      .focus()
      .insertContentAt(endOfContent, {
        type: "tab",
        attrs: { tabId: id, label: `Tab ${node.childCount + 1}` },
        content: [{ type: "paragraph" }],
      })
      .command(({ tr }) => {
        tr.setNodeAttribute(base, "activeTab", id);
        return true;
      })
      .run();
  };

  const removeTab = (pos: number, size: number) => {
    if (node.childCount <= 1) return; // keep at least one tab
    editor
      .chain()
      .focus()
      .deleteRange({ from: pos, to: pos + size })
      .run();
    // the self-heal effect re-points activeTab if we removed the active one
  };

  // Reorder: rebuild the tabs in the new order in one transaction.
  const moveTab = (from: number, to: number) => {
    if (base == null || from === to || to < 0 || to >= node.childCount) return;
    const children: NonNullable<typeof node.firstChild>[] = [];
    node.forEach((child) => children.push(child));
    const [moved] = children.splice(from, 1);
    children.splice(to, 0, moved);
    editor
      .chain()
      .command(({ tr }) => {
        tr.replaceWith(
          base + 1,
          base + node.nodeSize - 1,
          Fragment.fromArray(children),
        );
        return true;
      })
      .run();
  };
  const dragFrom = useRef<number | null>(null);
  const [dropAt, setDropAt] = useState<number | null>(null);
  const headersRef = useRef<HTMLDivElement>(null);
  const focusTab = (index: number) =>
    requestAnimationFrame(() => {
      const items =
        headersRef.current?.querySelectorAll<HTMLElement>('[role="tab"]');
      items?.[index]?.focus();
    });

  const renameTab = (pos: number, label: string) => {
    editor
      .chain()
      .command(({ tr }) => {
        tr.setNodeAttribute(pos, "label", label || "Tab");
        return true;
      })
      .run();
  };

  return (
    <NodeViewWrapper as="div" className="tabs" data-type="tabs">
      <div className="tabs__headers" contentEditable={false} ref={headersRef}>
        <TabList aria-label="Tabs">
          {tabs.map((t, index) => (
            <TabItem
              key={t.id}
              label={t.label}
              active={t.id === activeTab}
              className={dropAt === index ? "is-drop-target" : undefined}
              draggable={editor.isEditable}
              onDragStart={(e) => {
                dragFrom.current = index;
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/x-folio-tab", String(index));
              }}
              onDragOver={(e) => {
                if (dragFrom.current === null) return;
                e.preventDefault();
                setDropAt(index);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (dragFrom.current !== null) moveTab(dragFrom.current, index);
                dragFrom.current = null;
                setDropAt(null);
              }}
              onDragEnd={() => {
                dragFrom.current = null;
                setDropAt(null);
              }}
              onKeyDownExtra={(e) => {
                const last = tabs.length - 1;
                // Alt+←/→ moves the tab; ←/→/Home/End switch tabs.
                if (
                  e.altKey &&
                  (e.key === "ArrowLeft" || e.key === "ArrowRight")
                ) {
                  e.preventDefault();
                  const to = index + (e.key === "ArrowLeft" ? -1 : 1);
                  moveTab(index, to);
                  focusTab(Math.min(Math.max(to, 0), last));
                  return;
                }
                const next =
                  e.key === "ArrowLeft"
                    ? (index - 1 + tabs.length) % tabs.length
                    : e.key === "ArrowRight"
                      ? (index + 1) % tabs.length
                      : e.key === "Home"
                        ? 0
                        : e.key === "End"
                          ? last
                          : null;
                if (next === null) return;
                e.preventDefault();
                setActive(tabs[next].id);
                focusTab(next);
              }}
              onSelect={() => setActive(t.id)}
              onRename={(value) => renameTab(t.pos, value)}
              onClose={
                tabs.length > 1 ? () => removeTab(t.pos, t.size) : undefined
              }
            />
          ))}
          <TabAddButton onClick={addTab} />
        </TabList>
      </div>

      <NodeViewContent className="tabs__panels" />
    </NodeViewWrapper>
  );
}

// ── nodes ─────────────────────────────────────────────────────────────────────
export const Tab = Node.create({
  name: "tab",
  content: "block+",
  isolating: true,
  defining: true,
  selectable: false,

  addAttributes() {
    return {
      tabId: { default: null },
      label: { default: "Tab" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="tab"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "tab" }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TabView);
  },
});

export const Tabs = Node.create({
  name: "tabs",
  group: "block",
  content: "tab+",
  isolating: true,
  draggable: true,

  addAttributes() {
    return {
      activeTab: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="tabs"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "tabs" }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TabsView);
  },

  addCommands() {
    return {
      insertTabs:
        () =>
        ({ chain }) => {
          const id1 = uid();
          const id2 = uid();
          return chain()
            .insertContent({
              type: "tabs",
              attrs: { activeTab: id1 },
              content: [
                {
                  type: "tab",
                  attrs: { tabId: id1, label: "Tab 1" },
                  content: [{ type: "paragraph" }],
                },
                {
                  type: "tab",
                  attrs: { tabId: id2, label: "Tab 2" },
                  content: [{ type: "paragraph" }],
                },
              ],
            })
            .run();
        },
    };
  },
});
