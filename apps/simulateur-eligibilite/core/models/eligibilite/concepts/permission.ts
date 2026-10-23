// La permission de sortie : ce que Q2.7 et Q2.8 disent du patient, de la
// première permission et de leur répétition, et le transfert qu'écarte la
// question qui la pose (Q2.1 ou Q2.2.1.a). Les pages de P2 et de P3, les faits
// de la permission, du transfert et du Centre 15, et la trace de R2 la lisent
// (D-107).
//
// Elle se construit sur des réponses données, pour la cohérence d'une page,
// comme sur des réponses validées, pour un fait ou un résultat. Seules ces
// dernières savent si Q2.5 est validée. Elle donne le fait du transfert écarté,
// sans déclarer de fait du catalogue.

import {
  type AnswersReader,
  Fait,
  type GivenAnswer,
  LocalDateTime,
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
  private readonly hospitalisation: LocalDateTime;
  private readonly debut: LocalDateTime;
  private readonly fin: LocalDateTime;
  private readonly repetition: GivenAnswer<Questions["Q2.8.5"]>;
  private readonly finDeLaPeriode: LocalDateTime;
  private readonly semaines: Questions["Q2.8.6.a"] | Inconnu;

  private constructor(reponses: Reponses) {
    this.reponses = reponses;
    this.tranche = reponses.question("Q2.7");
    this.hospitalisation = date(reponses, "Q2.8.1");
    this.debut = date(reponses, "Q2.8.2");
    this.fin = date(reponses, "Q2.8.3");
    this.repetition = reponses.question("Q2.8.5");
    this.finDeLaPeriode = date(reponses, "Q2.8.6");
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

  /** La première permission commence avant le jour de l'hospitalisation. */
  commenceAvantLHospitalisation(): boolean {
    return this.debut.isBefore(this.hospitalisation);
  }

  /**
   * Elle commence avant le 14e jour d'hospitalisation. Le jour de
   * l'hospitalisation est le jour 1 : le 14e jour, à minuit, est permis.
   */
  commenceAvantLeQuatorziemeJour(): boolean {
    return this.debut.isBefore(
      this.hospitalisation.plusDays(PREMIER_JOUR_AUTORISE - 1),
    );
  }

  /** Elle finit en même temps que son début, ou avant. */
  neFinitPasApresSonDebut(): boolean {
    return this.fin.isAtOrBefore(this.debut);
  }

  /** Elle dure plus de 48 heures. 48 heures pile sont permises. */
  depasseQuaranteHuitHeures(): boolean {
    return this.fin.isAfter(this.debut.plusHours(DUREE_MAXIMALE_EN_HEURES));
  }

  /**
   * La période des permissions finit un jour avant la fin de la première. Le
   * jour même est permis : la période se donne en jours, la permission en
   * heures.
   */
  periodeFinitAvantLaPremiere(): boolean {
    return this.finDeLaPeriode.isBefore(this.fin.startOfDay());
  }

  /** Q2.8.5 dit plusieurs permissions. Chacune est un aller-retour. */
  estRepetee(): boolean {
    return this.repetition.is("1_OUI");
  }

  /** Q2.8.5 dit une permission unique. */
  estUnique(): boolean {
    return this.repetition.is("2_NON");
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
    if (this.semaines === undefined || this.semaines < 1) return undefined;
    return 2 * Math.ceil(31 / (7 * this.semaines));
  }
}

// ---- implémentation ----

/** La durée maximale d'une permission, en heures. */
const DUREE_MAXIMALE_EN_HEURES = 48;
/** La première permission commence au 14e jour d'hospitalisation, ou après. */
const PREMIER_JOUR_AUTORISE = 14;

type QuestionDeDate = "Q2.8.1" | "Q2.8.2" | "Q2.8.3" | "Q2.8.6";

function date(
  reponses: AnswersReader<Questions>,
  id: QuestionDeDate,
): LocalDateTime {
  return LocalDateTime.parse(reponses.question(id).value);
}
