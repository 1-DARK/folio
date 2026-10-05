// Shared look for the sidebar's Tabler icons (src/components/tiptap-icons/tabler-icons): one size and
// one thin stroke everywhere, so every row's glyph has the same weight.
//   <TbHome {...SB_ICON} />
export const SB_ICON = { size: 17, strokeWidth: 1.6 } as const;

// Smaller glyphs for the hover actions inside a row (…, +, pin).
export const SB_ICON_SM = { size: 14, strokeWidth: 1.8 } as const;
