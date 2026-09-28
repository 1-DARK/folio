import {
  doc, title, p, b, m, mathBlock, codeGroup, columns, hl,
} from "./build";
import type { JSONContent } from "@tiptap/react";

// Short documents for the landing page's "blocks" tabs: each one shows a
// single kind of block, cropped to fit a 16:9 frame.

const card = (name: string, meta: string, tag: string, color: "blue" | "green" | "purple" | "orange"): JSONContent => ({
  type: "callout",
  attrs: { iconName: null, showIcon: false, target: "Emoji", bordered: true, backgroundColor: "transparent" },
  content: [p(b(name)), p(meta), p(hl(tag, color))],
});

export const snippets = {
  math: {
    en: doc(
      title("Physics — Kinematics"),
      p("With constant acceleration ", m("a"), ", position after time ", m("t"), " is:"),
      mathBlock("x(t) = x_0 + v_0 t + \\tfrac{1}{2} a t^2"),
      p("Eliminating ", m("t"), " gives the handy relation:"),
      mathBlock("v^2 = v_0^2 + 2a\\,(x - x_0)"),
    ),
    fr: doc(
      title("Physique — Cinématique"),
      p("À accélération constante ", m("a"), ", la position au temps ", m("t"), " vaut :"),
      mathBlock("x(t) = x_0 + v_0 t + \\tfrac{1}{2} a t^2"),
      p("En éliminant ", m("t"), ", on obtient la relation utile :"),
      mathBlock("v^2 = v_0^2 + 2a\\,(x - x_0)"),
    ),
  },
  code: {
    en: doc(
      title("Snippets — Remove duplicates"),
      p("Keep the first occurrence of each item, in order."),
      codeGroup(
        { language: "javascript", code: "const unique = [...new Set(items)];" },
        { language: "python", code: "unique = list(dict.fromkeys(items))" },
        { language: "bash", code: "awk '!seen[$0]++' items.txt" },
      ),
    ),
    fr: doc(
      title("Extraits — Supprimer les doublons"),
      p("Garder la première occurrence de chaque élément, dans l’ordre."),
      codeGroup(
        { language: "javascript", code: "const uniques = [...new Set(elements)];" },
        { language: "python", code: "uniques = list(dict.fromkeys(elements))" },
        { language: "bash", code: "awk '!vu[$0]++' elements.txt" },
      ),
    ),
  },
  db: {
    en: doc(
      title("Website launch"),
      columns(
        [p(b("To do")), card("Write the FAQ", "Moussa · Apr 2", "Content", "purple"), card("Press kit", "Fatou · Apr 8", "Marketing", "orange")],
        [p(b("In progress")), card("Home page design", "Awa · Mar 28", "Design", "blue")],
        [p(b("Done")), card("Contact form", "Ibrahima · Mar 30", "Engineering", "green")],
      ),
    ),
    fr: doc(
      title("Lancement du site"),
      columns(
        [p(b("À faire")), card("Rédiger la FAQ", "Moussa · 2 avr.", "Contenu", "purple"), card("Dossier de presse", "Fatou · 8 avr.", "Marketing", "orange")],
        [p(b("En cours")), card("Maquette de l’accueil", "Awa · 28 mars", "Design", "blue")],
        [p(b("Terminé")), card("Formulaire de contact", "Ibrahima · 30 mars", "Développement", "green")],
      ),
    ),
  },
};
