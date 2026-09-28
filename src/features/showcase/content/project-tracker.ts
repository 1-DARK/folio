import type { JSONContent } from "@tiptap/react";
import {
  doc, title, p, h2, b, callout, columns, table, hl, ul,
  type HighlightColor,
} from "./build";

// Showcase — a project tracker (landing templates + databases tab).
// Drawn with a table and columns of cards so it renders anywhere; in the app
// the same tracker is a database with table, board and timeline views.

const card = (
  name: string,
  meta: string,
  tag: string,
  color: HighlightColor = "gray",
): JSONContent => ({
  type: "callout",
  attrs: {
    iconName: null,
    showIcon: false,
    target: "Emoji",
    bordered: true,
    backgroundColor: "transparent",
  },
  content: [p(b(name)), p(meta), p(hl(tag, color))],
});

export const projectTracker = {
  en: doc(
    title("Website launch — Project tracker"),
    callout("🎯", [p(b("Goal:"), " launch the new website on April 15. Owners update their cards every Monday.")], "blue"),
    h2("Board"),
    columns(
      [
        p(b("To do · 2")),
        card("Write the FAQ", "Moussa · Apr 2", "Content", "purple"),
        card("Press kit", "Fatou · Apr 8", "Marketing", "orange"),
      ],
      [
        p(b("In progress · 2")),
        card("Home page design", "Awa · Mar 28", "Design", "blue"),
        card("Contact form", "Ibrahima · Mar 30", "Engineering", "green"),
      ],
      [
        p(b("Done · 2")),
        card("Pick the domain", "Fatou · Mar 10", "Operations", "yellow"),
        card("Site map", "Awa · Mar 14", "Design", "blue"),
      ],
    ),
    h2("All tasks"),
    table(
      ["Task", "Owner", "Status", "Start", "Due"],
      ["Pick the domain", "Fatou", "Done", "Mar 3", "Mar 10"],
      ["Site map", "Awa", "Done", "Mar 7", "Mar 14"],
      ["Home page design", "Awa", "In progress", "Mar 15", "Mar 28"],
      ["Contact form", "Ibrahima", "In progress", "Mar 20", "Mar 30"],
      ["Write the FAQ", "Moussa", "To do", "Mar 27", "Apr 2"],
      ["Press kit", "Fatou", "To do", "Apr 1", "Apr 8"],
    ),
    h2("Milestones"),
    ul(
      [b("Mar 14"), " — structure approved"],
      [b("Apr 2"), " — content complete"],
      [b("Apr 15"), " — launch"],
    ),
  ),

  fr: doc(
    title("Lancement du site — Suivi de projet"),
    callout("🎯", [p(b("Objectif :"), " mettre en ligne le nouveau site le 15 avril. Chacun met ses cartes à jour le lundi.")], "blue"),
    h2("Kanban"),
    columns(
      [
        p(b("À faire · 2")),
        card("Rédiger la FAQ", "Moussa · 2 avr.", "Contenu", "purple"),
        card("Dossier de presse", "Fatou · 8 avr.", "Marketing", "orange"),
      ],
      [
        p(b("En cours · 2")),
        card("Maquette de l’accueil", "Awa · 28 mars", "Design", "blue"),
        card("Formulaire de contact", "Ibrahima · 30 mars", "Développement", "green"),
      ],
      [
        p(b("Terminé · 2")),
        card("Choisir le domaine", "Fatou · 10 mars", "Opérations", "yellow"),
        card("Plan du site", "Awa · 14 mars", "Design", "blue"),
      ],
    ),
    h2("Toutes les tâches"),
    table(
      ["Tâche", "Responsable", "Statut", "Début", "Échéance"],
      ["Choisir le domaine", "Fatou", "Terminé", "3 mars", "10 mars"],
      ["Plan du site", "Awa", "Terminé", "7 mars", "14 mars"],
      ["Maquette de l’accueil", "Awa", "En cours", "15 mars", "28 mars"],
      ["Formulaire de contact", "Ibrahima", "En cours", "20 mars", "30 mars"],
      ["Rédiger la FAQ", "Moussa", "À faire", "27 mars", "2 avr."],
      ["Dossier de presse", "Fatou", "À faire", "1er avr.", "8 avr."],
    ),
    h2("Jalons"),
    ul(
      [b("14 mars"), " — structure validée"],
      [b("2 avril"), " — contenus terminés"],
      [b("15 avril"), " — mise en ligne"],
    ),
  ),
};
