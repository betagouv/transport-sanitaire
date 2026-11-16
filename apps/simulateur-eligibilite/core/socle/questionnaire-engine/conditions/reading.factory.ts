// Les entrées des conditions d'un modèle : une réponse, un fait, une cible, le
// jour. Chacune donne une lecture, qui sait ce qu'elle lit (`given-readings.vo.ts`).
//
//   given.question(Q2_10).answer().is("6_APPAREILLAGE")
//   given.question("Q2.10").answer().is("6_APPAREILLAGE")
//   given.fait("fait_permission").isNon()
//   given.cible("cible_mode_tap_ou_tpmr").assuming("fait_p1_complete").isOui()
//   given.all({ motif: given.question("Q2.1").answer(), sens: SENS_CHOISI })
//
// Une question se lit par son objet, ou par son id quand le modèle type ses
// ids : une déclaration lit les questions d'avant elle par leur objet
// (`ReadByObject`), un fait ou un test par leur id.
//
// `answer()` est la seule lecture d'une réponse. Le socle la choisit selon
// l'endroit : dans une garde, les questions posées avant elle ; dans un fait,
// les questions validées (`conditions/guard-place.vo.ts`).

import type { Cible, Fait } from "../../decision-engine/index.ts";

import type {
  AnswerOfRef,
  AnyQuestions,
  QuestionRef,
} from "../question/question.types.ts";
import { QuestionId } from "../question/question-id.vo.ts";
import {
  AnswerReading,
  CibleReading,
  DateReading,
  FaitReading,
} from "./given-readings.vo.ts";
import { type Context, Reading } from "./reading.vo.ts";
import { Reads } from "./reads.vo.ts";

/**
 * Les entrées des conditions d'un modèle, typées par ses questions, ses faits
 * et ses cibles : `export const given = new ReadingFactory<Questions, Faits,
 * Cibles>()`. Avec `ReadByObject`, une question ne se lit que par son objet.
 */
export class ReadingFactory<
  Questions extends AnyQuestions,
  Faits = undefined,
  Cibles = undefined,
> {
  /** Toutes ces lectures, sous leur nom. */
  readonly all = Reading.all;

  question<Ref extends QuestionRef<Questions>>(question: Ref) {
    return {
      answer: () =>
        AnswerReading.of<AnswerOfRef<Questions, Ref>>(
          QuestionId.of(question).value,
        ),
    };
  }

  fait<Nom extends keyof Faits & string>(nom: Nom) {
    return FaitReading.of<FaitValueOf<Faits[Nom]>>(nom);
  }

  cible<Nom extends keyof Cibles & string>(nom: Nom) {
    return CibleReading.of<CibleOf<Cibles[Nom]>, keyof Faits & string>(nom);
  }

  /** Ces faits, sous leur nom : ce qu'un texte en lit, et rien d'autre. */
  faits<Nom extends keyof Faits & string>(...noms: Nom[]) {
    return named<Pick<Faits, Nom>>(noms, Reads.ofFait, (context, nom) =>
      context.fait(nom),
    );
  }

  /** Ces cibles, sous leur nom : ce qu'un texte en lit, et rien d'autre. */
  cibles<Nom extends keyof Cibles & string>(...noms: Nom[]) {
    return named<Pick<Cibles, Nom>>(noms, Reads.ofCible, (context, nom) =>
      context.cible(nom),
    );
  }

  today() {
    return DateReading.today();
  }
}

// ---- implémentation ----

// Des faits ou des cibles, chacun sous son nom.
function named<Of>(
  noms: readonly string[],
  reads: (nom: string) => Reads,
  read: (context: Context, nom: string) => unknown,
): Reading<Of> {
  return new Reading(
    Reads.union(...noms.map(reads)),
    (context) =>
      Object.fromEntries(noms.map((nom) => [nom, read(context, nom)])) as Of,
  );
}

type FaitValueOf<Read> = Read extends Fait<infer Of> ? Of : never;
type CibleOf<Read> = Read extends Cible<infer Of> ? Of : never;
