// La page de la convocation, après la permission : Q2.10 pour la catégorie, et
// sur la même page, pour l'appareillage, l'agrément du fournisseur (Q2.10.a) et
// l'appareillage concerné (Q2.10.b) (D-108).

import type { QuestionnairePart } from "../../../socle";
import type { Questions } from "../declarations/questions";
import { question } from "../question";
import { convocationAnnoncee } from "./convocation";

type Page = QuestionnairePart<Questions, undefined>["pages"][number];

// Q2.10 se pose quand Q2.1 dit une convocation, ou que Q2.2.1.b en signale une
// (option 13). Elle n'est jamais reproposée si Q2.1 l'a déjà dite : Q2.2.1.b la
// retire. Q2.10.a et Q2.10.b se posent ensemble sous l'option 6.
export const PAGE_DE_LA_CONVOCATION: Page = {
  id: "P2/convocation",
  questions: [
    question.singleChoice("Q2.10", {
      label:
        "Quelle convocation, quel avis d’audience ou quel appareillage motive ce trajet ?",
      askedIf: ({ validated }) => convocationAnnoncee(validated),
    }),
    question.singleChoice("Q2.10.a", {
      label: "Le fournisseur est-il agréé pour cet appareillage ?",
      askedIf: ({ answers }) => answers.question("Q2.10").is("6_APPAREILLAGE"),
      dependsOn: ["Q2.10"],
    }),
    question.singleChoice("Q2.10.b", {
      label: "Quel appareillage est concerné ?",
      askedIf: ({ answers }) => answers.question("Q2.10").is("6_APPAREILLAGE"),
      dependsOn: ["Q2.10"],
    }),
  ],
};
