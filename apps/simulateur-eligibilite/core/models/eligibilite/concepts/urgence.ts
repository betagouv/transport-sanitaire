// L'urgence que le médecin prescripteur atteste : Q2.3.4 la demande sur la
// page du trajet, et Q2.12 la reprend sur la page de branche, quand la branche
// dévoile ce que le trajet masquait. Les faits de l'urgence attestée et de
// l'urgence répondue la lisent, comme la garde de Q2.12.
//
// Sans réponse à l'une ni à l'autre, elle attend, ou leur garde les écarte.
// Elle ne lit pas cette garde : la garde la lit. Elle donne le fait de
// l'urgence, sans déclarer de fait du catalogue.

import {
  type Fait,
  unFait,
  type ValidatedAnswers,
} from "../../../socle/index.ts";
import type { Questions } from "../declarations/questions.ts";

type Valides = ValidatedAnswers<Questions>;

/** L'urgence que ces réponses validées décrivent. */
export class Urgence {
  private readonly validated: Valides;

  private constructor(validated: Valides) {
    this.validated = validated;
    Object.freeze(this);
  }

  /** L'urgence de ces réponses validées. */
  static of(validated: Valides): Urgence {
    return new Urgence(validated);
  }

  /** Q2.3.4 est validée : l'urgence ne se redemande jamais en Q2.12. */
  estDemandeeSurLeTrajet(): boolean {
    return this.validated.question("Q2.3.4").isValidated();
  }

  /** Le médecin atteste l'urgence, ou non. */
  attestee(): Fait {
    return unFait()
      .selon(this.reponse(), { "1_OUI": "oui", "2_NON": "non" })
      .sinon(URGENCE_EN_ATTENTE);
  }

  /** La question de l'urgence a sa réponse : « oui » comme « non » le disent. */
  repondue(): Fait {
    return unFait()
      .selon(this.reponse(), { "1_OUI": "oui", "2_NON": "oui" })
      .sinon(URGENCE_EN_ATTENTE);
  }

  // La réponse qui dit l'urgence : celle du trajet, ou celle de la branche.
  private reponse() {
    return this.validated.question(
      this.estDemandeeSurLeTrajet() ? "Q2.3.4" : "Q2.12",
    );
  }
}

// ---- implémentation ----

const URGENCE_EN_ATTENTE =
  "Ni Q2.3.4 ni Q2.12 n'ont de réponse : elles attendent, ou leur garde les écarte.";
