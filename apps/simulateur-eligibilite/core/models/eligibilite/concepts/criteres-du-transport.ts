// Les critères du transport (Q1.2) : les aides ou conditions particulières
// nécessaires pendant le trajet. Q1.2 ne se pose qu'avec un professionnel
// (Q1.1). Les faits des critères les lisent, comme l'ALD et le mineur, qui y
// cherchent une déficience.
//
// Ils se construisent sur des réponses données comme sur des réponses
// validées. Ils donnent le fait d'un critère, sans déclarer de fait du
// catalogue.

import {
  type AnswersReader,
  type Fait,
  type GivenAnswer,
  unFait,
} from "../../../socle/index.ts";
import type { Questions } from "../declarations/questions.ts";
import { AideDuPatient } from "./aide-du-patient.ts";

type Critere = Questions["Q1.2"][number];

/** Aucun critère n'est coché en Q1.2. */
export type AucunCritere = undefined;

/** Les critères que ces réponses disent. */
export class CriteresDuTransport {
  private readonly criteres: GivenAnswer<Questions["Q1.2"]>;
  private readonly aide: AideDuPatient;

  private constructor(reponses: AnswersReader<Questions>) {
    this.criteres = reponses.question("Q1.2");
    this.aide = AideDuPatient.of(reponses);
    Object.freeze(this);
  }

  /** Les critères de ces réponses, données ou validées. */
  static of(reponses: AnswersReader<Questions>): CriteresDuTransport {
    return new CriteresDuTransport(reponses);
  }

  /**
   * Le fait d'un critère : l'une de ces options est cochée, ou aucune. Sans
   * professionnel, Q1.2 ne se pose pas : aucun critère ne vaut.
   */
  fait(...options: readonly Critere[]): Fait {
    const coche = options.find((option) => this.criteres.checked(option));
    return unFait()
      .ouiSi(coche !== undefined, `Q1.2 : « ${coche} » coché.`)
      .nonSi(
        this.criteres.hasAnswer(),
        `Q1.2 validée sans « ${options.join(" », « ")} ».`,
      )
      .nonSi(
        this.aide.sansProfessionnel(),
        "Q1.2 ne se pose pas : aucun professionnel n'intervient.",
      )
      .sinon("Q1.2 n'est pas encore validée.");
  }

  /** Le premier critère coché, qui prouve une déficience. */
  premier(): Critere | AucunCritere {
    const [critere] = this.criteres.checkedBoxes();
    return critere;
  }
}
