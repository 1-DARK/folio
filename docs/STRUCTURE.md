# Folio — code structure

```
src/
  main.tsx            entry (index.html loads it)
  app/                App.tsx (providers, router) and routes/
  features/           the app, one folder per feature
    shell/            app frame: simple-editor.tsx, toolbar, sidebar, search /
                      quick open, tabs, toasts, skeletons, offline guard,
                      user menu, and views/ (home, library, page layouts)
    auth/             auth gate, sign-in
    landing/          public landing page
    home/             home page, carousels, Learn guides, greeting
    editor/           the page editor: content, collab + offline doc
                      (use-collab-doc), editor contexts, presence
    pages/            page items, peek / center views, cover & icon,
                      share, trash, templates, library, page contexts
    database/         inline databases (views, cells, properties) and the
                      record property panel
    comments/         comments, suggestions, discussion pane, page comments
    chat/             chat rooms, study sessions, showcases
    inbox/            inbox and notifications
    workspace/        workspace settings, people, teamspaces, switcher
    versions/         version history
  components/
    brand/            FolioMark
    tiptap-node/      ┐
    tiptap-ui/        │ TipTap kit: editor nodes, editor UI, generic UI
    tiptap-ui-primitive/  primitives (button, avatar, popover...), icons and
    tiptap-icons/     │ node extensions. Kept where the TipTap CLI puts them.
    tiptap-extension/ ┘
  api/                Supabase data access, one file per table / RPC group
  hooks/              shared React Query hooks and generic hooks
  lib/                shared logic (query client, persistence, offline cache…)
  utils/              factories (make-page, make-thread…) and small helpers
  types/              domain types
  i18n/               i18next config and locales
  styles/             global SCSS partials
  _unused/            code nothing imports today (see below)
```

## Where does new code go?

- **Belongs to one feature** → `src/features/<feature>/`. Components, their
  SCSS, and hooks/contexts used only by that feature live together.
- **Data access** → `src/api/` + a hook in `src/hooks/` (shared by features).
- **Generic UI** (no Folio concepts) → `src/components/tiptap-ui-primitive/`.
- **An editor node or extension** → `src/components/tiptap-node/` or
  `tiptap-extension/`, unless it's a whole feature (like `database/`).
- **A pure function** → `src/lib/` (logic) or `src/utils/` (factories).

## `src/_unused/`

Files that nothing reachable from `src/main.tsx` imported when this layout was
introduced. They keep their original path under `_unused/`
(e.g. `_unused/components/tiptap-ui/comments/components/thread-sidebar.tsx`)
and still type-check. Bring one back by moving it into the right feature;
delete the folder once you're sure you don't need it.

## Finding a file from before the move

File names didn't change, only folders — search by name. `docs/MOVES.md` lists
every old path → new path.
