// La permission de sortie (Q2.7 et Q2.8) : ce que ses réponses disent du
// patient, de la première permission et de leur répétition. Les pages de P2 et
// de P3, les faits de la permission et la trace de R2 la lisent (D-107).
//
// Elle se construit sur des réponses données, pour la cohérence d'une page,
// comme sur des réponses validées, pour un fait ou un résultat. Elle lit ses
// réponses une fois, et ne pose aucun fait.

import {
  type AnswersReader,
  type GivenAnswer,
  LocalDateTime,
} from "../../../socle/index.ts";
import type { Questions } from "../declarations/questions.ts";
import type { Inconnu } from "../question.ts";

/** La permission que ces réponses décrivent. */
export class Permission {
  private readonly tranche: GivenAnswer<Questions["Q2.7"]>;
  private readonly hospitalisation: LocalDateTime;
  private readonly debut: LocalDateTime;
  private readonly fin: LocalDateTime;
  private readonly repetition: GivenAnswer<Questions["Q2.8.5"]>;
  private readonly finDeLaPeriode: LocalDateTime;
  private readonly semaines: Questions["Q2.8.6.a"] | Inconnu;

  private constructor(reponses: AnswersReader<Questions>) {
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
  static of(reponses: AnswersReader<Questions>): Permission {
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
