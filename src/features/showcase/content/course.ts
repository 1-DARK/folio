import {
  doc, title, p, h2, b, i, m, callout, ol, mathBlock, codeGroup, toggle,
  table, columns,
} from "./build";

// Showcase — a course page with equations and code (landing blocks tabs,
// schools). The course and exercise are illustrative.

export const course = {
  en: doc(
    title("Linear algebra — Week 3: Eigenvalues"),
    callout("📌", [p(b("Due Friday:"), " exercises 1 to 4. Work in pairs; one submission per pair.")], "yellow"),
    h2("Key idea"),
    p("A non-zero vector ", m("v"), " is an ", b("eigenvector"), " of a square matrix ", m("A"), " if multiplying by ", m("A"), " only scales it:"),
    mathBlock("A v = \\lambda v"),
    p("The number ", m("\\lambda"), " is its ", b("eigenvalue"), ". The eigenvalues are the roots of the characteristic polynomial:"),
    mathBlock("\\det(A - \\lambda I) = 0"),
    h2("Worked example"),
    columns(
      [
        p("Take"),
        mathBlock("A = \\begin{pmatrix} 2 & 1 \\\\ 1 & 2 \\end{pmatrix}"),
      ],
      [
        p("Then"),
        mathBlock("(2-\\lambda)^2 - 1 = 0 \\;\\Rightarrow\\; \\lambda \\in \\{1, 3\\}"),
      ],
    ),
    h2("Check it with code"),
    codeGroup(
      { language: "python", code: "import numpy as np\n\nA = np.array([[2, 1], [1, 2]])\nvalues, vectors = np.linalg.eig(A)\nprint(values)  # [3. 1.]" },
      { language: "javascript", code: "// 2×2 case: roots of λ² − tr(A)·λ + det(A)\nconst tr = 2 + 2, det = 2 * 2 - 1 * 1;\nconst d = Math.sqrt(tr * tr - 4 * det);\nconsole.log([(tr + d) / 2, (tr - d) / 2]); // [3, 1]" },
    ),
    h2("Exercises"),
    ol(
      ["Find the eigenvalues of ", m("\\begin{pmatrix} 4 & 1 \\\\ 2 & 3 \\end{pmatrix}"), "."],
      "Give an eigenvector for each eigenvalue.",
      ["Show that ", m("\\lambda = 0"), " is an eigenvalue exactly when ", m("A"), " is not invertible."],
      "Check your answers to 1 and 2 with the code above.",
    ),
    toggle("Hint for exercise 3", [p("Use ", m("\\det(A - 0 \\cdot I) = \\det(A)"), ".")]),
    h2("Resources"),
    table(
      ["Resource", "Type", "When"],
      ["Chapter 5, sections 5.1–5.2", "Reading", "Before Tuesday"],
      ["Lecture recording", "Video", "Anytime"],
      ["Office hours", "Room B12", "Thursday 14:00"],
    ),
    p(i("Questions? Comment right on this page; the whole class can see the answers.")),
  ),

  fr: doc(
    title("Algèbre linéaire — Semaine 3 : valeurs propres"),
    callout("📌", [p(b("À rendre vendredi :"), " exercices 1 à 4. En binôme, un seul rendu par binôme.")], "yellow"),
    h2("L’idée clé"),
    p("Un vecteur non nul ", m("v"), " est un ", b("vecteur propre"), " d’une matrice carrée ", m("A"), " si la multiplication par ", m("A"), " ne fait que le dilater :"),
    mathBlock("A v = \\lambda v"),
    p("Le nombre ", m("\\lambda"), " est sa ", b("valeur propre"), ". Les valeurs propres sont les racines du polynôme caractéristique :"),
    mathBlock("\\det(A - \\lambda I) = 0"),
    h2("Exemple corrigé"),
    columns(
      [
        p("Prenons"),
        mathBlock("A = \\begin{pmatrix} 2 & 1 \\\\ 1 & 2 \\end{pmatrix}"),
      ],
      [
        p("Alors"),
        mathBlock("(2-\\lambda)^2 - 1 = 0 \\;\\Rightarrow\\; \\lambda \\in \\{1, 3\\}"),
      ],
    ),
    h2("Vérifier avec du code"),
    codeGroup(
      { language: "python", code: "import numpy as np\n\nA = np.array([[2, 1], [1, 2]])\nvaleurs, vecteurs = np.linalg.eig(A)\nprint(valeurs)  # [3. 1.]" },
      { language: "javascript", code: "// Cas 2×2 : racines de λ² − tr(A)·λ + det(A)\nconst tr = 2 + 2, det = 2 * 2 - 1 * 1;\nconst d = Math.sqrt(tr * tr - 4 * det);\nconsole.log([(tr + d) / 2, (tr - d) / 2]); // [3, 1]" },
    ),
    h2("Exercices"),
    ol(
      ["Trouvez les valeurs propres de ", m("\\begin{pmatrix} 4 & 1 \\\\ 2 & 3 \\end{pmatrix}"), "."],
      "Donnez un vecteur propre pour chaque valeur propre.",
      ["Montrez que ", m("\\lambda = 0"), " est valeur propre si et seulement si ", m("A"), " n’est pas inversible."],
      "Vérifiez vos réponses aux questions 1 et 2 avec le code ci-dessus.",
    ),
    toggle("Indice pour l’exercice 3", [p("Utilisez ", m("\\det(A - 0 \\cdot I) = \\det(A)"), ".")]),
    h2("Ressources"),
    table(
      ["Ressource", "Type", "Quand"],
      ["Chapitre 5, sections 5.1–5.2", "Lecture", "Avant mardi"],
      ["Enregistrement du cours", "Vidéo", "Quand vous voulez"],
      ["Permanence", "Salle B12", "Jeudi 14 h"],
    ),
    p(i("Une question ? Commentez directement cette page : toute la classe voit les réponses.")),
  ),
};

