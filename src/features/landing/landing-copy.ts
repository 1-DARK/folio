// All landing page text, French and English. Kept here (not in the app's
// translation files) so the page is one self-contained folder; the language
// itself still follows i18next, so the toggle and the app stay in sync.
//
// Positioning: Folio is a workspace for docs, wikis and resources. Schools
// and students are one audience among several, so the copy stays general —
// new products (a documentation engine, other domains) fit without a rewrite.

export type LandingLang = "fr" | "en";

export interface LandingCopy {
  nav: {
    features: string;
    templates: string;
    offline: string;
    signIn: string;
    cta: string;
    themeLight: string;
    themeDark: string;
    language: string;
  };
  hero: {
    title: string;
    lead: string;
    sub: string;
    primary: string;
    secondary: string;
    shot: string;
  };
  templates: {
    title: string;
    use: string;
    items: { title: string; body: string }[];
  };
  blocks: {
    title: string;
    sub: string;
    type: string;
    tabs: { id: string; label: string; title: string; body: string; command: string }[];
  };
  organize: {
    title: string;
    sub: string;
    shot: string;
    points: { title: string; body: string }[];
  };
  collab: {
    title: string;
    sub: string;
    cards: { title: string; body: string; shot: string }[];
  };
  offline: {
    title: string;
    sub: string;
    steps: { pill: string; text: string; tone: "online" | "offline" | "synced" }[];
  };
  roles: {
    title: string;
    items: { title: string; body: string }[];
  };
  included: {
    label: string;
    items: { title: string; body: string; shot: string }[];
  };
  final: { title: string; sub: string; primary: string; secondary: string };
  footer: { tagline: string; legal: string };
}

