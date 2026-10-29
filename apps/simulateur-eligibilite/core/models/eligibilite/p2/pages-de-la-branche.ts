// La page de branche, dernière de P2 : Q2.13 (le départ d'une entrée), Q2.14
// (les deux groupes de l'Engagement maternité) et Q2.12 (l'urgence, reprise de
// Q2.3.4).
// Elle ne s'affiche que si l'une de ses questions se pose (D-110).

import { page } from "../../../socle/index.ts";
import { question } from "../question.ts";
import {
  unDepartAPoser,
  unEloignementAPoser,
  uneUrgenceDevoilee,
  unMotifAPoser,
} from "./branche.ts";

export const PAGE_DE_LA_BRANCHE = page(
  "P2/branche",
  question
    .singleChoice(
      "Q2.13.depart",
      "Le patient devra effectuer son départ depuis…",
    )
    .mattersWhile(unDepartAPoser),
  question
    .multipleChoice(
      "Q2.14.eloignement",
      "Quelle situation d’éloignement concerne la patiente ?",
    )
    .mattersWhile(unEloignementAPoser)
    .exclusive("3_AUCUNE"),
  question
    .multipleChoice(
      "Q2.14.motif",
      "Quel motif concerne le déplacement évalué ?",
    )
    .mattersWhile(unMotifAPoser)
    .exclusive("3_AUCUNE"),
  question
    .singleChoice("Q2.12", "Attestez-vous que ce transport est urgent ?")
    .mattersWhile(uneUrgenceDevoilee)
    .dependsOn("Q2.14.eloignement", "Q2.14.motif"),
);
