// Les deux pages du transfert, après le trajet de P2 : Q2.5 seule, puis Q2.6.a
// et Q2.6 sur la page des exceptions de l'article 80 (D-106).

import type { QuestionnairePart } from "../../../../core/socle";
import { OPTIONS, type Questions } from "../declarations/questions";
import { type Context, question } from "../question";
import {
  retourPenitentiaireValide,
  TRANSFERT_VERS_LA_PRISON,
} from "./retour-penitentiaire";
import {
  champIOuvert,
  exceptionAProposer,
  transfertAPoser,
  typeAPoser,
} from "./transfert";

type Page = QuestionnairePart<Questions, undefined>["pages"][number];

// Les exceptions de Q2.6, hors « Aucune », qui est exclusive.
const EXCEPTIONS = (
  Object.keys(OPTIONS["Q2.6"]) as Questions["Q2.6"][number][]
).filter((exception) => exception !== "11_AUCUNE");

// Q2.5 distingue le transfert entre établissements d'un autre déplacement
// pendant l'hospitalisation. Q2.1 = 9 les regroupe, et Q2.2.1.a écarte la
// permission sans dire de quel déplacement il s'agit.
export const PAGE_DU_TRANSFERT: Page = {
  id: "P2/transfert",
  questions: [
    question.singleChoice("Q2.5", {
      label:
        "S’agit-il d’un transfert entre établissements ou d’un autre déplacement pendant l’hospitalisation ?",
      askedIf: ({ validated }) => transfertAPoser(validated),
      inconsistenciesFrom: ({ answers, validated }) =>
        answers.question("Q2.5").is("1_TRANSFERT") &&
        retourPenitentiaireValide(validated)
          ? [TRANSFERT_VERS_LA_PRISON]
          : [],
    }),
  ],
};

// Le type du transfert (Q2.6.a, posée à part), puis les exceptions. Les
// exceptions attendent le type quand il se pose : leurs options en dépendent.
export const PAGE_DES_EXCEPTIONS: Page = {
  id: "P2/exceptions",
  questions: [
    question.singleChoice("Q2.6.a", {
      label: "Le transfert est-il définitif ou provisoire ?",
      askedIf: ({ validated }) => typeAPoser(validated),
    }),
    question.multipleChoice("Q2.6", {
      label:
        "Quelle situation précise et quelles exceptions s’appliquent à ce déplacement ?",
      askedIf: ({ answers, validated }) =>
        champIOuvert(validated) &&
        (!typeAPoser(validated) || answers.question("Q2.6.a").hasAnswer()),
      exclusiveOption: "11_AUCUNE",
      // Chaque exception ne se propose que si le transfert l'admet.
      options: Object.fromEntries(
        EXCEPTIONS.map((exception) => [
          exception,
          {
            offeredIf: ({ answers, validated }: Context) =>
              exceptionAProposer(
                exception,
                answers.question("Q2.6.a"),
                validated,
              ),
          },
        ]),
      ),
    }),
  ],
};
