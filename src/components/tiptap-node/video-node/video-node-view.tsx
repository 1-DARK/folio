import { useCallback, useEffect, useRef, useState } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import {
  AlertCircle,
  ArrowDown,
  Link2,
  Loader2,
  Upload,
  Video,
  X,
} from "lucide-react";
import { Button, ButtonGroup } from "src/components/tiptap-ui-primitive/button";
import type { VideoAttrs } from "./types";
import type { VideoOptions } from "./video-node";
import { parseVideoUrl, videoSourceOf } from "./video-embed";
import "./video-node-view.scss";
// Same card as the image and file blocks.
import "src/components/tiptap-node/image-upload-node/image-upload-card.scss";

const FORMATS = "MP4, WEBM or MOV";
const PROVIDERS = "YouTube, Vimeo or Loom";
const PROVIDER_LABEL = {
  youtube: "YouTube video",
  vimeo: "Vimeo video",
  loom: "Loom video",
  file: "Video file",
} as const;

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    const mb = bytes / 1024 / 1024;
    return `${Number.isInteger(mb) ? mb : mb.toFixed(1)} MB`;
  }
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

interface Uploading {
  file: File;
  progress: number;
  controller: AbortController;
}

// ── Empty block: upload or link ─────────────────────────────────────────────

function VideoCard({
  options,
  onDone,
}: {
  options: VideoOptions;
  onDone: (attrs: Partial<VideoAttrs>) => void;
}) {
  const canUpload = !!options.upload;
  const [tab, setTab] = useState<"upload" | "link">(
    canUpload ? "upload" : "link",
  );
  const [uploading, setUploading] = useState<Uploading | null>(null);
  const [error, setError] = useState<{ title: string; body: string } | null>(
    null,
  );
  const [dragDepth, setDragDepth] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Stop an upload still running when the block goes away.
  const uploadingRef = useRef(uploading);
  useEffect(() => {
    uploadingRef.current = uploading;
  }, [uploading]);
  useEffect(() => () => uploadingRef.current?.controller.abort(), []);

  const upload = useCallback(
    async (file: File) => {
      setError(null);
      if (!options.upload) return;
      if (!file.type.startsWith("video/")) {
        setError({
          title: `${file.name} isn't a video`,
          body: `Use an ${FORMATS} file, or paste a ${PROVIDERS} link.`,
        });
        return;
      }
      if (options.maxSize > 0 && file.size > options.maxSize) {
        setError({
          title: `${file.name} is ${formatSize(file.size)}`,
          body: `Uploads can be up to ${formatSize(options.maxSize)}. Put longer videos on ${PROVIDERS} and paste the link.`,
        });
        return;
      }
      const controller = new AbortController();
      setUploading({ file, progress: 0, controller });
      try {
        const src = await options.upload(
          file,
          ({ progress }) => setUploading((u) => (u ? { ...u, progress } : u)),
          controller.signal,
        );
        onDone({ src, fileName: file.name });
      } catch (err) {
        if (controller.signal.aborted) return;
        const e = err instanceof Error ? err : new Error(String(err));
        options.onError?.(e);
        setError({
          title: `${file.name} couldn't be uploaded`,
          body: `${e.message}. Check your connection and try again.`,
        });
      } finally {
        setUploading(null);
      }
    },
    [options, onDone],
  );

  const dragging = dragDepth > 0 && !uploading;

  return (
    <div
      className="image-upload-card video-card"
      tabIndex={-1}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {canUpload && (
        <div className="image-upload-card__head">
          <ButtonGroup
            orientation="horizontal"
            className="image-upload-card__tabs"
            role="tablist"
            aria-label="Add a video"
          >
            {(
              [
                ["upload", "Upload", Upload],
                ["link", "Link", Link2],
              ] as const
            ).map(([id, label, Icon]) => (
              <Button
                key={id}
                type="button"
                role="tab"
                variant="ghost"
                aria-selected={tab === id}
                data-active-state={tab === id ? "on" : "off"}
                className="image-upload-card__tab"
                onClick={() => {
                  setTab(id);
                  setError(null);
                }}
              >
                <Icon className="tiptap-button-icon" />
                <span className="tiptap-button-text">{label}</span>
              </Button>
            ))}
          </ButtonGroup>
        </div>
      )}

      {tab === "upload" && (
        <div className="image-upload-card__body">
          {error ? (
            <div className="image-upload-card__error-wrap">
              <div className="image-upload-card__error" role="alert">
                <span className="image-upload-card__error-icon">
                  <AlertCircle size={17} />
                </span>
                <div>
                  <div className="image-upload-card__error-title">
                    {error.title}
                  </div>
                  <div className="image-upload-card__error-body">
                    {error.body}
                  </div>
                </div>
              </div>
              <div className="image-upload-card__actions">
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => inputRef.current?.click()}
                >
                  <span className="tiptap-button-text">
                    Choose another file
                  </span>
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setTab("link");
                  }}
                >
                  <span className="tiptap-button-text">Use a link instead</span>
                </Button>
              </div>
            </div>
          ) : uploading ? (
            <div className="image-upload-card__uploads">
              <div className="image-upload-card__row">
                <span className="image-upload-card__thumb video-card__thumb">
                  <Video size={22} />
                </span>
                <div className="image-upload-card__row-main">
                  <div className="image-upload-card__row-top">
                    <span className="image-upload-card__row-name">
                      {uploading.file.name}
                    </span>
                    <span className="image-upload-card__row-pct">
                      {uploading.progress}%
                    </span>
                  </div>
                  <div
                    className="image-upload-card__bar"
                    role="progressbar"
                    aria-valuenow={uploading.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Uploading ${uploading.file.name}`}
                  >
                    <div style={{ width: `${uploading.progress}%` }} />
                  </div>
                  <span className="image-upload-card__row-meta">
                    {formatSize(
                      Math.round(
                        (uploading.file.size * uploading.progress) / 100,
                      ),
                    )}{" "}
                    of {formatSize(uploading.file.size)}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  aria-label="Cancel upload"
                  tooltip="Cancel"
                  showTooltip
                  onClick={() => {
                    uploading.controller.abort();
                    setUploading(null);
                  }}
                >
                  <X className="tiptap-button-icon" />
                </Button>
              </div>
              <p className="image-upload-card__hint">
                Keep writing: the video replaces this card when it's ready.
              </p>
            </div>
          ) : (
            <button
              type="button"
              className={`image-upload-card__drop${dragging ? " is-dragging" : ""}`}
              onClick={() => inputRef.current?.click()}
              onDragEnter={(e) => {
                e.preventDefault();
                setDragDepth((d) => d + 1);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDragLeave={() => setDragDepth((d) => Math.max(0, d - 1))}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragDepth(0);
                const file = e.dataTransfer.files?.[0];
                if (file) void upload(file);
              }}
            >
              {dragging ? (
                <>
                  <span className="image-upload-card__drop-icon is-solid">
                    <ArrowDown size={22} />
                  </span>
                  <span className="image-upload-card__drop-title">
                    Drop to add it here
                  </span>
                </>
              ) : (
                <>
                  <span className="image-upload-card__drop-icon">
                    <Video size={20} />
                  </span>
                  <span className="image-upload-card__drop-title">
                    Drop a video here, or <u>browse</u>
                  </span>
                  <span className="image-upload-card__drop-meta">
                    {FORMATS}
                    {options.maxSize > 0
                      ? ` · up to ${formatSize(options.maxSize)}`
                      : ""}
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {tab === "link" && <LinkPanel onAdd={(src) => onDone({ src })} />}

      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        hidden
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void upload(file);
        }}
      />
    </div>
  );
}

function LinkPanel({ onAdd }: { onAdd: (src: string) => void }) {
  const [value, setValue] = useState("");
  const url = value.trim();
  const parsed = url ? parseVideoUrl(url) : null;
  const invalid = url.length > 0 && !parsed;

  const add = () => {
    if (parsed) onAdd(url);
  };

  return (
    <div className="image-upload-card__body image-upload-card__form">
      <label htmlFor="video-link" className="image-upload-card__label">
        Video link
      </label>
      <input
        id="video-link"
        className="image-upload-card__input"
        placeholder="https://www.youtube.com/watch?v=…"
        value={value}
        autoFocus
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") add();
        }}
      />
      {invalid && (
        <span className="image-upload-card__preview-fail video-card__invalid">
          That link isn't a video we can play. Use a {PROVIDERS} link, or a
          direct link to an {FORMATS} file.
        </span>
      )}
      <div className="image-upload-card__form-foot">
        <span className="image-upload-card__hint">
          {parsed
            ? PROVIDER_LABEL[parsed.provider]
            : `${PROVIDERS}, or a link to an ${FORMATS} file`}
        </span>
        <Button
          type="button"
          variant="primary"
          disabled={!parsed}
          onClick={add}
        >
          <span className="tiptap-button-text">Embed video</span>
        </Button>
      </div>
    </div>
  );
}

// ── Filled block: the player ────────────────────────────────────────────────

function VideoFile({ src, poster }: { src: string; poster: string | null }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className="video-player">
      {loading && !error && (
        <div className="video-loading">
          <Loader2 className="video-spin" style={{ width: 24, height: 24 }} />
        </div>
      )}
      {error && (
        <div className="video-error">
          <AlertCircle style={{ width: 16, height: 16 }} />
          <span>Could not load this video</span>
        </div>
      )}
      <video
        src={src}
        poster={poster ?? undefined}
        controls
        preload="metadata"
        playsInline
        style={{ display: error ? "none" : "block" }}
        onLoadedMetadata={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
      />
    </div>
  );
}

export function VideoNodeView({
  node,
  updateAttributes,
  extension,
  editor,
}: NodeViewProps) {
  const attrs = node.attrs as VideoAttrs;
  const editable = editor.isEditable;
  const options = extension.options as VideoOptions;

  const onDone = useCallback(
    (next: Partial<VideoAttrs>) => updateAttributes(next),
    [updateAttributes],
  );

  if (!attrs.src) {
    return (
      <NodeViewWrapper className="video-node" contentEditable={false}>
        {editable ? <VideoCard options={options} onDone={onDone} /> : null}
      </NodeViewWrapper>
    );
  }

  const source = videoSourceOf(attrs.src);

  return (
    <NodeViewWrapper className="video-node" contentEditable={false}>
      <div className="video-frame">
        {source.provider === "file" ? (
          <VideoFile src={source.src} poster={attrs.poster} />
        ) : (
          <div className="video-embed">
            <iframe
              src={source.src}
              title={attrs.caption || `${source.provider} video`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              loading="lazy"
            />
          </div>
        )}

        {editable && (
          <div className="video-actions">
            <Button
              type="button"
              variant="ghost"
              size="small"
              className="video-actions__btn"
              onClick={() =>
                updateAttributes({ src: null, fileName: null, poster: null })
              }
            >
              <span className="tiptap-button-text">Replace</span>
            </Button>
          </div>
        )}
      </div>

      {(editable || attrs.caption) && (
        <input
          className="video-caption"
          placeholder="Add a caption…"
          value={attrs.caption}
          readOnly={!editable}
          onChange={(e) => updateAttributes({ caption: e.target.value })}
          onKeyDown={(e) => e.stopPropagation()}
        />
      )}
    </NodeViewWrapper>
  );
}
