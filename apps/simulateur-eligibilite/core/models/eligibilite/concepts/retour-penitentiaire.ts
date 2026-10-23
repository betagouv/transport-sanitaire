// Le retour vers un établissement pénitentiaire (option 10 de Q2.2.1.b) : coché
// ou non, et la sortie définitive vers la prison qu'il fait d'une sortie
// d'hospitalisation (TS1012-04). Les faits du transfert, du Centre 15 et de la
// permission le lisent, comme les pages de P2, qui qualifient son circuit
// (`p2/retour-penitentiaire.ts`), et le sens et les lieux de P3.
//
// Il se construit sur des réponses données, celles de la page en cours ou
// acquises au verrou, comme sur des réponses validées. Il donne le fait de la
// sortie vers la prison, sans déclarer de fait du catalogue.

import {
  type AnswersReader,
  Fait,
  type PassesOn,
} from "../../../socle/index.ts";
import type { Questions } from "../declarations/questions.ts";

/** Le retour pénitentiaire que ces réponses décrivent. */
export class RetourPenitentiaire {
  private readonly reponses: AnswersReader<Questions>;

  private constructor(reponses: AnswersReader<Questions>) {
    this.reponses = reponses;
    Object.freeze(this);
  }

  /** Le retour de ces réponses, données ou validées. */
  static of(reponses: AnswersReader<Questions>): RetourPenitentiaire {
    return new RetourPenitentiaire(reponses);
  }

  /** L'option 10 de l'autre cadre est cochée. */
  estCoche(): boolean {
    return (
      this.reponses.question("Q2.2.1").checked("3_AUTRE_CADRE") &&
      this.reponses.question("Q2.2.1.b").checked("10_RETOUR_PENITENTIAIRE")
    );
  }

  /**
   * Une sortie d'hospitalisation (Q2.1.g), hors permission, vers la prison :
   * elle est définitive. Q2.5 ne se pose pas alors.
   */
  estUneSortieVersLaPrison(): boolean {
    return (
      this.estCoche() &&
      this.reponses.question("Q2.1.g").is("2_SORTIE") &&
      this.reponses.question("Q2.2.1.a").isNot("1_OUI")
    );
  }

  /**
   * La sortie définitive vers la prison exclut le transfert, le Centre 15 et la
   * permission. Sans elle, la main passe.
   */
  nonSiSortieVersLaPrison(): Fait | PassesOn {
    if (!this.estUneSortieVersLaPrison()) return undefined;
    return Fait.non(
      "Q2.1.g : « 2_SORTIE », Q2.2.1.b : « 10_RETOUR_PENITENTIAIRE » ; sortie définitive vers la prison.",
    );
  }
}
