import {
  doc, title, p, h2, b, code, hl, s, callout, ul, ol, columns, table, h3, toggle,
} from "./build";

// Learn guide 4 — working together.

export const collaborate = {
  en: doc(
    title("Work together: comments, suggestions and rooms"),
    p("Folio is built for writing as a group. Several people can edit the same page at once, discuss a passage right where it is, and keep decisions next to the work."),
    h2("Share a page"),
    p("Click ", b("Share"), " at the top of a page and choose, for each person or for the whole workspace:"),
    table(
      ["Access", "They can"],
      [b("Can view"), "Read the page"],
      [b("Can comment"), "Read, comment and suggest changes"],
      [b("Can edit"), "Change anything on the page"],
    ),
    p("Pages in a teamspace are shared with its members automatically."),
    h2("Edit at the same time"),
    p("Everyone sees each other's cursors and changes live. The faces at the top of the page show who's there right now."),
    h2("Comment on a passage"),
    ol(
      "Select some text.",
      ["Click ", b("Comment"), " in the toolbar that appears."],
      "Write your comment. The passage stays highlighted until the thread is resolved.",
    ),
    p("Type ", code("@"), " in a comment to mention someone: they get a notification in their inbox. All the threads of a page are in the ", b("discussion pane"), "."),
    h2("Suggest a change"),
    p("Rather than editing someone else's text, select it and click ", b("Suggest"), ". Write the new wording; the author sees both and accepts or rejects it in one click."),
    callout("✍️", [p("Suggested: ", s("We will meet every week"), " → ", hl("We meet every Monday at 10:00", "green"))], "gray"),
    h2("Talk in rooms"),
    columns(
      [h3("Rooms"), p("A chat room per team or project, with mentions, replies, reactions and attachments.")],
      [h3("Share a block"), p("Send any block of a page into a room to discuss it; the room keeps a link back to the page.")],
    ),
    h2("Nothing gets lost"),
    ul(
      [b("Version history"), " keeps earlier versions of a page so you can compare and restore them."],
      [b("Offline"), ": keep writing without a connection; your changes are sent when you're back online."],
      [b("Trash"), ": deleted pages can be restored until the trash is emptied."],
    ),
    toggle("Good habits for a shared wiki", [
      ul(
        "One topic per page, with a clear title.",
        "Resolve a thread once it's settled, so open threads mean open questions.",
        "Prefer suggestions over editing someone's text directly.",
      ),
    ]),
  ),

  fr: doc(
    title("Travailler ensemble : commentaires, suggestions et salons"),
    p("Folio est fait pour écrire à plusieurs. Plusieurs personnes peuvent modifier une même page en même temps, discuter d’un passage à l’endroit même où il se trouve, et garder les décisions à côté du travail."),
    h2("Partagez une page"),
    p("Cliquez sur ", b("Partager"), " en haut d’une page et choisissez, pour chaque personne ou pour tout l’espace de travail :"),
    table(
      ["Accès", "La personne peut"],
      [b("Lecture"), "Lire la page"],
      [b("Commentaire"), "Lire, commenter et proposer des modifications"],
      [b("Modification"), "Tout modifier sur la page"],
    ),
    p("Les pages d’un espace d’équipe sont automatiquement partagées avec ses membres."),
    h2("Modifiez en même temps"),
    p("Chacun voit les curseurs et les modifications des autres en direct. Les avatars en haut de la page montrent qui est là en ce moment."),
    h2("Commentez un passage"),
    ol(
      "Sélectionnez du texte.",
      ["Cliquez sur ", b("Commenter"), " dans la barre qui apparaît."],
      "Écrivez votre commentaire. Le passage reste surligné jusqu’à ce que la discussion soit résolue.",
    ),
    p("Tapez ", code("@"), " dans un commentaire pour mentionner quelqu’un : la personne reçoit une notification. Toutes les discussions d’une page sont dans le ", b("volet des discussions"), "."),
    h2("Proposez une modification"),
    p("Plutôt que de modifier le texte de quelqu’un, sélectionnez-le et cliquez sur ", b("Suggérer"), ". Écrivez la nouvelle formulation ; l’auteur voit les deux et accepte ou refuse en un clic."),
    callout("✍️", [p("Suggestion : ", s("Nous nous réunirons chaque semaine"), " → ", hl("Réunion chaque lundi à 10 h", "green"))], "gray"),
    h2("Discutez dans les salons"),
    columns(
      [h3("Salons"), p("Un salon de discussion par équipe ou par projet, avec mentions, réponses, réactions et pièces jointes.")],
      [h3("Partager un bloc"), p("Envoyez n’importe quel bloc d’une page dans un salon pour en discuter ; le salon garde un lien vers la page.")],
    ),
    h2("Rien ne se perd"),
    ul(
      [b("L’historique des versions"), " garde les versions précédentes d’une page pour les comparer et les restaurer."],
      [b("Hors connexion"), " : continuez d’écrire sans réseau ; vos modifications partent dès le retour de la connexion."],
      [b("La corbeille"), " : les pages supprimées se restaurent tant que la corbeille n’est pas vidée."],
    ),
    toggle("Bonnes habitudes pour un wiki partagé", [
      ul(
        "Un sujet par page, avec un titre clair.",
        "Résolvez une discussion une fois tranchée : une discussion ouverte, c’est une question ouverte.",
        "Préférez les suggestions à la modification directe du texte d’un autre.",
      ),
    ]),
  ),
};
