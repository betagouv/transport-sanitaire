// Un fait : une valeur nommée, faite de règles écrites comme le contrat de
// l'éditeur les décrit. Ce qui le met à « oui », ce qui le met à « non », ce
// qui le laisse inconnu.
//
//   export const MOTIF_CAMSP = unFait("fait_motif_camsp")
//     .ouiSi(situation.checked("6_CAMSP"))
//     .nonSiEcartee(situation, "6_CAMSP")
//     .applique(UNE_SORTIE_VERS_LA_PRISON)
//     .sinon("Ni Q2.1.h, ni Q2.2.1 n'établissent encore le CAMSP.");
//
// Les règles s'appliquent dans l'ordre : la première qui établit le fait
// l'emporte. `sinon` clôt le fait : si aucune règle ne l'établit, il reste
// inconnu avec cette provenance. Le fait lit ce que lisent ses règles, et le
// catalogue le calcule (`fait-catalogue.ts`).

import {
  type Condition,
  NOTHING,
  readsOf,
  Value,
} from "../questionnaire-engine/condition.ts";
import type { Box } from "../questionnaire-engine/given-answers.ts";
import type { Answer } from "../questionnaire-engine/question.ts";
import { Fait } from "./fait.ts";
import {
  type AnswerOf,
  type PassesOn,
  type RegleDeFait,
  regles,
} from "./regle-de-fait.ts";

/** Un fait du catalogue : son nom, et la valeur qui le calcule. */
export class FaitDeclare<Nom extends string, Of> extends Value<Of> {
  readonly nom: Nom;

  constructor(nom: Nom, value: Value<Of>) {
    super(value.reads, (reading) => value.in(reading));
    this.nom = nom;
  }
}

/** Un fait, ses règles écrites dans l'ordre : `unFait(nom).ouiSi(…).sinon(…)`. */
export function unFait<Nom extends string>(nom: Nom): FaitEnCours<Nom> {
  return new FaitEnCours(nom, []);
}

/** Un fait en cours d'écriture, règle après règle. */
class FaitEnCours<Nom extends string> {
  readonly #nom: Nom;
  readonly #regles: readonly RegleDeFait[];

  constructor(nom: Nom, regles: readonly RegleDeFait[]) {
    this.#nom = nom;
    this.#regles = regles;
  }

  /** Le fait vaut « oui » si `condition` tient. */
  ouiSi(condition: Condition, raison?: string): FaitEnCours<Nom> {
    return this.applique(regles.ouiSi(condition, raison));
  }

  /** Le fait vaut « non » si `condition` tient. */
  nonSi(condition: Condition, raison?: string): FaitEnCours<Nom> {
    return this.applique(regles.nonSi(condition, raison));
  }

  /**
   * Le fait reste inconnu si `condition` tient, sans laisser la main : une
   * réponse attendue plus loin le dira.
   */
  inconnuSi(condition: Condition, raison?: string): FaitEnCours<Nom> {
    return this.applique(regles.inconnuSi(condition, raison));
  }

  /** « Non » si la case se proposait sans être cochée. */
  nonSiEcartee<Given extends Answer>(
    answer: AnswerOf<Given>,
    box: Box<Given>,
    raison?: string,
  ): FaitEnCours<Nom> {
    return this.applique(regles.nonSiEcartee(answer, box, raison));
  }

  /** Cette règle, écrite ailleurs, à cette place. */
  applique(regle: RegleDeFait): FaitEnCours<Nom> {
    return new FaitEnCours(this.#nom, [...this.#regles, regle]);
  }

  /** Clôt le fait : si aucune règle ne l'établit, il est inconnu, pour cette raison. */
  sinon(raison: string): FaitDeclare<Nom, Fait> {
    const regles = this.#regles;
    const reads = regles.map((regle) => regle.reads).reduce(readsOf, NOTHING);
    return new FaitDeclare(
      this.#nom,
      new Value(reads, (reading) => {
        for (const regle of regles) {
          const fait: Fait | PassesOn = regle.in(reading);
          if (fait) return fait;
        }
        return Fait.inconnu(raison);
      }),
    );
  }

  /** Un fait qui n'a pas d'état, mais une valeur : la boisson, en toutes lettres. */
  vaut<Of>(value: Value<Of>): FaitDeclare<Nom, Of> {
    return new FaitDeclare(this.#nom, value);
  }
}
