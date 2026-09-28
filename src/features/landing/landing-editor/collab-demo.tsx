import { useEffect, useMemo, useRef, useState } from "react";
import { useEditor, type Extensions, type JSONContent } from "@tiptap/react";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import * as Y from "yjs";
import {
  Awareness,
  applyAwarenessUpdate,
  encodeAwarenessUpdate,
} from "y-protocols/awareness";
import { makeLandingExtensions } from "./landing-extensions";
import { LandingPageSurface } from "./landing-editor";

// Real-time collaboration without a server: two editors, each on its own
// Yjs document, wired to each other the way Hocuspocus wires two browsers.
// Every change and every cursor crosses over, exactly as in the app.

const REMOTE = "landing-remote";

export interface CollabPerson {
  name: string;
  color: string;
}

function linkDocs(a: Y.Doc, b: Y.Doc) {
  const ab = (update: Uint8Array, origin: unknown) => {
    if (origin !== REMOTE) Y.applyUpdate(b, update, REMOTE);
  };
  const ba = (update: Uint8Array, origin: unknown) => {
    if (origin !== REMOTE) Y.applyUpdate(a, update, REMOTE);
  };
  a.on("update", ab);
  b.on("update", ba);
  return () => {
    a.off("update", ab);
    b.off("update", ba);
  };
}

/**
 * The bits of a Hocuspocus provider the editor's extensions use: carets
 * read `awareness`, UniqueID waits for "synced". A local doc is synced from
 * the start.
 */
function localProvider(awareness: Awareness) {
  return {
    awareness,
    on(event: string, callback: () => void) {
      if (event === "synced") queueMicrotask(callback);
    },
    off() {},
  };
}

type AwarenessChange = {
  added: number[];
  updated: number[];
  removed: number[];
};

function linkAwareness(a: Awareness, b: Awareness) {
  const forward =
    (from: Awareness, to: Awareness) =>
    ({ added, updated, removed }: AwarenessChange, origin: unknown) => {
      if (origin === REMOTE) return;
      const changed = [...added, ...updated, ...removed];
      applyAwarenessUpdate(to, encodeAwarenessUpdate(from, changed), REMOTE);
    };
  const ab = forward(a, b);
  const ba = forward(b, a);
  a.on("update", ab);
  b.on("update", ba);
  return () => {
    a.off("update", ab);
    b.off("update", ba);
  };
}

function useCollabEditor(
  doc: Y.Doc,
  awareness: Awareness,
  person: CollabPerson,
  seed?: JSONContent,
) {
  const extensions = useMemo(
    () =>
      [
        ...makeLandingExtensions({ collaborative: true }),
        // Collaboration bundles its own @tiptap/core copy; cast at the
        // boundary, like the app's editor provider does.
        Collaboration.configure({ document: doc }),
        CollaborationCaret.configure({
          provider: localProvider(awareness),
          user: { name: person.name, color: person.color },
        }),
      ] as Extensions,
    [doc, awareness, person.name, person.color],
  );
  return useEditor(
    {
      extensions,
      immediatelyRender: false,
      shouldRerenderOnTransaction: false,
      editorProps: {
        attributes: { spellcheck: "false", class: "simple-editor" },
      },
      // Only the first window seeds the shared document; the second one
      // receives it through the link.
      onCreate: ({ editor }) => {
        if (seed && editor.isEmpty) editor.commands.setContent(seed);
      },
    },
    [extensions],
  );
}

/** Two windows on the same page. Type in either one. */
export function CollabDemo({
  content,
  people,
  windowLabel,
}: {
  content: JSONContent;
  people: [CollabPerson, CollabPerson];
  /** e.g. (name) => `Awa's window` */
  windowLabel: (name: string) => string;
}) {
  // One pair of documents per mount (remount to reset).
  const [shared] = useState(() => {
    const docA = new Y.Doc();
    const docB = new Y.Doc();
    return {
      docA,
      docB,
      awA: new Awareness(docA),
      awB: new Awareness(docB),
    };
  });

  // Link on mount. Destroying is deferred a tick so React's development
  // double mount (unmount + mount right away) doesn't destroy live docs.
  const pendingDestroy = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (pendingDestroy.current) clearTimeout(pendingDestroy.current);
    const unlinkDocs = linkDocs(shared.docA, shared.docB);
    const unlinkAw = linkAwareness(shared.awA, shared.awB);
    return () => {
      unlinkDocs();
      unlinkAw();
      pendingDestroy.current = setTimeout(() => {
        shared.awA.destroy();
        shared.awB.destroy();
        shared.docA.destroy();
        shared.docB.destroy();
      }, 0);
    };
  }, [shared]);

  const editorA = useCollabEditor(shared.docA, shared.awA, people[0], content);
  const editorB = useCollabEditor(shared.docB, shared.awB, people[1]);

  return (
    <div className="landing-collab">
      {[
        { editor: editorA, person: people[0] },
        { editor: editorB, person: people[1] },
      ].map(({ editor, person }) => (
        <div key={person.name} className="landing-collab__window">
          <div className="landing-collab__bar">
            <span
              className="landing-collab__avatar"
              style={{ background: person.color }}
              aria-hidden
            >
              {person.name.charAt(0)}
            </span>
            <span className="landing-collab__label">
              {windowLabel(person.name)}
            </span>
          </div>
          <div className="landing-collab__page">
            <LandingPageSurface editor={editor} />
          </div>
        </div>
      ))}
    </div>
  );
}
