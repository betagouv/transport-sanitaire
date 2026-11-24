// Le résultat de l'éligibilité (R2), dans l'ordre où il se calcule : ce que
// le socle lit pour lui (`R2.lit`), la trace que ses blocs lisent, le cas de
// l'issue, les textes de l'éditeur, puis la page.
//
// Trois cas ont une page (`layouts/`) : acceptée, une fiche patient positive ;
// refusée, une fiche patient négative ; orientée, la page du prescripteur,
// sans fiche. Chaque issue a sa famille, donc son cas (`issue.vo.ts`). Deux
// situations n'en ont pas : les règles n'ont pas conclu, ou un
// retour pénitentiaire sort du circuit de prescription, et R2 oriente vers
// l'administration pénitentiaire (point 34).
//
// R2 ne lit que `R2.lit` : le socle le calcule et le lui passe. Ce que R2 lit
// des réponses se sait donc sans le dérouler, et ce qu'il lit des cibles
// et des faits est ce que ses blocs déclarent. Ce que lit un cas ne
// compte que pour ses issues. La trace suit le « Contrat de trace » du
// README de l'éditeur, moins ce que nous ne portons pas : la version du
// paquet, l'empreinte du modèle et la révision. Un fait inconnu est
// une clé absente, jamais un « non ».

import {
  ACCEPTED_ISSUES,
  Issue,
  ORIENTED_ISSUES,
  REFUSED_ISSUES,
} from "../../../../core/models/eligibilite/cibles/issue.vo";
import type { Cibles } from "../../../../core/models/eligibilite/cibles/noms";
import type { Faits } from "../../../../core/models/eligibilite/faits/noms";
import { dansLeCircuit } from "../../../../core/models/eligibilite/questions/p2/questions/q2-2-1-indication";
import { given } from "../../../../core/models/eligibilite/questions/reponses";
import type { ValueOf } from "../../../../core/socle";
import type { FirstResult, ResultatProps } from "../../../socle";
import {
  type Lu,
  luPar,
  type ReponsesLues,
  type TraceDe,
} from "./components/ce-que-lit-un-bloc";
import type { CatalogueResultats } from "./components/forme-du-catalogue";
import { type Precisions, UN_SEJOUR_REEL } from "./components/precisions";
import { catalogueDeLaSession } from "./components/textes-de-l-editeur";
import { pageAcceptee } from "./layouts/acceptee/page";
import { PRECISIONS_DE_LA_FICHE_POSITIVE } from "./layouts/acceptee/precisions";
import { LU_PAR_LA_FICHE_POSITIVE } from "./layouts/acceptee/texte";
import { pageOrientee } from "./layouts/orientee/page";
import { PRECISIONS_DU_PRESCRIPTEUR } from "./layouts/orientee/precisions";
import { LU_PAR_LE_PRESCRIPTEUR } from "./layouts/orientee/texte";
import { pageRefusee } from "./layouts/refusee/page";
import { PRECISIONS_DE_LA_FICHE_NEGATIVE } from "./layouts/refusee/precisions";
import { LU_PAR_LA_FICHE_NEGATIVE } from "./layouts/refusee/texte";

/** Ce que R2 reçoit du socle : `R2.lit`. */
export type Lecture = ResultatProps<LuParR2>;

/**
 * Tout ce que les blocs de R2 peuvent lire, pour des réponses et leurs
 * cibles. Un bloc n'en reçoit que ce qu'il déclare (`TraceDe`).
 */
export type Trace = Lu<keyof Cibles & string, keyof Faits & string> &
  ReponsesLues;

/** Le cas d'une lecture : un des trois qui ont une page, ou aucun. */
export type Cas =
  | "acceptée"
  | "refusée"
  | "orientée"
  | "sans issue"
  | "hors circuit";

export class R2 {
  /** Tout ce que R2 lit : le socle le lui passe, et rien d'autre. */
  static get lit(): typeof LU_PAR_R2 {
    return LU_PAR_R2;
  }

  static of(lecture: Lecture): R2 {
    return new R2(lecture);
  }

  private readonly lecture: Lecture;

  private constructor(lecture: Lecture) {
    this.lecture = lecture;
  }

  /** La trace de cette lecture : ce que lisent les blocs de R2. */
  get trace(): TraceDe<typeof LU_PAR_LES_CAS> {
    const { textes, reponses } = this.lecture.reading;
    return { ...textes, ...reponses };
  }

  get cas(): Cas {
    const { dansLeCircuit, issue: cible } = this.lecture.reading;
    if (!dansLeCircuit) return "hors circuit";
    const issue = Issue.of(cible);
    if (!issue) return "sans issue";
    if (issue.isAccepted()) return "acceptée";
    return issue.isRefused() ? "refusée" : "orientée";
  }

  /** Les textes de l'éditeur, chargés à la demande. */
  textes(): Promise<Chargement> {
    return catalogueDeLaSession();
  }

  /** La page du cas : son titre, son corps, sa fiche s'il en a une. */
  page(): FirstResult | Promise<FirstResult> {
    const issue = Issue.of(this.lecture.reading.issue);
    if (this.cas === "hors circuit") return ORIENTATION_PENITENTIAIRE;
    if (!issue) return SANS_ISSUE;
    return this.textes().then((chargement) =>
      "echec" in chargement
        ? CHARGEMENT_EN_ECHEC
        : this.pageDe(issue, chargement.catalogue),
    );
  }

