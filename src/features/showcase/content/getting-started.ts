import {
  doc, title, p, h2, h3, b, code, callout, ul, ol, todo, columns, table,
  toggle, hr,
} from "./build";

// Learn guide 1 — the first page a new member opens.

export const gettingStarted = {
  en: doc(
    title("Getting started with Folio"),
    p(
      "Folio is one place for everything your team knows: notes, docs, a wiki, ",
      "projects and the files that go with them. Everything is a ",
      b("page"),
      ", and every page is made of ",
      b("blocks"),
      ".",
    ),
    callout(
      "👋",
      [p("This guide takes about four minutes. Try each step in a page of your own as you read.")],
      "blue",
    ),
    h2("1. Create a page"),
    p("Click ", b("New page"), " in the sidebar, give it a title, and start typing. There's no save button: Folio saves as you write."),
    h2("2. Add blocks"),
    p("Type ", code("/"), " on an empty line to open the block menu, then pick what you need:"),
    columns(
      [
        h3("Write"),
        ul("Headings, lists and to-dos", "Callouts and quotes", "Toggles that hide details"),
      ],
      [
        h3("Structure"),
        ul("Tables and databases", "Columns and tabs", "Equations and code"),
      ],
    ),
    p("Prefer the keyboard? Type ", code("# "), " for a heading, ", code("- "), " for a list or ", code("[] "), " for a to-do."),
    h2("3. Organize your pages"),
    ul(
      [b("Nest pages"), " inside each other to build a wiki: a page can hold as many sub-pages as you like."],
      [b("Favorite"), " the pages you open every day so they stay at the top of the sidebar."],
      [b("Teamspaces"), " group the pages of a team, a project or a class, with their own members."],
    ),
    h2("4. Find anything"),
    table(
      ["Shortcut", "What it does"],
      [code("Ctrl P"), "Open any page by its title"],
      [code("Ctrl Shift F"), "Search inside all your pages"],
      [code("/"), "Add a block"],
      [code("@"), "Mention a person or link a page"],
    ),
    h2("5. Invite your team"),
    p("Open ", b("Share"), " at the top of a page to choose who can view, comment on or edit it. Teammates see each other's cursors live."),
    hr(),
    h2("Your checklist"),
    todo(
      [true, "Read this guide"],
      [false, "Create your first page"],
      [false, "Add a callout, a to-do list and a table"],
      [false, "Move the page into a teamspace"],
      [false, "Share it with one teammate"],
    ),
    toggle("What's next?", [
      ol(
        [b("Write with blocks"), ": every block, with examples."],
        [b("Organize anything with databases"), ": turn lists into trackers."],
        [b("Work together"), ": comments, suggestions and chat."],
      ),
    ]),
  ),

  fr: doc(
    title("Bien démarrer avec Folio"),
    p(
      "Folio réunit tout ce que votre équipe sait : notes, documents, wiki, ",
      "projets et les fichiers qui vont avec. Tout est une ",
      b("page"),
      ", et chaque page est faite de ",
      b("blocs"),
      ".",
    ),
    callout(
      "👋",
      [p("Ce guide prend environ quatre minutes. Essayez chaque étape dans une page à vous pendant la lecture.")],
      "blue",
    ),
    h2("1. Créez une page"),
    p("Cliquez sur ", b("Nouvelle page"), " dans la barre latérale, donnez-lui un titre et commencez à écrire. Pas de bouton Enregistrer : Folio enregistre au fil de l’écriture."),
    h2("2. Ajoutez des blocs"),
    p("Tapez ", code("/"), " sur une ligne vide pour ouvrir le menu des blocs, puis choisissez :"),
    columns(
      [
        h3("Écrire"),
        ul("Titres, listes et cases à cocher", "Encadrés et citations", "Blocs repliables pour les détails"),
      ],
      [
        h3("Structurer"),
        ul("Tableaux et bases de données", "Colonnes et onglets", "Équations et code"),
      ],
    ),
    p("Plutôt clavier ? Tapez ", code("# "), " pour un titre, ", code("- "), " pour une liste ou ", code("[] "), " pour une case à cocher."),
    h2("3. Organisez vos pages"),
    ul(
      [b("Imbriquez les pages"), " pour construire un wiki : une page peut contenir autant de sous-pages que vous voulez."],
      [b("Ajoutez aux favoris"), " les pages que vous ouvrez tous les jours, elles restent en haut de la barre latérale."],
      [b("Les espaces d’équipe"), " regroupent les pages d’une équipe, d’un projet ou d’une classe, avec leurs propres membres."],
    ),
    h2("4. Retrouvez tout"),
    table(
      ["Raccourci", "Action"],
      [code("Ctrl P"), "Ouvrir une page par son titre"],
      [code("Ctrl Maj F"), "Chercher dans toutes vos pages"],
      [code("/"), "Ajouter un bloc"],
      [code("@"), "Mentionner une personne ou lier une page"],
    ),
    h2("5. Invitez votre équipe"),
    p("Ouvrez ", b("Partager"), " en haut d’une page pour choisir qui peut la lire, la commenter ou la modifier. Chacun voit les curseurs des autres en direct."),
    hr(),
    h2("Votre liste"),
    todo(
      [true, "Lire ce guide"],
      [false, "Créer votre première page"],
      [false, "Ajouter un encadré, une liste de tâches et un tableau"],
      [false, "Déplacer la page dans un espace d’équipe"],
      [false, "La partager avec un collègue"],
    ),
    toggle("Et ensuite ?", [
      ol(
        [b("Écrire avec des blocs"), " : tous les blocs, avec des exemples."],
        [b("Tout organiser avec les bases de données"), " : transformez vos listes en outils de suivi."],
        [b("Travailler ensemble"), " : commentaires, suggestions et discussions."],
      ),
    ]),
  ),
};

