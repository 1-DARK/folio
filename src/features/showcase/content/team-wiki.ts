import {
  doc, title, p, h2, h3, b, i, callout, ul, columns, table, toggle, todo,
} from "./build";

// Showcase — a team wiki home page (landing hero, templates).
// Baobab Studio and everyone in it are fictional.

export const teamWiki = {
  en: doc(
    title("Baobab Studio — Team wiki"),
    callout("🌳", [p("Everything you need to know to work at Baobab Studio. Start with ", b("Onboarding"), ", then keep this page open: it links to every team's space.")], "green"),
    columns(
      [
        h3("🚀 Start here"),
        ul("Onboarding checklist", "How we work", "Tools and accounts", "Who to ask"),
      ],
      [
        h3("📚 Teams"),
        ul("Design", "Engineering", "Partnerships", "Operations"),
      ],
      [
        h3("🗓 Rituals"),
        ul("Monday planning", "Friday demos", "Monthly retro"),
      ],
    ),
    h2("How we work"),
    ul(
      [b("Write it down."), " Decisions live in pages, not in chat."],
      [b("Small, shipped, often."), " We prefer a working draft today to a perfect plan next month."],
      [b("Ask early."), " Open a comment on the page instead of waiting for a meeting."],
    ),
    h2("This month"),
    table(
      ["Project", "Owner", "Status", "Due"],
      ["Website redesign", "Awa Diop", "In progress", "Mar 28"],
      ["Partner onboarding kit", "Moussa Ndiaye", "In review", "Mar 21"],
      ["Q2 planning", "Fatou Sow", "Not started", "Apr 4"],
    ),
    h2("New here?"),
    todo(
      [true, "Get your accounts (email, Folio, calendar)"],
      [true, "Read ", i("How we work")],
      [false, "Meet your onboarding buddy"],
      [false, "Ship one small thing in your first week"],
    ),
    toggle("Office and practical info", [
      ul(
        "Open 8:30 to 18:00, Monday to Friday.",
        "Wi-Fi and printer instructions are in Tools and accounts.",
        ["Questions? Ask in the ", b("#general"), " room."],
      ),
    ]),
    p(i("Last reviewed by Ibrahima Fall. Select any passage and click Suggest to propose a change.")),
  ),

  fr: doc(
    title("Baobab Studio — Wiki d’équipe"),
    callout("🌳", [p("Tout ce qu’il faut savoir pour travailler chez Baobab Studio. Commencez par ", b("Accueil"), ", puis gardez cette page ouverte : elle mène à l’espace de chaque équipe.")], "green"),
    columns(
      [
        h3("🚀 Pour commencer"),
        ul("Liste d’accueil", "Notre façon de travailler", "Outils et comptes", "Qui contacter"),
      ],
      [
        h3("📚 Équipes"),
        ul("Design", "Développement", "Partenariats", "Opérations"),
      ],
      [
        h3("🗓 Rituels"),
        ul("Planning du lundi", "Démos du vendredi", "Rétro mensuelle"),
      ],
    ),
    h2("Notre façon de travailler"),
    ul(
      [b("On l’écrit."), " Les décisions vivent dans les pages, pas dans les discussions."],
      [b("Petit, livré, souvent."), " Mieux vaut un brouillon qui marche aujourd’hui qu’un plan parfait le mois prochain."],
      [b("On demande tôt."), " Ouvrez un commentaire sur la page au lieu d’attendre une réunion."],
    ),
    h2("Ce mois-ci"),
    table(
      ["Projet", "Responsable", "Statut", "Échéance"],
      ["Refonte du site", "Awa Diop", "En cours", "28 mars"],
      ["Kit d’accueil partenaires", "Moussa Ndiaye", "En relecture", "21 mars"],
      ["Planification T2", "Fatou Sow", "Pas commencé", "4 avril"],
    ),
    h2("Nouveau ici ?"),
    todo(
      [true, "Récupérer vos comptes (e-mail, Folio, agenda)"],
      [true, "Lire ", i("Notre façon de travailler")],
      [false, "Rencontrer votre parrain ou marraine"],
      [false, "Livrer une petite chose dès la première semaine"],
    ),
    toggle("Bureau et infos pratiques", [
      ul(
        "Ouvert de 8 h 30 à 18 h, du lundi au vendredi.",
        "Wi-Fi et imprimante : voir Outils et comptes.",
        ["Une question ? Posez-la dans le salon ", b("#général"), "."],
      ),
    ]),
    p(i("Dernière relecture par Ibrahima Fall. Sélectionnez un passage et cliquez sur Suggérer pour proposer une modification.")),
  ),
};
