// Les cas particuliers du patient (Q1.3), et l'hémodialyse que Q1.3.a précise.
// Les faits de la corpulence, du partage, de l'ALD et du mineur les lisent,
// comme la prestation, qui reprend la séance qualifiante de P1, et sa page :
// une séance cochée ne se revote pas en Q2.1, et Q2.1.f se demande quand
// plusieurs séances comptent.
//
// Ils se construisent sur des réponses données comme sur des réponses
// validées. Ils donnent le fait d'un cas, sans déclarer de fait du catalogue.

import {
  type AnswersReader,
  type Fait,
  type GivenAnswer,
  unFait,
} from "../../../socle/index.ts";
import type { Questions } from "../declarations/questions.ts";
import { AideDuPatient } from "./aide-du-patient.ts";
import { CriteresDuTransport } from "./criteres-du-transport.ts";

type Cas = Questions["Q1.3"][number];

/** Les cas qui fondent un motif, avec la preuve clinique d'une déficience. */
type Fondement = "2_ALD" | "8_MINEUR_SOINS_CONTINUS";

/** Les cas particuliers que ces réponses disent. */
export class CasParticuliers {
  private readonly reponses: AnswersReader<Questions>;
  private readonly cas: GivenAnswer<Questions["Q1.3"]>;
  private readonly hemodialyse: GivenAnswer<Questions["Q1.3.a"]>;

  private constructor(reponses: AnswersReader<Questions>) {
    this.reponses = reponses;
    this.cas = reponses.question("Q1.3");
    this.hemodialyse = reponses.question("Q1.3.a");
    Object.freeze(this);
  }

  /** Les cas de ces réponses, données ou validées. */
  static of(reponses: AnswersReader<Questions>): CasParticuliers {
    return new CasParticuliers(reponses);
  }

  /** Le cas est coché, ou Q1.3 est validée sans lui. */
  coche(option: Cas): Fait {
    return unFait()
      .ouiSi(this.cas.checked(option), `Q1.3 : « ${option} » coché.`)
      .nonSi(this.cas.hasAnswer(), `Q1.3 validée sans « ${option} ».`)
      .sinon(Q13_EN_ATTENTE);
  }

  /**
   * L'ALD ou le mineur en soins continus (CONTRAT_Q13_ALD_MINEUR.json) : le
   * cas coché, et la preuve clinique d'une déficience. Le lien de l'ALD, comme
   * la reconnaissance du mineur, la demandent.
   */
  fondement(option: Fondement): Fait {
    if (!this.cas.checked(option)) return this.coche(option);
    const preuve = this.preuveClinique();
    return preuve.avecProvenance(
      `Q1.3 : « ${option} » coché. ${preuve.provenance}`,
    );
  }

  /**
   * La séance qualifiante que P1 établit : une chimiothérapie, une
   * radiothérapie, ou une hémodialyse confirmée par Q1.3.a. Une autre dialyse,
   * ou une dialyse non précisée, ne suffit pas. Son « non » attend Q2.1.g, en
   * P2.
   */
  seance(): Fait {
    const seance = SEANCES_SANS_PRECISION.find((option) =>
      this.cas.checked(option),
    );
    return unFait()
      .ouiSi(seance !== undefined, `Q1.3 : « ${seance} » coché.`)
      .ouiSi(this.hemodialyse.is("1_OUI"), "Q1.3.a : une séance d'hémodialyse.")
      .sinon(
        this.cas.hasAnswer()
          ? "Aucune séance qualifiante en P1 : Q2.1.g décidera."
          : Q13_EN_ATTENTE,
      );
  }

  /**
   * Q1.3 est validée sans séance qualifiante : ni chimiothérapie, ni
   * radiothérapie, ni hémodialyse (Q1.3.a).
   */
  sansSeance(): boolean {
    if (!this.cas.hasAnswer()) return false;
    return (
      SEANCES_SANS_PRECISION.every((seance) => !this.cas.checked(seance)) &&
      this.hemodialyse.isNot("1_OUI")
    );
  }

  /** Une séance est cochée, qualifiante ou non. */
  uneSeance(): boolean {
    return SEANCES.some((seance) => this.cas.checked(seance));
  }

  /**
   * Plusieurs séances de familles différentes comptent-elles ? Une dialyse ne
   * compte que si Q1.3.a confirme l'hémodialyse (COR-17, D-131).
   */
  plusieursSeances(): boolean {
    const hemodialyse = this.hemodialyse.is("1_OUI");
    return (
      SEANCES.filter(
        (seance) =>
          this.cas.checked(seance) && (seance !== "5_DIALYSE" || hemodialyse),
      ).length >= 2
    );
  }

  // L'aide nécessaire d'un proche (Q1.1 réponse 2), ou un critère de Q1.2. Le
  // patient qui se déplace seul n'a pas de déficience. Une Q1.2 qui ne se pose
  // pas, après un proche, n'en dit pas l'absence.
  private preuveClinique(): Fait {
    const aide = AideDuPatient.of(this.reponses);
    const critere = CriteresDuTransport.of(this.reponses).premier();
    return unFait()
      .ouiSi(aide.avecUnProche(), "Q1.1 : l'aide d'un proche est nécessaire.")
      .nonSi(aide.seDeplaceSeul(), "Q1.1 : le patient se déplace seul.")
      .ouiSi(
        aide.avecUnProfessionnel() && critere !== undefined,
        `Q1.2 : « ${critere} » coché.`,
      )
      .sinon("Ni Q1.1 ni Q1.2 n'établissent encore une déficience.");
  }
}

// ---- implémentation ----

const Q13_EN_ATTENTE = "Q1.3 n'est pas encore validée.";

// Les séances de Q1.3, et celles qui qualifient sans précision de Q1.3.a.
const SEANCES = ["3_CHIMIOTHERAPIE", "4_RADIOTHERAPIE", "5_DIALYSE"] as const;
const SEANCES_SANS_PRECISION = ["3_CHIMIOTHERAPIE", "4_RADIOTHERAPIE"] as const;
