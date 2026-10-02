import {
  type DragHandlePluginProps,
  defaultComputePositionConfig,
  DragHandlePlugin,
  dragHandlePluginDefaultKey,
} from "../drag-handle-extension";

import type { Node } from "@tiptap/pm/model";
import { Plugin } from "@tiptap/pm/state";
import type { Editor } from "@tiptap/react";
import { type ReactNode, useEffect, useRef, useState } from "react";

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

export type DragHandleProps = Omit<
  Optional<DragHandlePluginProps, "pluginKey">,
  "element"
> & {
  className?: string;
  onNodeChange?: (data: {
    node: Node | null;
    editor: Editor;
    pos: number;
  }) => void;
  children: ReactNode;
};

/**
 * Runs `create` while recording the dragstart/dragend listeners it adds to
 * `element`, so they can be put back later (see below).
 */
function recordDragListeners<T>(element: HTMLElement, create: () => T) {
  const listeners: [string, EventListenerOrEventListenerObject][] = [];
  const add = element.addEventListener.bind(element);
  element.addEventListener = ((
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ) => {
    if (type === "dragstart" || type === "dragend") {
      listeners.push([type, listener]);
    }
    add(type, listener, options);
  }) as typeof element.addEventListener;
  try {
    return { result: create(), listeners };
  } finally {
    // Back to the native method.
    delete (element as { addEventListener?: unknown }).addEventListener;
  }
}

export const DragHandle = (props: DragHandleProps) => {
  const {
    className = "drag-handle",
    children,
    editor,
    pluginKey = dragHandlePluginDefaultKey,
    onNodeChange,
    onElementDragStart,
    onElementDragEnd,
    computePositionConfig = defaultComputePositionConfig,
    nestedOptions,
  } = props;

  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const plugin = useRef<Plugin | null>(null);

  // Stable refs so the effect never needs to re-run due to callback identity changes
  const onNodeChangeRef = useRef(onNodeChange);
  const onElementDragStartRef = useRef(onElementDragStart);
  const onElementDragEndRef = useRef(onElementDragEnd);
  const computePositionConfigRef = useRef(computePositionConfig);

  // Keep refs current without triggering the effect
  useEffect(() => {
    onNodeChangeRef.current = onNodeChange;
  }, [onNodeChange]);
  useEffect(() => {
    onElementDragStartRef.current = onElementDragStart;
  }, [onElementDragStart]);
  useEffect(() => {
    onElementDragEndRef.current = onElementDragEnd;
  }, [onElementDragEnd]);
  useEffect(() => {
    computePositionConfigRef.current = computePositionConfig;
  }, [computePositionConfig]);

  useEffect(() => {
    let initPlugin: {
      plugin: Plugin;
      unbind: () => void;
    } | null = null;

    if (!element || editor.isDestroyed) {
      return () => {
        plugin.current = null;
      };
    }

    if (!plugin.current) {
      // The library attaches its dragstart/dragend listeners to the handle
      // once, when the plugin is created, but removes them in its plugin
      // view's destroy(). ProseMirror destroys and recreates every plugin
      // view whenever any plugin is registered or unregistered (the bubble
      // menu, the comment handle, the image bubble all register theirs after
      // this one), so after the first such change the handle still dragged
      // natively but the editor never knew what was dragged: every drop did
      // nothing. Record those listeners here and put them back each time the
      // view is recreated.
      const recorded = recordDragListeners(element, () =>
        DragHandlePlugin({
          editor,
          element,
          pluginKey,
          computePositionConfig: {
            ...defaultComputePositionConfig,
            ...computePositionConfigRef.current,
          },
          onElementDragStart: (e) => onElementDragStartRef.current?.(e),
          onElementDragEnd: (e) => onElementDragEndRef.current?.(e),
          onNodeChange: (data) => onNodeChangeRef.current?.(data),
          nestedOptions,
        }),
      );
      initPlugin = recorded.result;

      // We override it here so only the grip button is draggable.
      // requestAnimationFrame(() => {
      //   element.draggable = false;
      // });

      const libraryPlugin = initPlugin.plugin;
      const libraryView = libraryPlugin.spec.view;
      plugin.current = libraryView
        ? new Plugin({
            ...libraryPlugin.spec,
            view: (view) => {
              // Re-adding a listener that is already there is a no-op.
              for (const [type, listener] of recorded.listeners) {
                element.addEventListener(type, listener);
              }
              return libraryView(view);
            },
          })
        : libraryPlugin;
      editor.registerPlugin(plugin.current);
    }

    return () => {
      editor.unregisterPlugin(pluginKey);
      plugin.current = null;
      if (initPlugin) {
        initPlugin.unbind();
        initPlugin = null;
      }
    };
  }, [element, editor, pluginKey, nestedOptions]); // ← only truly stable deps

  return (
    <div
      className={className}
      style={{ visibility: "hidden", position: "absolute" }}
      data-dragging="false"
      ref={setElement}
    >
      {children}
    </div>
  );
};
