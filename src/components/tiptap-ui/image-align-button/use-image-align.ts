import { useCallback } from "react";
import { useEditorState } from "@tiptap/react";
import { useHotkeys } from "react-hotkeys-hook";

import type {
  UseImageAlignProps,
  UseImageAlignReturn,
  AlignValue,
} from "./types";

import { ALIGN_CONFIG } from "./config";
import { isImageAlignActive, shouldShowButton, setImageAlign } from "./utils";

export function useImageAlign({
  editor,
  align,
  extensionName = "image",
  attributeName = "data-align",
  hideWhenUnavailable = false,
  onAligned,
}: UseImageAlignProps): UseImageAlignReturn {
  const config = ALIGN_CONFIG[align];

  const editorState = useEditorState({
    editor,
    selector: ({ editor }) => ({
      isActive: editor ? isImageAlignActive(editor, align) : false,

      isVisible: editor
        ? shouldShowButton({
            editor,
            align,
            hideWhenUnavailable,
            extensionName,
            attributeName,
          })
        : false,
    }),
  });

  const canAlign = true;

  const handleImageAlign = useCallback((): boolean => {
    if (!editor) return false;

    const result = setImageAlign(editor, align);

    if (result) {
      onAligned?.();
    }

    return result;
  }, [editor, align, onAligned]);

  const hotkeyMap: Record<AlignValue, string> = {
    left: "alt+shift+l",
    center: "alt+shift+e",
    right: "alt+shift+r",
  };

  useHotkeys(
    hotkeyMap[align],
    (event) => {
      event.preventDefault();
      handleImageAlign();
    },
    { enableOnContentEditable: true },
  );

  return {
    isVisible: editorState?.isVisible ?? false,
    canAlign,
    isActive: editorState?.isActive ?? false,
    handleImageAlign,
    label: config.label,
    shortcutKeys: config.shortcut,
    Icon: config.Icon,
  };
}