  private pageDe(issue: Issue, catalogue: CatalogueResultats): FirstResult {
    if (issue.isAccepted())
      return pageAcceptee(catalogue, this.trace, issue.id);
    if (issue.isOriented())
      return pageOrientee(catalogue, this.trace, issue.id);
    return pageRefusee(catalogue, this.trace);
  }
}

// ---- implémentation ----

type Chargement = Awaited<ReturnType<typeof catalogueDeLaSession>>;
type LuParR2 = ValueOf<typeof LU_PAR_R2>;

const ISSUE = given.cible("cible_issue_id");

// Q2.8.5 dit si la permission se répète. Sans réponse, la clé reste absente.
const REPETITION = given
  .question("Q2.8.5")
  .answer()
  .compute((repetition): { permissionRepeated?: boolean } => {
    if (repetition.is("1_OUI")) return { permissionRepeated: true };
    if (repetition.is("2_NON")) return { permissionRepeated: false };
    return {};
  });

// Q2.3.2.terrestre dit si le trajet en ligne régulière a une partie
// terrestre. Sans réponse, la clé reste absente : jamais un « non » (R03).
const PARTIE_TERRESTRE = given
  .question("Q2.3.2.terrestre")
  .answer()
  .compute((terrestre): { partieTerrestre?: boolean } => {
    if (terrestre.is("1_OUI")) return { partieTerrestre: true };
    if (terrestre.is("2_NON")) return { partieTerrestre: false };
    return {};
  });

// Les précisions de chaque cas, sous ses issues.
const PRECISIONS = given
  .all({
    acceptee: ISSUE.branch(ACCEPTED_ISSUES, PRECISIONS_DE_LA_FICHE_POSITIVE),
    refusee: ISSUE.branch(REFUSED_ISSUES, PRECISIONS_DE_LA_FICHE_NEGATIVE),
    orientee: ISSUE.branch(ORIENTED_ISSUES, PRECISIONS_DU_PRESCRIPTEUR),
  })
  .compute(
    ({ acceptee, refusee, orientee }): Precisions => ({
      ...acceptee,
      ...refusee,
      ...orientee,
    }),
  );

// Ce que la trace lit des réponses, en plus des faits et des cibles.
const LU_DES_REPONSES = given
  .all({
    criteres: given
      .question("Q1.2")
      .answer()
      // Le slug porte en tête le numéro de la réponse possible au catalogue.
      .compute((aides) =>
        aides
          .checkedBoxes()
          .map((possibleAnswer) => Number.parseInt(possibleAnswer, 10)),
      ),
    repetition: REPETITION,
    terrestre: PARTIE_TERRESTRE,
    sejourReel: UN_SEJOUR_REEL,
    precisions: PRECISIONS,
  })
  .compute(({ criteres, repetition, terrestre, sejourReel, precisions }) => ({
    criteres,
    ...repetition,
    ...terrestre,
    ...(sejourReel && { sejourReel: true as const }),
    precisions,
  }));

// Ce que lisent les blocs des trois cas, chacun sous ses issues.
const LU_PAR_LES_CAS = luPar(
  {},
  ISSUE.branch(ACCEPTED_ISSUES, LU_PAR_LA_FICHE_POSITIVE),
  ISSUE.branch(REFUSED_ISSUES, LU_PAR_LA_FICHE_NEGATIVE),
  ISSUE.branch(ORIENTED_ISSUES, LU_PAR_LE_PRESCRIPTEUR),
);

// Le circuit, l'issue qui choisit le cas, ce que lisent les cas, et ce qu'ils
// tirent des réponses validées.
const LU_PAR_R2 = given.all({
  dansLeCircuit,
  issue: ISSUE,
  textes: LU_PAR_LES_CAS,
  reponses: LU_DES_REPONSES,
});

// Sans issue, les règles n'ont pas pu conclure : un fait dont elles dépendent
// est absent.
const SANS_ISSUE: FirstResult = {
  title: "L’éligibilité n’a pas pu être calculée",
  body: (
    <p>
      Les réponses données ne suffisent pas à calculer l’éligibilité : le
      questionnaire n’est pas complet.
    </p>
  ),
};

// Le titre et le texte de `CONTRAT_ORIENTATION_ADMINISTRATIVE.json`, sans
// introduction : aucune fiche ne suit.
const ORIENTATION_PENITENTIAIRE: FirstResult = {
  title: "Ce retour relève de l’organisation pénitentiaire",
  body: (
    <p>
      Ce déplacement a été identifié comme exclusivement administratif, sans
      indication médicale de transport. Rapprochez-vous de l’administration
      pénitentiaire pour organiser le déplacement.
    </p>
  ),
};

// Le chargement en échec donne un titre et une phrase, sans rien inventer.
// Rien ne le suit : sans textes, rien n'est à compléter.
const CHARGEMENT_EN_ECHEC: FirstResult = {
  title: "Le résultat n’a pas pu être affiché",
  terminal: true,
  body: (
    <p role="alert">
      Les textes du résultat n’ont pas pu être chargés. Rechargez la page.
    </p>
  ),
};
