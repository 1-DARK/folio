import {
  doc, title, p, h2, b, i, callout, ul, ol, todo, columns, h3, toggle,
} from "./build";

// Showcase — weekly meeting notes (landing templates + blocks tab).

export const meetingNotes = {
  en: doc(
    title("Weekly sync — March 17"),
    columns(
      [p(b("Date: "), "Monday, March 17 · 10:00"), p(b("Where: "), "Room 2 and online")],
      [p(b("Attendees: "), "Awa, Moussa, Fatou, Ibrahima"), p(b("Notes by: "), "Fatou")],
    ),
    h2("Agenda"),
    ol("Launch status", "Partner onboarding kit", "Hiring an intern"),
    h2("Notes"),
    h3("1. Launch status"),
    ul(
      "Home page design is 80% done; review on Thursday.",
      "The contact form needs a spam filter before launch.",
    ),
    h3("2. Partner onboarding kit"),
    ul("First draft is in review. Two partners agreed to test it."),
    h3("3. Hiring an intern"),
    ul("We'll open the position on April 1, for three months."),
    h2("Decisions"),
    callout("✅", [
      p("Launch date stays ", b("April 15"), "."),
      p("The FAQ goes live with the site, not after."),
    ], "green"),
    h2("Action items"),
    todo(
      [false, b("Awa"), " — share the home page mockup by Wednesday"],
      [false, b("Ibrahima"), " — add a spam filter to the contact form"],
      [true, b("Moussa"), " — send the kit to the two test partners"],
      [false, b("Fatou"), " — write the internship offer"],
    ),
    toggle("Parking lot", [p(i("Ideas to discuss later: a newsletter, a partner showcase page."))]),
  ),

  fr: doc(
    title("Point hebdo — 17 mars"),
    columns(
      [p(b("Date : "), "lundi 17 mars · 10 h"), p(b("Lieu : "), "Salle 2 et en ligne")],
      [p(b("Présents : "), "Awa, Moussa, Fatou, Ibrahima"), p(b("Compte rendu : "), "Fatou")],
    ),
    h2("Ordre du jour"),
    ol("Avancement du lancement", "Kit d’accueil partenaires", "Recrutement d’un stagiaire"),
    h2("Notes"),
    h3("1. Avancement du lancement"),
    ul(
      "La maquette de l’accueil est faite à 80 % ; relecture jeudi.",
      "Le formulaire de contact a besoin d’un filtre anti-spam avant le lancement.",
    ),
    h3("2. Kit d’accueil partenaires"),
    ul("Le premier jet est en relecture. Deux partenaires ont accepté de le tester."),
    h3("3. Recrutement d’un stagiaire"),
    ul("Le poste ouvre le 1er avril, pour trois mois."),
    h2("Décisions"),
    callout("✅", [
      p("La date de lancement reste le ", b("15 avril"), "."),
      p("La FAQ sort avec le site, pas après."),
    ], "green"),
    h2("Actions"),
    todo(
      [false, b("Awa"), " — partager la maquette de l’accueil d’ici mercredi"],
      [false, b("Ibrahima"), " — ajouter un filtre anti-spam au formulaire"],
      [true, b("Moussa"), " — envoyer le kit aux deux partenaires testeurs"],
      [false, b("Fatou"), " — rédiger l’offre de stage"],
    ),
    toggle("En attente", [p(i("Idées à discuter plus tard : une newsletter, une page vitrine des partenaires."))]),
  ),
};
