// La page de branche, dernière de P2 : Q2.13 (le départ d'une entrée), Q2.14
// (les deux groupes de l'Engagement maternité) et Q2.12 (l'urgence, reprise de
// Q2.3.4).
// Elle ne s'affiche que si l'une de ses questions se pose (D-110).

import type { QuestionnairePart } from "../../../socle";
import type { Questions } from "../declarations/questions";
import { question } from "../question";
import {
  departAPoser,
  eloignementAPoser,
  motifAPoser,
  urgenceDevoilee,
} from "./branche";

type Page = QuestionnairePart<Questions, undefined>["pages"][number];

export const PAGE_DE_LA_BRANCHE: Page = {
  id: "P2/branche",
  questions: [
    question.singleChoice("Q2.13.depart", {
      label: "D’où part le patient pour ce trajet ?",
      askedIf: ({ validated }) => departAPoser(validated),
    }),
    question.multipleChoice("Q2.14.eloignement", {
      label: "Quelle situation d’éloignement concerne la patiente ?",
      askedIf: ({ validated }) => eloignementAPoser(validated),
      exclusiveOption: "3_AUCUNE",
    }),
    question.multipleChoice("Q2.14.motif", {
      label: "Quel motif concerne le déplacement évalué ?",
      askedIf: ({ answers, validated }) =>
        motifAPoser(answers.question("Q2.14.eloignement"), validated),
      exclusiveOption: "3_AUCUNE",
    }),
    question.singleChoice("Q2.12", {
      label:
        "Le médecin prescripteur atteste-t-il que ce transport est urgent ?",
      askedIf: ({ validated }) => urgenceDevoilee(validated),
      dependsOn: ["Q2.14.eloignement", "Q2.14.motif"],
    }),
  ],
};
