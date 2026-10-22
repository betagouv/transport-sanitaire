// Le séjour hospitalier : le groupe « déjà hospitalisé » de Q2.2.1, et ce que
// Q2.1 et Q2.1.g en disent. Les pages de P2, les faits du transfert, de la
// permission et de la prestation, et la trace de R2 le lisent.
//
// Il se construit sur des réponses données comme sur des réponses validées.
// Seules ces dernières savent qu'il a été proposé puis écarté. Il ne pose
// aucun fait.

import type { AnswersReader, ValidatedAnswers } from "../../../socle/index.ts";
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
   * « Déjà hospitalisé » se propose en Q2.2.1. Ni une permission déjà indiquée
   * en Q2.1, ni un trajet qui ouvre le séjour ne le laissent (D-98).
   */
  estAProposer(): boolean {
    return (
      this.reponses.question("Q2.1").isNot("11_PERMISSION") &&
      !this.commenceAvecCeTrajet()
    );
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
