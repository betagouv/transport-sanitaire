// L'aide dont le patient a besoin pour se déplacer (Q1.1) : seul, avec un
// proche, ou avec un professionnel. Les pages de P1 la lisent : Q1.2 ne se pose qu'avec un professionnel, Q1.4 qu'à celui qui s'en
// passe.
//
// Elle se construit sur des réponses données, pour une garde de page. Les faits
// lisent Q1.1 par leurs conditions (`faits/communs.ts`).

import type { AnswersReader, GivenAnswer } from "../../../socle/index.ts";
import type { Questions } from "../declarations/questions.ts";

/** L'aide que ces réponses disent. */
export class AideDuPatient {
  private readonly qui: GivenAnswer<Questions["Q1.1"]>;

  private constructor(reponses: AnswersReader<Questions>) {
    this.qui = reponses.question("Q1.1");
    Object.freeze(this);
  }

  /** L'aide de ces réponses, données ou validées. */
  static of(reponses: AnswersReader<Questions>): AideDuPatient {
    return new AideDuPatient(reponses);
  }

  /** Le patient se déplace seul, sans aide ni besoin particulier. */
  seDeplaceSeul(): boolean {
    return this.qui.is("1_SEUL");
  }

  /** Un proche l'accompagne, sans professionnel pendant le transport. */
  avecUnProche(): boolean {
    return this.qui.is("2_AVEC_UN_PROCHE");
  }

  /** Un professionnel intervient, ou des conditions particulières : Q1.2 les dit. */
  avecUnProfessionnel(): boolean {
    return this.qui.is("3_AVEC_UN_PROFESSIONNEL");
  }

  /** Il se passe d'un professionnel : seul, ou avec un proche. */
  sansProfessionnel(): boolean {
    return this.seDeplaceSeul() || this.avecUnProche();
  }
}
