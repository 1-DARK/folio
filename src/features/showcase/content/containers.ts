import {
  doc,
  title,
  p,
  h2,
  h3,
  b,
  code,
  callout,
  ul,
  todo,
  columns,
  container,
  button,
} from "./build";

// Learn guide — the container block: a box that groups other blocks.

export const containers = {
  en: doc(
    title("Containers"),
    p(
      "A container is a box you put other blocks in. Everything inside moves, ",
      "gets colored and gets resized together, so a group of blocks behaves like one.",
    ),
    container(
      [
        h3("This is a container"),
        p("It holds a heading, this paragraph and a to-do list:"),
        todo([true, "Group related blocks"], [false, "Give the group a color"]),
      ],
      "blue",
    ),
    h2("When to use one"),
    ul(
      [
        b("Frame a section"),
        " so it stands apart from the rest of the page: a summary, a sign-up block, contact details.",
      ],
      [b("Build cards"), ": a container per column makes a row of cards."],
      [
        b("Move a group in one go"),
        ": drag the container's handle and everything inside follows.",
      ],
    ),
    callout(
      "💡",
      [
        p(
          "For one short message, a callout is simpler. Use a container when the group holds several blocks of different kinds.",
        ),
      ],
      "yellow",
    ),
    h2("Add a container"),
    ul(
      [
        "Type ",
        code("/container"),
        " (or ",
        code("/conteneur"),
        ") and press Enter.",
      ],
      ["Write inside it, or drag existing blocks into it."],
      [
        "Drag its right edge to make it narrower; set its color and alignment from the block menu.",
      ],
    ),
    h2("Cards, side by side"),
    columns(
      [
        container(
          [
            h3("Plan"),
            p("Goals and dates for the term."),
            button("Open", null),
          ],
          "green",
        ),
      ],
      [
        container(
          [h3("Notes"), p("Every class, one page each."), button("Open", null)],
          "purple",
        ),
      ],
      [
        container(
          [h3("Help"), p("Ask the team a question."), button("Open", null)],
          "orange",
        ),
      ],
    ),
  ),
  fr: doc(
    title("Conteneurs"),
    p(
      "Un conteneur est une boîte dans laquelle on place d'autres blocs. Tout ce ",
      "qu'il contient se déplace, se colore et se redimensionne ensemble : un ",
      "groupe de blocs se comporte comme un seul.",
    ),
    container(
      [
        h3("Ceci est un conteneur"),
        p("Il contient un titre, ce paragraphe et une liste de tâches :"),
        todo(
          [true, "Regrouper des blocs liés"],
          [false, "Donner une couleur au groupe"],
        ),
      ],
      "blue",
    ),
    h2("Quand l'utiliser"),
    ul(
      [
        b("Encadrer une section"),
        " pour la détacher du reste de la page : un résumé, un bloc d'inscription, des coordonnées.",
      ],
      [
        b("Faire des cartes"),
        " : un conteneur par colonne donne une rangée de cartes.",
      ],
      [
        b("Déplacer un groupe d'un coup"),
        " : tirez la poignée du conteneur et tout son contenu suit.",
      ],
    ),
    callout(
      "💡",
      [
        p(
          "Pour un message court, un encadré est plus simple. Prenez un conteneur quand le groupe réunit plusieurs blocs de types différents.",
        ),
      ],
      "yellow",
    ),
    h2("Ajouter un conteneur"),
    ul(
      [
        "Tapez ",
        code("/conteneur"),
        " (ou ",
        code("/container"),
        ") puis Entrée.",
      ],
      ["Écrivez dedans, ou faites-y glisser des blocs existants."],
      [
        "Tirez son bord droit pour le rétrécir ; choisissez sa couleur et son alignement dans le menu du bloc.",
      ],
    ),
    h2("Des cartes côte à côte"),
    columns(
      [
        container(
          [
            h3("Programme"),
            p("Objectifs et dates du trimestre."),
            button("Ouvrir", null),
          ],
          "green",
        ),
      ],
      [
        container(
          [h3("Notes"), p("Chaque cours, une page."), button("Ouvrir", null)],
          "purple",
        ),
      ],
      [
        container(
          [
            h3("Aide"),
            p("Poser une question à l'équipe."),
            button("Ouvrir", null),
          ],
          "orange",
        ),
      ],
    ),
  ),
};
