// La permission de sortie : ce que Q2.7 et Q2.8 disent du patient et de la
// répétition des permissions, et le transfert qu'écarte la question qui la
// pose (Q2.1 ou Q2.2.1.a). Les pages de P3, les faits de la permission, du
// transfert et du Centre 15, et la trace de R2 la lisent (D-107). Les
// contrôles de dates de Q2.8 se lisent sur sa page (`p2/permission.ts`).
//
// Elle se construit sur des réponses données comme sur des réponses validées.
// Seules ces dernières savent si Q2.5 est validée. Elle donne le fait du transfert écarté,
// sans déclarer de fait du catalogue.

import {
  type AnswersReader,
  Fait,
  type GivenAnswer,
  type PassesOn,
  type ValidatedAnswers,
} from "../../../socle/index.ts";
import type { Questions } from "../declarations/questions.ts";
import type { Inconnu } from "../question.ts";

/** La permission que ces réponses décrivent. */
export class Permission<
  Reponses extends AnswersReader<Questions> = AnswersReader<Questions>,
> {
  private readonly reponses: Reponses;
  private readonly tranche: GivenAnswer<Questions["Q2.7"]>;
  private readonly semaines: Questions["Q2.8.6.a"] | Inconnu;

  private constructor(reponses: Reponses) {
    this.reponses = reponses;
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

  /**
   * Une permission n'est ni un transfert ni un déplacement pour soins : la
   * question qui la pose a écarté l'option 9 de Q2.1 (choix unique), ou
   * l'option 2 de Q2.2.1.a. Q2.5 ne se pose pas alors ; si elle est validée,
   * elle décide, et la main passe.
   */
  ecarteLeTransfert(
    this: Permission<ValidatedAnswers<Questions>>,
  ): Fait | PassesOn {
    if (this.reponses.question("Q2.5").isValidated()) return undefined;
    if (this.reponses.question("Q2.1").is("11_PERMISSION"))
      return Fait.non(
        "Q2.1 : « 11_PERMISSION » ; une permission n'est ni un transfert ni un déplacement pour soins (option 9 écartée).",
      );
    if (this.reponses.question("Q2.2.1.a").is("1_OUI"))
      return Fait.non(
        "Q2.2.1.a : « 1_OUI » ; une permission n'est ni un transfert ni un déplacement pour soins (option 2 écartée).",
      );
    return undefined;
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
