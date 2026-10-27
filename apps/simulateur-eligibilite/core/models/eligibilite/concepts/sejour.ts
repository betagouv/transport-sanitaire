// Le séjour hospitalier : le groupe « déjà hospitalisé » de Q2.2.1, et ce que
// Q2.1 et Q2.1.g en disent. Les faits de l'hospitalisation, du transfert, du
// Centre 15 et de la permission, et la trace de R2 le lisent.
//
// Il se construit sur des réponses données comme sur des réponses validées.
// Seules ces dernières savent qu'il a été proposé puis écarté. Il donne le fait
// du séjour écarté, sans déclarer de fait du catalogue.

import {
  type AnswersReader,
  Fait,
  type PassesOn,
  type ValidatedAnswers,
} from "../../../socle/index.ts";
import type { Questions } from "../declarations/questions.ts";

/** Le séjour que ces réponses décrivent. */
export class Sejour<
  Reponses extends AnswersReader<Questions> = AnswersReader<Questions>,
> {
  private readonly reponses: Reponses;

  private constructor(reponses: Reponses) {
    this.reponses = reponses;
    Object.freeze(this);
  }

  /** Le séjour de ces réponses, données ou validées. */
  static of<Reponses extends AnswersReader<Questions>>(
    reponses: Reponses,
  ): Sejour<Reponses> {
    return new Sejour(reponses);
  }

  /**
   * « Déjà hospitalisé » est coché. Il n'établit pas l'hospitalisation à lui
   * seul : il inclut la HAD (TS1012-02).
   */
  estCoche(): boolean {
    return this.reponses.question("Q2.2.1").checked("1_HOSPITALISATION");
  }

  /** « Déjà hospitalisé » s'est proposé, et n'est pas coché. */
  estEcarte(this: Sejour<ValidatedAnswers<Questions>>): boolean {
    return this.reponses.question("Q2.2.1").declined("1_HOSPITALISATION");
  }

  /**
   * Le séjour proposé et écarté exclut le transfert, le Centre 15 et la
   * permission. Coché, seule Q2.2.1.a dit la permission.
   */
  nonSiEcarte(this: Sejour<ValidatedAnswers<Questions>>): Fait | PassesOn {
    if (!this.estEcarte()) return undefined;
    return Fait.non("Q2.2.1 : « déjà hospitalisé » proposé, non coché.");
  }

  /** Le trajet est l'entrée en établissement (Q2.1.g) : aucun séjour en cours. */
  commenceAvecCeTrajet(): boolean {
    return this.reponses.question("Q2.1.g").is("1_ENTREE");
  }

  /**
   * Un séjour réel : une entrée ou une sortie d'établissement (Q2.1.g), ou
   * « déjà hospitalisé » coché. L'admission en HAD à domicile n'en est pas un.
   */
  estReel(): boolean {
    return (
      this.reponses.question("Q2.1.g").isOneOf("1_ENTREE", "2_SORTIE") ||
      this.estCoche()
    );
  }
}
