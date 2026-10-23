// Le soin qui motive le transport : la séance de P1 (Q1.3, Q1.3.a), le motif de
// Q2.1 et son sous-type (Q2.1.g). Les faits de l'hospitalisation et de la
// situation de soins qualifiante le lisent.
//
// Il se construit sur des réponses données comme sur des réponses validées. Il
// donne le fait d'une lecture, sans déclarer de fait du catalogue.

import {
  type AnswersReader,
  citant,
  Fait,
  type GivenAnswer,
  type PassesOn,
} from "../../../socle/index.ts";
import type { Questions } from "../declarations/questions.ts";
import { CasParticuliers } from "./cas-particuliers.ts";

/** Le soin que ces réponses décrivent. */
export class Soin {
  private readonly cas: CasParticuliers;
  private readonly motif: GivenAnswer<Questions["Q2.1"]>;
  private readonly sousType: GivenAnswer<Questions["Q2.1.g"]>;

  private constructor(reponses: AnswersReader<Questions>) {
    this.cas = CasParticuliers.of(reponses);
    this.motif = reponses.question("Q2.1");
    this.sousType = reponses.question("Q2.1.g");
    Object.freeze(this);
  }

  /** Le soin de ces réponses, données ou validées. */
  static of(reponses: AnswersReader<Questions>): Soin {
    return new Soin(reponses);
  }

  /** Une entrée ou une sortie d'établissement (Q2.1.g) : un séjour réel. */
  parEntreeOuSortie(): Fait | PassesOn {
    if (!this.sousType.isOneOf("1_ENTREE", "2_SORTIE")) return undefined;
    return Fait.oui(citant(this.sousType));
  }

  /**
   * Ni séance qualifiante en Q1.3, ni séjour en Q2.1 : le soin ne qualifie pas
   * le transport. Q2.1 est un choix unique : un autre motif écarte
   * l'hospitalisation, et l'admission en HAD (Q2.1.g) n'est pas un séjour
   * (`negation_precise_v1002` de `fait_situation_soins_qualifiante`).
   */
  sansSeanceNiSejour(): Fait | PassesOn {
    if (!this.motif.hasAnswer() || !this.cas.sansSeance()) return undefined;
    const hospitalise = this.motif.is("8_HOSPITALISATION");
    if (hospitalise && this.sousType.isNot("3_ADMISSION_HAD")) return undefined;
    return Fait.non(
      hospitalise
        ? `Q2.1.g : « ${this.sousType.value} », pas un séjour ; Q1.3 sans séance.`
        : `Q2.1 : « ${this.motif.value} », pas une hospitalisation ; Q1.3 sans séance.`,
    );
  }

  /** La séance qualifiante de P1, quand Q2.1.g ne décide pas. */
  seanceDeP1(): Fait {
    return this.cas.seance();
  }
}
