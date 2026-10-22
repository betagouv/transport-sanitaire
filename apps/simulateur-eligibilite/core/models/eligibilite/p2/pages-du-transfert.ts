// Les deux pages du transfert, après le trajet de P2 : Q2.5 seule, puis Q2.6.a
// et Q2.6 sur la page des exceptions de l'article 80 (D-106).

import { page } from "../../../socle/index.ts";
import { OPTIONS, type Questions } from "../declarations/questions.ts";
import { question } from "../question.ts";
import {
  retourPenitentiaireValide,
  TRANSFERT_VERS_LA_PRISON,
} from "./retour-penitentiaire.ts";
import {
  champIOuvert,
  exceptionAProposer,
  transfertAPoser,
  typeAPoser,
} from "./transfert.ts";

// Les exceptions de Q2.6, hors « Aucune », qui est exclusive.
const EXCEPTIONS = (
  Object.keys(OPTIONS["Q2.6"]) as Questions["Q2.6"][number][]
).filter((exception) => exception !== "11_AUCUNE");

// Q2.5 distingue le transfert entre établissements d'un autre déplacement
// pendant l'hospitalisation. Q2.1 = 9 les regroupe, et Q2.2.1.a écarte la
// permission sans dire de quel déplacement il s'agit.
export const PAGE_DU_TRANSFERT = page(
  "P2/transfert",
  question
    .singleChoice(
      "Q2.5",
      "S’agit-il d’un transfert entre établissements ou d’un autre déplacement pendant l’hospitalisation ?",
    )
    .askedIf(({ validated }) => transfertAPoser(validated))
    .inconsistentIf(
      ({ answers, validated }) =>
        answers.question("Q2.5").is("1_TRANSFERT") &&
        retourPenitentiaireValide(validated),
      TRANSFERT_VERS_LA_PRISON,
    ),
);

// Q2.6 : chaque exception ne se propose que si le transfert l'admet.
const EXCEPTIONS_DE_L_ARTICLE_80 = EXCEPTIONS.reduce(
  (declaree, exception) =>
    declaree.option(exception, (option) =>
      option.offeredIf(({ answers, validated }) =>
        exceptionAProposer(exception, answers.question("Q2.6.a"), validated),
      ),
    ),
  question
    .multipleChoice(
      "Q2.6",
      "Quelle situation précise et quelles exceptions s’appliquent à ce déplacement ?",
    )
    .askedIf(
      ({ answers, validated }) =>
        champIOuvert(validated) &&
        (!typeAPoser(validated) || answers.question("Q2.6.a").hasAnswer()),
    )
    .exclusive("11_AUCUNE"),
);

// Le type du transfert (Q2.6.a, posée à part), puis les exceptions. Les
// exceptions attendent le type quand il se pose : leurs options en dépendent.
export const PAGE_DES_EXCEPTIONS = page(
  "P2/exceptions",
  question
    .singleChoice("Q2.6.a", "Le transfert est-il définitif ou provisoire ?")
    .askedIf(({ validated }) => typeAPoser(validated)),
  EXCEPTIONS_DE_L_ARTICLE_80,
);
