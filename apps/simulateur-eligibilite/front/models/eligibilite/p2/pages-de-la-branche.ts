// La page de branche, dernière de P2 : Q2.13 (le départ d'une entrée), Q2.14
// (les deux groupes de l'Engagement maternité) et Q2.12 (l'urgence, reprise de
// Q2.3.4).
// Elle ne s'affiche que si l'une de ses questions se pose (D-110).

import { optionsFrom, type QuestionnairePart } from "../../../socle";
import { OPTIONS, type Questions } from "../declarations/questions";
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
    {
      id: "Q2.13.depart",
      kind: "single choice",
      label: "D’où part le patient pour ce trajet ?",
      askedIf: (_answers, _cibles, validated) => departAPoser(validated),
      options: optionsFrom(OPTIONS["Q2.13.depart"]),
    },
    {
      id: "Q2.14.eloignement",
      kind: "multiple choice",
      label: "Quelle situation d’éloignement concerne la patiente ?",
      askedIf: (_answers, _cibles, validated) => eloignementAPoser(validated),
      ...groupe("Q2.14.eloignement"),
    },
    {
      id: "Q2.14.motif",
      kind: "multiple choice",
      label: "Quel motif concerne le déplacement évalué ?",
      askedIf: (answers, _cibles, validated) =>
        motifAPoser(answers.question("Q2.14.eloignement"), validated),
      ...groupe("Q2.14.motif"),
    },
    {
      id: "Q2.12",
      kind: "single choice",
      label:
        "Le médecin prescripteur atteste-t-il que ce transport est urgent ?",
      askedIf: (_answers, _cibles, validated) => urgenceDevoilee(validated),
      dependsOn: ["Q2.14.eloignement", "Q2.14.motif"],
      options: optionsFrom(OPTIONS["Q2.12"]),
    },
  ],
};

// Un groupe de Q2.14 : ses conditions, puis « Aucune de ces conditions »,
// exclusive.
function groupe(id: "Q2.14.eloignement" | "Q2.14.motif") {
  const libelles: Readonly<Record<string, string>> = OPTIONS[id];
  return {
    options: optionsFrom(libelles).filter(
      (option) => option.value !== "3_AUCUNE",
    ),
    exclusiveOption: { value: "3_AUCUNE", label: OPTIONS[id]["3_AUCUNE"] },
  } as const;
}