export const LANDING_COPY: Record<LandingLang, LandingCopy> = {
  fr: {
    nav: {
      features: "Fonctionnalités",
      templates: "Modèles",
      offline: "Hors connexion",
      signIn: "Se connecter",
      cta: "Essayer Folio",
      themeLight: "Mode clair",
      themeDark: "Mode sombre",
      language: "Langue",
    },
    hero: {
      title: "Vos docs, votre wiki et vos ressources, au même endroit",
      lead: "Simple. Flexible. Collaboratif.",
      sub: "Folio est l’espace de travail où votre équipe écrit, organise et partage tout ce qu’elle sait — des notes de réunion à la documentation, même hors connexion.",
      primary: "Commencer gratuitement",
      secondary: "Voir les fonctionnalités",
      shot: "Capture — une page de wiki avec la barre latérale, un commentaire et un collaborateur",
    },
    templates: {
      title: "Commencez avec un modèle",
      use: "Utiliser le modèle",
      items: [
        { title: "Notes de réunion", body: "Ordre du jour, décisions et actions." },
        { title: "Wiki d’équipe", body: "Tout ce que votre équipe doit savoir." },
        { title: "Suivi de projet", body: "Tâches, responsables et échéances." },
        { title: "Page de cours", body: "Leçons, équations, code et exercices." },
      ],
    },
    blocks: {
      title: "Bien plus que du texte et des puces",
      sub: "Chaque page est faite de blocs. Tapez « / » pour ajouter ce qu’il vous faut.",
      type: "Tapez",
      tabs: [
        { id: "math", label: "Équations", title: "Des formules qui s’affichent proprement", body: "Écrivez vos équations en LaTeX, en ligne ou en bloc.", command: "/équation" },
        { id: "code", label: "Code", title: "Du code lisible, avec coloration", body: "Des blocs de code pour de nombreux langages, avec copie en un clic.", command: "/code" },
        { id: "db", label: "Bases de données", title: "Une liste qui devient un outil", body: "Transformez n’importe quelle liste en base de données, puis affichez-la en tableau, kanban, calendrier, galerie ou chronologie.", command: "/base" },
        { id: "files", label: "Images et fichiers", title: "Tous vos supports au même endroit", body: "Glissez images, PDF et fichiers directement dans la page.", command: "/fichier" },
        { id: "toc", label: "Table des matières", title: "Les longues pages, sans se perdre", body: "Une table des matières qui suit vos titres et se met à jour toute seule.", command: "/sommaire" },
      ],
    },
    organize: {
      title: "Un wiki que tout le monde retrouve",
      sub: "Des espaces d’équipe pour chaque groupe, vos pages privées à part, et une recherche qui trouve tout.",
      shot: "Capture — la barre latérale avec les espaces d’équipe et la recherche",
      points: [
        { title: "Espaces d’équipe", body: "Un espace par équipe, projet ou classe, avec ses propres membres." },
        { title: "Des droits précis", body: "Choisissez qui peut lire, commenter ou modifier chaque page." },
        { title: "Recherche instantanée", body: "Ctrl P et n’importe quelle page est là." },
      ],
    },
    collab: {
      title: "Toute l’équipe sur la même page. Littéralement.",
      sub: "Écrivez à plusieurs en direct, discutez d’un passage, proposez une correction — sans jamais écraser le travail des autres.",
      cards: [
        { title: "En temps réel", body: "Voyez qui écrit quoi, au moment où ça s’écrit.", shot: "Capture — curseurs en direct" },
        { title: "Commentaires", body: "Commentez un passage précis et discutez-en sur place.", shot: "Capture — un commentaire sur du texte" },
        { title: "Suggestions", body: "Proposez une formulation ; l’auteur l’accepte en un clic.", shot: "Capture — une suggestion avec Accepter / Refuser" },
      ],
    },
    offline: {
      title: "La connexion coupe ? Continuez d’écrire.",
      sub: "Les pages déjà ouvertes restent disponibles sans internet. Vos modifications sont gardées sur votre appareil et envoyées dès que le réseau revient.",
      steps: [
        { pill: "En ligne", text: "Vous écrivez avec votre équipe, en direct.", tone: "online" },
        { pill: "Hors ligne", text: "Vous continuez. Rien n’est perdu.", tone: "offline" },
        { pill: "Synchronisé", text: "Tout part dès le retour du réseau.", tone: "synced" },
      ],
    },
    roles: {
      title: "Pour les équipes, les écoles et les communautés",
      items: [
        { title: "Équipes", body: "Wiki, documentation, réunions et projets dans un seul espace partagé." },
        { title: "Écoles et étudiants", body: "Cours, devoirs et travaux de groupe, organisés pour toute une promo." },
        { title: "Communautés et associations", body: "Ressources, décisions et vitrines de vos réalisations, au même endroit." },
      ],
    },
    included: {
      label: "Aussi inclus dans Folio",
      items: [
        { title: "Salons", body: "Des discussions par équipe ou par projet, reliées à vos pages.", shot: "Capture — un salon de discussion" },
        { title: "Vitrines", body: "Un espace où chacun publie ses travaux, que les autres peuvent commenter.", shot: "Capture — une vitrine de projets" },
      ],
    },
    final: {
      title: "Rassemblez tout ce que votre équipe sait",
      sub: "Essayez d’abord. Invitez votre équipe ensuite.",
      primary: "Commencer gratuitement",
      secondary: "Se connecter",
    },
    footer: {
      tagline: "L’espace de travail pour vos docs, votre wiki et vos ressources.",
      legal: "Confidentialité · Conditions",
    },
  },
  en: {
    nav: {
      features: "Features",
      templates: "Templates",
      offline: "Offline",
      signIn: "Log in",
      cta: "Try Folio",
      themeLight: "Light mode",
      themeDark: "Dark mode",
      language: "Language",
    },
    hero: {
      title: "Your docs, wiki and resources, all in one place",
      lead: "Simple. Flexible. Collaborative.",
      sub: "Folio is the workspace where your team writes, organizes and shares everything it knows — from meeting notes to documentation, even offline.",
      primary: "Get started free",
      secondary: "See the features",
      shot: "Screenshot — a wiki page with the sidebar, a comment and a collaborator",
    },
    templates: {
      title: "Start with a template",
      use: "Use template",
      items: [
        { title: "Meeting notes", body: "Agenda, decisions and action items." },
        { title: "Team wiki", body: "Everything your team needs to know." },
        { title: "Project tracker", body: "Tasks, owners and deadlines." },
        { title: "Course page", body: "Lessons, equations, code and exercises." },
      ],
    },
    blocks: {
      title: "Go way beyond text and bullet points",
      sub: "Every page is made of blocks. Type “/” to add whatever you need.",
      type: "Type",
      tabs: [
        { id: "math", label: "Equations", title: "Formulas that render cleanly", body: "Write equations in LaTeX, inline or as a block.", command: "/equation" },
        { id: "code", label: "Code", title: "Readable code, highlighted", body: "Code blocks for many languages, with one-click copy.", command: "/code" },
        { id: "db", label: "Databases", title: "A list that becomes a tool", body: "Turn any list into a database, then view it as a table, board, calendar, gallery or timeline.", command: "/database" },
        { id: "files", label: "Images and files", title: "All your materials in one place", body: "Drop images, PDFs and files straight into the page.", command: "/file" },
        { id: "toc", label: "Table of contents", title: "Long pages, without getting lost", body: "A table of contents that follows your headings and updates itself.", command: "/toc" },
      ],
    },
    organize: {
      title: "A wiki everyone can find their way around",
      sub: "Teamspaces for every group, your private pages on the side, and search that finds anything.",
      shot: "Screenshot — the sidebar with teamspaces and search",
      points: [
        { title: "Teamspaces", body: "One space per team, project or class, with its own members." },
        { title: "Precise permissions", body: "Choose who can view, comment on or edit each page." },
        { title: "Instant search", body: "Ctrl P and any page is right there." },
      ],
    },
    collab: {
      title: "Your whole team on the same page. Literally.",
      sub: "Write together live, discuss a passage, suggest a fix — without ever overwriting anyone’s work.",
      cards: [
        { title: "Real time", body: "See who’s writing what, as it’s written.", shot: "Screenshot — live cursors" },
        { title: "Comments", body: "Comment on a specific passage and discuss it right there.", shot: "Screenshot — a comment on text" },
        { title: "Suggestions", body: "Suggest new wording; the author accepts it in one click.", shot: "Screenshot — a suggestion with Accept / Reject" },
      ],
    },
    offline: {
      title: "Connection dropped? Keep writing.",
      sub: "Pages you’ve already opened stay available without internet. Your edits are kept on your device and sent as soon as you’re back online.",
      steps: [
        { pill: "Online", text: "You write with your team, live.", tone: "online" },
        { pill: "Offline", text: "You keep going. Nothing is lost.", tone: "offline" },
        { pill: "Synced", text: "Everything goes out when you reconnect.", tone: "synced" },
      ],
    },
    roles: {
      title: "For teams, schools and communities",
      items: [
        { title: "Teams", body: "Wiki, documentation, meetings and projects in one shared space." },
        { title: "Schools and students", body: "Courses, assignments and group work, organized for a whole class." },
        { title: "Communities and clubs", body: "Resources, decisions and showcases of your work, all together." },
      ],
    },
    included: {
      label: "Also included in Folio",
      items: [
        { title: "Rooms", body: "Discussions per team or project, linked to your pages.", shot: "Screenshot — a chat room" },
        { title: "Showcases", body: "A space where everyone publishes their work for others to comment on.", shot: "Screenshot — a project showcase" },
      ],
    },
    final: {
      title: "Bring together everything your team knows",
      sub: "Try it first. Invite your team later.",
      primary: "Get started free",
      secondary: "Log in",
    },
    footer: {
      tagline: "The workspace for your docs, wiki and resources.",
      legal: "Privacy · Terms",
    },
  },
};