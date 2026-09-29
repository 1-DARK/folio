import { useEffect, useState } from "react";
import { Card, CardItemGroup } from "src/components/tiptap-ui-primitive/card";
import type { Editor } from "@tiptap/core";
import { BubbleMenu } from "@tiptap/react/menus";
import { ImageAlignButton } from "src/components/tiptap-ui/image-align-button/image-align-button";
import { Separator } from "src/components/tiptap-ui-primitive/separator";
import { DeleteNodeButton } from "src/components/tiptap-ui/delete-node-button";
import CaptionButton from "src/components/tiptap-ui/caption-button";
import { NodeSelection } from "@tiptap/pm/state";
import ReplaceImageButton from "src/components/tiptap-ui/replace-image-button";
import { ImageDownloadButton } from "../image-download-button";
import { Button } from "src/components/tiptap-ui-primitive/button";
import { Input, InputGroup } from "src/components/tiptap-ui-primitive/input";
import { CornerDownLeftIcon } from "src/components/tiptap-icons/corner-down-left-icon";
import { Maximize2 } from "lucide-react";
import { OPEN_LIGHTBOX_EVENT } from "src/components/tiptap-node/image-node/image-lightbox";

// Opens the selected image's lightbox by firing an event on its wrapper;
// the image's own node view listens for it.
function openSelectedImage(editor: Editor) {
  const { selection } = editor.state;
  if (!(selection instanceof NodeSelection)) return;
  const dom = editor.view.nodeDOM(selection.from) as HTMLElement | null;
  const wrapper = dom?.matches("[data-image-wrapper]")
    ? dom
    : dom?.querySelector("[data-image-wrapper]");
  wrapper?.dispatchEvent(new Event(OPEN_LIGHTBOX_EVENT));
}

// Alt text, edited inside the bubble itself. A portaled popover would take
// focus outside the bubble and the bubble would close under it.
function AltTextRow({
  editor,
  onDone,
}: {
  editor: Editor;
  onDone: () => void;
}) {
  const [value, setValue] = useState<string>(
    () => editor.getAttributes("image").alt ?? "",
  );

  const save = () => {
    editor
      .chain()
      .updateAttributes("image", { alt: value.trim() || null })
      .focus()
      .run();
    onDone();
  };

  return (
    <CardItemGroup orientation="horizontal">
      <InputGroup>
        <Input
          type="text"
          placeholder="Describe the image for screen readers…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              save();
            } else if (e.key === "Escape") {
              e.preventDefault();
              editor.commands.focus();
              onDone();
            }
          }}
          autoFocus
          autoComplete="off"
          style={{ minWidth: 260 }}
        />
      </InputGroup>
      <Button
        type="button"
        variant="ghost"
        tooltip="Save"
        showTooltip
        onClick={save}
      >
        <CornerDownLeftIcon className="tiptap-button-icon" />
      </Button>
    </CardItemGroup>
  );
}

export function ImageBubble({ editor }: { editor: Editor | null }) {
  const [mode, setMode] = useState<"tools" | "alt">("tools");

  const [, setTick] = useState(0);

  // Selecting another node brings the regular tools back; any change
  // re-renders so the Alt button shows whether alt text is set.
  useEffect(() => {
    if (!editor) return;
    const reset = () => setMode("tools");
    const tick = () => setTick((n) => n + 1);
    editor.on("selectionUpdate", reset);
    editor.on("transaction", tick);
    return () => {
      editor.off("selectionUpdate", reset);
      editor.off("transaction", tick);
    };
  }, [editor]);

  if (!editor) return null;

  const hasAlt = !!editor.getAttributes("image").alt;

  return (
    <BubbleMenu
      pluginKey={"imageAlignBubblePlugin"}
      editor={editor}
      shouldShow={({ editor, state }) => {
        const selection = state.selection;
        if (!(selection instanceof NodeSelection)) return false;

        if (editor.isActive("image") || editor.isActive("figure")) {
          return true;
        }
        return false;
      }}
    >
      <Card className="bubble-menu-content">
        {mode === "alt" ? (
          <AltTextRow editor={editor} onDone={() => setMode("tools")} />
        ) : (
          <CardItemGroup orientation="horizontal">
            <ImageAlignButton
              hideWhenUnavailable={true}
              editor={editor}
              align="left"
              tooltip={"Align left"}
              showTooltip={true}
            />
            <ImageAlignButton
              hideWhenUnavailable={true}
              editor={editor}
              align="center"
              tooltip={"Align center"}
              showTooltip={true}
            />
            <ImageAlignButton
              hideWhenUnavailable={true}
              editor={editor}
              align="right"
              tooltip={"Align right"}
              showTooltip={true}
            />
            <Separator orientation="vertical" />
            <ReplaceImageButton
              hideWhenUnavailable={true}
              editor={editor}
              showTooltip={true}
            />
            <CaptionButton
              hideWhenUnavailable={true}
              editor={editor}
              showTooltip={true}
            />
            <Button
              type="button"
              variant="ghost"
              tooltip={hasAlt ? "Edit alt text" : "Add alt text"}
              showTooltip
              data-active-state={hasAlt ? "on" : "off"}
              onClick={() => setMode("alt")}
            >
              <span className="tiptap-button-text">Alt</span>
            </Button>
            <Separator orientation="vertical" />
            <Button
              type="button"
              variant="ghost"
              tooltip="View full size"
              showTooltip
              onClick={() => openSelectedImage(editor)}
            >
              <Maximize2 className="tiptap-button-icon" />
            </Button>
            <ImageDownloadButton
              hideWhenUnavailable={true}
              editor={editor}
              showTooltip={true}
            />
            <DeleteNodeButton editor={editor} showTooltip={true} />
          </CardItemGroup>
        )}
      </Card>
    </BubbleMenu>
  );
}
