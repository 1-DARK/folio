import { Editor, useCurrentEditor } from "@tiptap/react";
import { memo, useCallback } from "react";
import { usePageView } from "../../pages/context/page-view-context";
import { PagePeekView } from "../../pages/page-peek-view";
import { PageCenterView } from "../../pages/page-center-view";

function triggerMainEditorSync(mainEditor: Editor | null) {
  if (!mainEditor) return;
  mainEditor.view.dispatch(mainEditor.state.tr.setMeta("peekPageClosed", true));
}

function PageOverlaysImpl() {
  const { target, setTarget } = usePageView();
  const { editor } = useCurrentEditor();
  const onClosePeekView = useCallback(() => {
    triggerMainEditorSync(editor);
    setTarget(undefined);
  }, [setTarget, editor]);
  const onCloseCenterView = useCallback(() => {
    setTarget(undefined);
  }, [setTarget]);

  return (
    <>
      {target && target.view === "Peek" && (
        <PagePeekView onClose={onClosePeekView} />
      )}

      {target && target.view === "Center" && (
        <PageCenterView onClose={onCloseCenterView} />
      )}
    </>
  );
}

export const PageOverlays = memo(PageOverlaysImpl);
