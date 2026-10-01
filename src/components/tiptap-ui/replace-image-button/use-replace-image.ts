import { useEditorState } from "@tiptap/react";

import { NodeSelection } from "@tiptap/pm/state";

import type { Editor } from "@tiptap/core";

interface UseReplaceImageProps {
  editor: Editor | null;
  hideWhenUnavailable?: boolean;
}

interface UseReplaceImageReturn {
  isVisible: boolean;
}

export function useReplaceImage({
  editor,
  hideWhenUnavailable = false,
}: UseReplaceImageProps): UseReplaceImageReturn {
  const isImageSelected = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) return false;

      const { selection } = editor.state;

      return (
        selection instanceof NodeSelection &&
        selection.node.type.name === "image"
      );
    },
  });

  const isVisible = hideWhenUnavailable ? (isImageSelected ?? false) : true;

  return {
    isVisible,
  };
}
