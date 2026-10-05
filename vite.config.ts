import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { visualizer } from "rollup-plugin-visualizer";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), visualizer({ open: true, gzipSize: true })],
  build: {
    rollupOptions: {
      output: {
        // Big libraries get their own chunks, so a page that doesn't need
        // one doesn't download it, and they stay cached across deploys.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (
            id.includes("/mathjs/") ||
            id.includes("/decimal.js/") ||
            id.includes("/complex.js/") ||
            id.includes("/fraction.js/")
          )
            return "vendor-mathjs";
          if (id.includes("/lodash")) return "vendor-lodash";
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      src: resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      "/threads-api": {
        target: "http://localhost:3002",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/threads-api/, ""),
      },
    },
  },
  optimizeDeps: {
    // NOT pre-bundled: lucide-react/dynamic holds a lazy import for every
    // Lucide icon. Bundled together with lucide-react, the bundler split all
    // ~1,670 icons into separate shared files, and every plain
    // `import { X } from "lucide-react"` then loaded ALL of them on startup
    // (~1,800 requests, the long spinner in dev). Served as-is instead, it
    // only fetches the icons actually shown.
    exclude: ["lucide-react/dynamic"],
    // Pre-bundle every dependency the app imports, up front. Anything left
    // out is found later, when a lazily loaded part of the app (a database,
    // the formula editor, code blocks…) first imports it: Vite then
    // re-optimizes and RELOADS the page mid-load (content shows, goes
    // blank, then loads again).
    include: [
      "@codemirror/autocomplete",
      "@codemirror/commands",
      "@codemirror/language",
      "@codemirror/state",
      "@codemirror/view",
      "@dnd-kit/core",
      "@dnd-kit/sortable",
      "@dnd-kit/utilities",
      "@floating-ui/dom",
      "@floating-ui/react",
      "@hocuspocus/provider",
      "@lezer/highlight",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-popover",
      "@supabase/supabase-js",
      "@tanstack/query-async-storage-persister",
      "@tanstack/react-location",
      "@tanstack/react-query",
      "@tanstack/react-query-devtools",
      "@tanstack/react-query-persist-client",
      "@tanstack/react-virtual",
      "@tiptap/core",
      "@tiptap/extension-code-block-lowlight",
      "@tiptap/extension-collaboration",
      "@tiptap/extension-collaboration-caret",
      "@tiptap/extension-document",
      "@tiptap/extension-drag-handle",
      "@tiptap/extension-emoji",
      "@tiptap/extension-highlight",
      "@tiptap/extension-horizontal-rule",
      "@tiptap/extension-image",
      "@tiptap/extension-list",
      "@tiptap/extension-mention",
      "@tiptap/extension-node-range",
      "@tiptap/extension-paragraph",
      "@tiptap/extension-placeholder",
      "@tiptap/extension-subscript",
      "@tiptap/extension-superscript",
      "@tiptap/extension-table",
      "@tiptap/extension-table-of-contents",
      "@tiptap/extension-text",
      "@tiptap/extension-text-align",
      "@tiptap/extension-text-style",
      "@tiptap/extension-typography",
      "@tiptap/extension-unique-id",
      "@tiptap/extension-youtube",
      "@tiptap/extensions",
      "@tiptap/pm/model",
      "@tiptap/pm/state",
      "@tiptap/pm/tables",
      "@tiptap/pm/view",
      "@tiptap/react",
      "@tiptap/react/menus",
      "@tiptap/starter-kit",
      "@tiptap/suggestion",
      "@tiptap/y-tiptap",
      "clsx",
      "diff",
      "docx",
      "highlight.js/lib/languages/bash",
      "highlight.js/lib/languages/c",
      "highlight.js/lib/languages/cpp",
      "highlight.js/lib/languages/css",
      "highlight.js/lib/languages/go",
      "highlight.js/lib/languages/java",
      "highlight.js/lib/languages/javascript",
      "highlight.js/lib/languages/json",
      "highlight.js/lib/languages/markdown",
      "highlight.js/lib/languages/python",
      "highlight.js/lib/languages/rust",
      "highlight.js/lib/languages/scss",
      "highlight.js/lib/languages/sql",
      "highlight.js/lib/languages/typescript",
      "highlight.js/lib/languages/xml",
      "highlight.js/lib/languages/yaml",
      "i18next",
      "i18next-browser-languagedetector",
      "katex",
      "lodash",
      "lowlight",
      "lucide-react",
      "marked",
      "mathjs",
      "nanoid",
      "pdfjs-dist",
      "prosemirror-state",
      "prosemirror-tables",
      "react",
      "react-dom",
      "react-dom/client",
      "react-hotkeys-hook",
      "react-i18next",
      "react/jsx-dev-runtime",
      "react/jsx-runtime",
      "tippy.js",
      "use-debounce",
      "uuid",
      "y-protocols/awareness",
      "yjs",
    ],
  },
});
