// La permission de sortie : ce que Q2.7 et Q2.8 disent du patient et de la
// répétition des permissions. Les pages de P3 et la trace de R2 la lisent
// (D-107). Le transfert qu'écarte la question qui la pose (Q2.1 ou Q2.2.1.a)
// est une règle des faits (`faits/communs.ts`). Les
// contrôles de dates de Q2.8 se lisent sur sa page (`p2/permission.ts`).
//
// Elle se construit sur des réponses données comme sur des réponses validées.

import type { AnswersReader, GivenAnswer } from "../../../socle/index.ts";
import type { Questions } from "../declarations/questions.ts";
import type { Inconnu } from "../question.ts";

/** La permission que ces réponses décrivent. */
export class Permission<
  Reponses extends AnswersReader<Questions> = AnswersReader<Questions>,
> {
  private readonly tranche: GivenAnswer<Questions["Q2.7"]>;
  private readonly semaines: Questions["Q2.8.6.a"] | Inconnu;

  private constructor(reponses: Reponses) {
    this.tranche = reponses.question("Q2.7");
    this.semaines = reponses.question("Q2.8.6.a").value;
    Object.freeze(this);
  }

  /** La permission de ces réponses, données ou validées. */
  static of<Reponses extends AnswersReader<Questions>>(
    reponses: Reponses,
  ): Permission<Reponses> {
    return new Permission(reponses);
  }

  /** Q2.7 dit un patient de moins de 20 ans : Q2.8 se pose alors. */
  estDUnMineurDeVingtAns(): boolean {
    return this.tranche.isOneOf(
      "1_MOINS_DE_SEIZE_ANS",
      "2_SEIZE_A_DIX_NEUF_ANS",
    );
  }

  /** Q2.7 dit un adulte qui demande par écrit un transport exceptionnel. */
  estAChargeDuPatient(): boolean {
    return this.tranche.is("4_ADULTE_A_SA_CHARGE");
  }

  /** Une permission revient toutes les tant de semaines (Q2.8.6.a). */
  semainesEntreDeuxPermissions(): number | Inconnu {
    return this.semaines;
  }

  /**
   * Le plus de trajets qu'un mois peut compter : deux par permission, une
   * permission toutes les N semaines, sur 31 jours.
   */
  trajetsMensuelsMaximum(): number | Inconnu {
    return trajetsMensuelsAuPlus(this.semaines);
  }
}

/**
 * Le plus de trajets qu'un mois compte, une permission aller-retour toutes les
 * `semaines` semaines.
 */
export function trajetsMensuelsAuPlus(
  semaines: number | Inconnu,
): number | Inconnu {
  if (semaines === undefined || semaines < 1) return undefined;
  return 2 * Math.ceil(31 / (7 * semaines));
}
