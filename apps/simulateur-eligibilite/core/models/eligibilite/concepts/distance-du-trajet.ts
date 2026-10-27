// La distance du trajet évalué (Q2.3.1) : la tranche où il se range, et les
// seuils de 50 et 150 km qu'il dépasse. Les faits des deux distances et de la
// série qualifiante la lisent.
//
// 50 km et 150 km exactement ne dépassent pas leur seuil. Elle donne le fait
// d'un seuil, sans déclarer de fait du catalogue.

import {
  type AnswersReader,
  type Fait,
  type GivenAnswer,
  unFait,
} from "../../../socle/index.ts";
import type { Questions } from "../declarations/questions.ts";

/** La distance que ces réponses décrivent. */
export class DistanceDuTrajet {
  private readonly tranche: GivenAnswer<Questions["Q2.3.1"]>;

  private constructor(reponses: AnswersReader<Questions>) {
    this.tranche = reponses.question("Q2.3.1");
    Object.freeze(this);
  }

  /** La distance de ces réponses, données ou validées. */
  static of(reponses: AnswersReader<Questions>): DistanceDuTrajet {
    return new DistanceDuTrajet(reponses);
  }

  /** Le trajet dépasse 50 km : plus de 50, ou plus de 150. */
  depasseCinquanteKm(): Fait {
    return unFait()
      .selon(this.tranche, {
        "1_CINQUANTE_KM_OU_MOINS": "non",
        "2_PLUS_DE_CINQUANTE_KM": "oui",
        "3_PLUS_DE_CENT_CINQUANTE_KM": "oui",
      })
      .sinon(Q231_EN_ATTENTE);
  }

  /** Le trajet dépasse 150 km. */
  depasseCentCinquanteKm(): Fait {
    return unFait()
      .selon(this.tranche, {
        "1_CINQUANTE_KM_OU_MOINS": "non",
        "2_PLUS_DE_CINQUANTE_KM": "non",
        "3_PLUS_DE_CENT_CINQUANTE_KM": "oui",
      })
      .sinon(Q231_EN_ATTENTE);
  }

  /** Le trajet ne dépasse pas 50 km : la série ne se pose pas. */
  estDeCinquanteKmOuMoins(): boolean {
    return this.tranche.is("1_CINQUANTE_KM_OU_MOINS");
  }
}

// ---- implémentation ----

const Q231_EN_ATTENTE = "Q2.3.1 n'est pas encore validée.";
