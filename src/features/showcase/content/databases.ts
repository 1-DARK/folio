import {
  doc, title, p, h2, b, code, callout, ul, ol, columns, table, toggle, hl,
  type HighlightColor,
} from "./build";
import type { JSONContent } from "@tiptap/react";

// Learn guide 3 — databases. A small board and table illustrate the views;
// they're built from columns and a table so the guide works anywhere.

const card = (text: string, meta: string, color: HighlightColor = "gray"): JSONContent => ({
  ...callout("", [p(b(text)), p(meta)], color),
  attrs: {
    ...callout("", [], color).attrs,
    iconName: null,
    showIcon: false,
    bordered: true,
  },
});

export const databases = {
  en: doc(
    title("Organize anything with databases"),
    p("A database is a list of records that you can view in different ways. Tasks, reading lists, applications, a class's assignments: anything with a few properties per item."),
    callout("🧭", [p("Type ", code("/database"), " in any page to add one. Each record is also a page: open it to write notes inside.")], "blue"),
    h2("Six ways to see the same records"),
    table(
      ["View", "Best for"],
      [b("Table"), "Editing many records like a spreadsheet"],
      [b("Board"), "Following work through stages (To do, Doing, Done)"],
      [b("List"), "A clean list of pages, like a reading list"],
      [b("Gallery"), "Records with a cover image: projects, portfolios"],
      [b("Calendar"), "Anything with a date: deadlines, events, classes"],
      [b("Timeline"), "Plans with start and end dates"],
    ),
    p("Views share the same records: move a card on the board and its status changes in the table too."),
    h2("Example: a board"),
    columns(
      [p(b("To do")), card("Write the onboarding guide", "Awa · Mar 18"), card("Pick a logo", "Moussa · Mar 20")],
      [p(b("In progress")), card("Plan the launch", "Fatou · Mar 14", "yellow")],
      [p(b("Done")), card("Set up the workspace", "Ibrahima · Mar 6", "green")],
    ),
    h2("Properties"),
    p("Each column of a database is a property. Choose its type so Folio knows how to show, sort and filter it:"),
    columns(
      [ul("Text, number, checkbox", "Select, multi-select, status", "Date and person")],
      [ul("URL, email, phone", "Relation and rollup (link databases)", "Created and edited time and by")],
    ),
    h2("Filter, sort and group"),
    ol(
      [b("Filter"), " to show only what matters: ", hl("Status is not Done", "blue"), "."],
      [b("Sort"), " by any property, for example the due date."],
      [b("Group"), " records by a property to see them in sections."],
    ),
    p("Each view keeps its own filters, sorts and hidden columns, so a team can have a view per person or per week."),
    toggle("Calendar and timeline tips", [
      ul(
        "Drag an event to another day to reschedule it.",
        "Drag the edge of a bar on the timeline to change its end date.",
        "Records that span several days are drawn as one bar, and overlapping ones get their own lines.",
      ),
    ]),
  ),

  fr: doc(
    title("Tout organiser avec les bases de données"),
    p("Une base de données est une liste de fiches que l’on peut afficher de plusieurs façons. Tâches, lectures, candidatures, devoirs d’une classe : tout ce qui a quelques propriétés par élément."),
    callout("🧭", [p("Tapez ", code("/base"), " dans n’importe quelle page pour en ajouter une. Chaque fiche est aussi une page : ouvrez-la pour y écrire des notes.")], "blue"),
    h2("Six façons de voir les mêmes fiches"),
    table(
      ["Vue", "Idéale pour"],
      [b("Tableau"), "Modifier beaucoup de fiches comme dans un tableur"],
      [b("Kanban"), "Suivre le travail par étapes (À faire, En cours, Terminé)"],
      [b("Liste"), "Une liste de pages épurée, comme une liste de lectures"],
      [b("Galerie"), "Des fiches avec une image : projets, portfolios"],
      [b("Calendrier"), "Tout ce qui a une date : échéances, événements, cours"],
      [b("Chronologie"), "Des plans avec une date de début et de fin"],
    ),
    p("Les vues partagent les mêmes fiches : déplacez une carte dans le kanban et son statut change aussi dans le tableau."),
    h2("Exemple : un kanban"),
    columns(
      [p(b("À faire")), card("Écrire le guide d’accueil", "Awa · 18 mars"), card("Choisir un logo", "Moussa · 20 mars")],
      [p(b("En cours")), card("Préparer le lancement", "Fatou · 14 mars", "yellow")],
      [p(b("Terminé")), card("Créer l’espace de travail", "Ibrahima · 6 mars", "green")],
    ),
    h2("Propriétés"),
    p("Chaque colonne d’une base est une propriété. Choisissez son type pour que Folio sache l’afficher, la trier et la filtrer :"),
    columns(
      [ul("Texte, nombre, case à cocher", "Sélection, sélection multiple, statut", "Date et personne")],
      [ul("URL, e-mail, téléphone", "Relation et agrégation (lier des bases)", "Création et modification : date et auteur")],
    ),
    h2("Filtrer, trier et grouper"),
    ol(
      [b("Filtrez"), " pour ne garder que l’essentiel : ", hl("Statut n’est pas Terminé", "blue"), "."],
      [b("Triez"), " selon n’importe quelle propriété, par exemple l’échéance."],
      [b("Groupez"), " les fiches par propriété pour les voir par sections."],
    ),
    p("Chaque vue garde ses propres filtres, tris et colonnes masquées : une équipe peut avoir une vue par personne ou par semaine."),
    toggle("Astuces calendrier et chronologie", [
      ul(
        "Glissez un événement sur un autre jour pour le déplacer.",
        "Tirez le bord d’une barre de la chronologie pour changer sa date de fin.",
        "Les fiches sur plusieurs jours forment une seule barre, et celles qui se chevauchent ont leur propre ligne.",
      ),
    ]),
  ),
};
