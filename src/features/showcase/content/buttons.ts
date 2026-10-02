import {
  doc,
  title,
  p,
  h2,
  b,
  code,
  callout,
  ul,
  columns,
  button,
} from "./build";

// Learn guide — the button block: what it's for and how to set one up.

export const buttons = {
  en: doc(
    title("Buttons"),
    p(
      "A button is a link that looks like an action. Use it when you want ",
      "people to do one clear thing: open the onboarding page, fill in a form, ",
      "join the next meeting.",
    ),
    button("Open the Folio website", "https://folio.app"),
    h2("When to use one"),
    ul(
      [
        b("Point to the next step"),
        " at the end of a guide or a meeting note.",
      ],
      [
        b("Make a page a small home screen"),
        ": a row of buttons to the pages people open most.",
      ],
      [b("Link outside Folio"), ": a form, a calendar invite, a shared drive."],
    ),
    callout(
      "💡",
      [
        p(
          "For a link in the middle of a sentence, a plain link reads better. Keep buttons for the one action that matters on the page.",
        ),
      ],
      "yellow",
    ),
    h2("Add a button"),
    ul(
      [
        "Type ",
        code("/button"),
        " (or ",
        code("/bouton"),
        ") and press Enter.",
      ],
      [
        "Click the button or its ",
        b("settings"),
        " icon, write a label, then pick a page or paste a web address.",
      ],
      ["Drag its right edge to make it wider."],
    ),
    h2("Style it"),
    p(
      "Open the block menu from the handle on the left to change its color or alignment. A few side by side, in columns:",
    ),
    columns(
      [button("Team wiki", null, "blue")],
      [button("Projects", null, "green")],
      [button("Ask a question", null, "purple")],
    ),
    p(
      "A button without a link opens its settings when you click it in edit mode. Readers can't click it until it has a link.",
    ),
  ),
  fr: doc(
    title("Boutons"),
    p(
      "Un bouton est un lien qui ressemble à une action. Utilisez-le quand vous ",
      "voulez que les gens fassent une chose précise : ouvrir la page d'accueil ",
      "des nouveaux, remplir un formulaire, rejoindre la prochaine réunion.",
    ),
    button("Ouvrir le site de Folio", "https://folio.app"),
    h2("Quand l'utiliser"),
    ul(
      [
        b("Indiquer l'étape suivante"),
        " à la fin d'un guide ou d'un compte rendu.",
      ],
      [
        b("Faire d'une page un petit écran d'accueil"),
        " : une rangée de boutons vers les pages les plus ouvertes.",
      ],
      [
        b("Renvoyer hors de Folio"),
        " : un formulaire, une invitation, un dossier partagé.",
      ],
    ),
    callout(
      "💡",
      [
        p(
          "Pour un lien au milieu d'une phrase, un lien simple se lit mieux. Gardez les boutons pour l'action qui compte sur la page.",
        ),
      ],
      "yellow",
    ),
    h2("Ajouter un bouton"),
    ul(
      ["Tapez ", code("/bouton"), " (ou ", code("/button"), ") puis Entrée."],
      [
        "Cliquez sur le bouton ou sur son icône de ",
        b("réglages"),
        ", écrivez un libellé, puis choisissez une page ou collez une adresse web.",
      ],
      ["Tirez son bord droit pour l'élargir."],
    ),
    h2("Le mettre en forme"),
    p(
      "Ouvrez le menu du bloc depuis la poignée à gauche pour changer sa couleur ou son alignement. Plusieurs côte à côte, en colonnes :",
    ),
    columns(
      [button("Wiki de l'équipe", null, "blue")],
      [button("Projets", null, "green")],
      [button("Poser une question", null, "purple")],
    ),
    p(
      "En mode édition, un bouton sans lien ouvre ses réglages quand on clique dessus. Les lecteurs ne peuvent pas le cliquer tant qu'il n'a pas de lien.",
    ),
  ),
};
