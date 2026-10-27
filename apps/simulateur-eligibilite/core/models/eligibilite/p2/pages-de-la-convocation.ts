// La page de la convocation, après la permission : Q2.10 pour la catégorie, et
// sur la même page, pour l'appareillage, l'agrément du fournisseur (Q2.10.a) et
// l'appareillage concerné (Q2.10.b) (D-108).

import { page } from "../../../socle/index.ts";
import { question } from "../question.ts";
import { unAppareillage, uneConvocationAnnoncee } from "./convocation.ts";

// Q2.10 se pose quand Q2.1 dit une convocation, ou que Q2.2.1.b en signale une
// (option 13). Elle n'est jamais reproposée si Q2.1 l'a déjà dite : Q2.2.1.b la
// retire. Q2.10.a et Q2.10.b se posent ensemble sous l'option 6.
export const PAGE_DE_LA_CONVOCATION = page(
  "P2/convocation",
  question
    .singleChoice(
      "Q2.10",
      "Quelle convocation, quel avis d’audience ou quel appareillage motive ce trajet ?",
    )
    .appliesWhen(uneConvocationAnnoncee),
  question
    .singleChoice(
      "Q2.10.a",
      "Le fournisseur est-il agréé pour cet appareillage ?",
    )
    .appliesWhen(unAppareillage)
    .dependsOn("Q2.10"),
  question
    .singleChoice("Q2.10.b", "Quel appareillage est concerné ?")
    .appliesWhen(unAppareillage)
    .dependsOn("Q2.10"),
);
