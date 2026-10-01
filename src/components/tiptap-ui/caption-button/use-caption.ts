import { useEditorState } from "@tiptap/react";

import type { UseCaptionProps, UseCaptionReturnProps } from "./types";

import { getFilteredBlockTypeOptions } from "../color-dropdown-menu/utils";

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCaption({
  editor,
  allowedBlockTypes,
  hideWhenUnavailable = false,
}: UseCaptionProps): UseCaptionReturnProps {
  const filteredBlockTypes = getFilteredBlockTypeOptions(allowedBlockTypes);

  const isVisible = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) return false;

      return filteredBlockTypes.some((block) => editor.isActive(block.type));
    },
  });

  return {
    isVisible: hideWhenUnavailable ? (isVisible ?? false) : true,
  };
}
