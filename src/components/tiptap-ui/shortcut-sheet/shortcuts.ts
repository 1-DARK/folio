// Every shortcut the sheet lists, in English and French. Only shortcuts the
// app really binds (TipTap's defaults, Folio's own nodes and global keys).
//
// Keys: "Mod" is Ctrl (⌘ on a Mac), "Alt" is Alt (⌥). A `typed` entry is
// Markdown typed at the start of a line, shown as code.

export type Lang = "en" | "fr";
type Text = Record<Lang, string>;

export interface Shortcut {
  label: Text;
  keys?: string[];
  typed?: string;
}

export interface ShortcutSection {
  id: string;
  title: Text;
  items: Shortcut[];
}

const s = (en: string, fr: string): Text => ({ en, fr });

export const SHORTCUT_SECTIONS: ShortcutSection[] = [
  {
    id: "general",
    title: s("General", "Général"),
    items: [
      {
        label: s("Keyboard shortcuts", "Raccourcis clavier"),
        keys: ["Mod", "/"],
      },
      { label: s("Quick open", "Ouverture rapide"), keys: ["Mod", "P"] },
      {
        label: s("Find in pages", "Rechercher dans les pages"),
        keys: ["Mod", "Shift", "F"],
      },
      { label: s("Undo", "Annuler"), keys: ["Mod", "Z"] },
      { label: s("Redo", "Rétablir"), keys: ["Mod", "Shift", "Z"] },
      {
        label: s("Paste as plain text", "Coller en texte brut"),
        keys: ["Mod", "Shift", "V"],
      },
    ],
  },
  {
    id: "text",
    title: s("Text", "Texte"),
    items: [
      { label: s("Bold", "Gras"), keys: ["Mod", "B"] },
      { label: s("Italic", "Italique"), keys: ["Mod", "I"] },
      { label: s("Underline", "Souligné"), keys: ["Mod", "U"] },
      { label: s("Strikethrough", "Barré"), keys: ["Mod", "Shift", "S"] },
      { label: s("Inline code", "Code en ligne"), keys: ["Mod", "E"] },
      { label: s("Highlight", "Surligner"), keys: ["Mod", "Shift", "H"] },
      { label: s("Superscript", "Exposant"), keys: ["Mod", "."] },
      { label: s("Subscript", "Indice"), keys: ["Mod", ","] },
      { label: s("Line break", "Saut de ligne"), keys: ["Shift", "Enter"] },
      {
        label: s("Align left", "Aligner à gauche"),
        keys: ["Mod", "Shift", "L"],
      },
      { label: s("Center", "Centrer"), keys: ["Mod", "Shift", "E"] },
      {
        label: s("Align right", "Aligner à droite"),
        keys: ["Mod", "Shift", "R"],
      },
    ],
  },
  {
    id: "blocks",
    title: s("Blocks", "Blocs"),
    items: [
      { label: s("Text", "Texte"), keys: ["Mod", "Alt", "0"] },
      { label: s("Heading 1–3", "Titre 1 à 3"), keys: ["Mod", "Alt", "1–3"] },
      { label: s("Bullet list", "Liste à puces"), keys: ["Mod", "Shift", "8"] },
      {
        label: s("Numbered list", "Liste numérotée"),
        keys: ["Mod", "Shift", "7"],
      },
      {
        label: s("To-do list", "Liste de tâches"),
        keys: ["Mod", "Shift", "9"],
      },
      { label: s("Quote", "Citation"), keys: ["Mod", "Shift", "B"] },
      { label: s("Code block", "Bloc de code"), keys: ["Mod", "Alt", "C"] },
      {
        label: s("Indent a list item", "Décaler un élément à droite"),
        keys: ["Tab"],
      },
      {
        label: s("Outdent a list item", "Décaler un élément à gauche"),
        keys: ["Shift", "Tab"],
      },
      { label: s("Insert a block", "Insérer un bloc"), typed: "/" },
      {
        label: s(
          "Mention a person, page or date",
          "Mentionner une personne, une page ou une date",
        ),
        typed: "@",
      },
      { label: s("Emoji", "Emoji"), typed: ":" },
    ],
  },
  {
    id: "markdown",
    title: s("Markdown as you type", "Markdown à la frappe"),
    items: [
      { label: s("Heading 1, 2, 3", "Titre 1, 2, 3"), typed: "# ## ###" },
      { label: s("Bullet list", "Liste à puces"), typed: "- " },
      { label: s("Numbered list", "Liste numérotée"), typed: "1. " },
      { label: s("To-do", "Tâche"), typed: "[] " },
      { label: s("Quote", "Citation"), typed: "> " },
      { label: s("Code block", "Bloc de code"), typed: "```" },
      { label: s("Separator", "Séparateur"), typed: "---" },
      { label: s("Inline equation", "Équation en ligne"), typed: "$x^2$" },
      { label: s("Block equation", "Équation en bloc"), typed: "$$ " },
      {
        label: s("Bold, italic, code", "Gras, italique, code"),
        typed: "**b** _i_ `c`",
      },
    ],
  },
  {
    id: "moving",
    title: s("Moving blocks", "Déplacer des blocs"),
    items: [
      {
        label: s("Open the block menu", "Ouvrir le menu du bloc"),
        typed: "⋮⋮",
      },
      {
        label: s(
          "Select several blocks: Shift+click their handles",
          "Sélectionner plusieurs blocs : Maj+clic sur leurs poignées",
        ),
        keys: ["Shift", "Click"],
      },
      {
        label: s("Delete the selected block", "Supprimer le bloc sélectionné"),
        keys: ["Backspace"],
      },
      {
        label: s("Move a tab left / right", "Déplacer un onglet"),
        keys: ["Alt", "← →"],
      },
      {
        label: s("Leave a callout", "Sortir d'un encadré"),
        keys: ["Mod", "Enter"],
      },
    ],
  },
];
