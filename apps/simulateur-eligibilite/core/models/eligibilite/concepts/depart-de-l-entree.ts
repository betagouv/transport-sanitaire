// Le départ d'une entrée en établissement (Q2.13) : une entrée simple part du
// domicile, d'un hébergement non médicalisé ou d'un établissement
// pénitentiaire. Elle est hors du champ du I de D.162-17 : ni transfert, ni
// Centre 15. Les faits du transfert et du Centre 15 le lisent.
//
// Les trois autres départs (établissement, EHPAD, USLD) ouvrent le transfert ;
// un autre lieu ne se qualifie pas sur une description libre. Il donne le fait
// d'une entrée simple, sans déclarer de fait du catalogue.

import {
  type AnswersReader,
  Fait,
  type GivenAnswer,
  type PassesOn,
} from "../../../socle/index.ts";
import type { Questions } from "../declarations/questions.ts";

/** Le départ que ces réponses décrivent. */
export class DepartDeLEntree {
  private readonly depart: GivenAnswer<Questions["Q2.13.depart"]>;

  private constructor(reponses: AnswersReader<Questions>) {
    this.depart = reponses.question("Q2.13.depart");
    Object.freeze(this);
  }

  /** Le départ de ces réponses, données ou validées. */
  static of(reponses: AnswersReader<Questions>): DepartDeLEntree {
    return new DepartDeLEntree(reponses);
  }

  /**
   * Une entrée simple donne « non », pour la raison que le fait en donne. Un
   * autre départ, ou aucun, laisse la main.
   */
  nonSiEntreeSimple(raison: string): Fait | PassesOn {
    if (!this.depart.isOneOf(...DEPARTS_D_UNE_ENTREE_SIMPLE)) return undefined;
    return Fait.non(`Q2.13 : « ${this.depart.value} » ; ${raison}`);
  }
}

// ---- implémentation ----

const DEPARTS_D_UNE_ENTREE_SIMPLE: readonly Questions["Q2.13.depart"][] = [
  "1_DOMICILE",
  "5_HEBERGEMENT_NON_MEDICALISE",
  "6_ETABLISSEMENT_PENITENTIAIRE",
];
