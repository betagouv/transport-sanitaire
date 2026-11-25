// Le résultat de l'éligibilité (R2) : ce qu'il lit, et ce qu'il dit. Une
// donnée, sans React : le même résultat se rendrait à l'écran ou se renverrait
// tel quel en JSON.
//
// Dans l'ordre où il se calcule : ce que le socle lit pour lui (`R2.lit`), la
// trace que ses blocs lisent, puis le `ResultatR2` qu'on en tire avec le
// catalogue de l'éditeur. Chaque issue a sa famille (`issue.vo.ts`), donc son
// cas : acceptée, une fiche patient positive ; refusée, une fiche patient
// négative ; orientée, la page du prescripteur, sans fiche. Trois situations
// n'ont aucune fiche : les règles n'ont pas conclu (sans issue), elles n'ont
// pas choisi de mode (sans mode), ou un retour pénitentiaire sort du circuit de
// prescription et R2 oriente vers l'administration pénitentiaire (point 34).
//
// R2 ne lit que `R2.lit` : le socle le calcule et le lui passe. Ce que R2 lit
// des réponses se sait donc sans le dérouler, et ce qu'il lit des cibles
// et des faits est ce que ses blocs déclarent. Ce que lit un cas ne
// compte que pour ses issues. La trace suit le « Contrat de trace » du
// README de l'éditeur, moins ce que nous ne portons pas : la version du
// paquet, l'empreinte du modèle et la révision. Un fait inconnu est
// une clé absente, jamais un « non ».

import type { ValueOf } from "../../../socle/index.ts";
import {
  ACCEPTED_ISSUES,
  type AcceptedIssueId,
  Issue,
  ORIENTED_ISSUES,
  type OrientedIssueId,
  REFUSED_ISSUES,
} from "../cibles/issue.vo.ts";
import type { Cibles } from "../cibles/noms.ts";
import type { Faits } from "../faits/noms.ts";
import { dansLeCircuit } from "../questions/p2/questions/q2-2-1-indication.ts";
import { given } from "../questions/reponses.ts";
import { PRECISIONS_DE_LA_FICHE_POSITIVE } from "./acceptee/precisions.ts";
import {
  LU_PAR_LA_FICHE_POSITIVE,
  type TexteDeLaFichePositive,
  texteDeLaFichePositive,
} from "./acceptee/texte.ts";
import {
  type Lu,
  luPar,
  type ReponsesLues,
  type TraceDe,
} from "./blocs/ce-que-lit-un-bloc.ts";
import type { CatalogueResultats } from "./blocs/forme-du-catalogue.ts";
import { type Precisions, UN_SEJOUR_REEL } from "./blocs/precisions.ts";
import { PRECISIONS_DU_PRESCRIPTEUR } from "./orientee/precisions.ts";
import {
  LU_PAR_LE_PRESCRIPTEUR,
  selonLAffichage,
  type TexteDuPrescripteur,
  texteDuPrescripteur,
} from "./orientee/texte.ts";
import { PRECISIONS_DE_LA_FICHE_NEGATIVE } from "./refusee/precisions.ts";
import {
  LU_PAR_LA_FICHE_NEGATIVE,
  type TexteDeLaFicheNegative,
  texteDeLaFicheNegative,
} from "./refusee/texte.ts";

/** Ce que R2 reçoit du socle : `R2.lit`. */
export type Lecture = { readonly reading: LuParR2 };

/**
 * Tout ce que les blocs de R2 peuvent lire, pour des réponses et leurs
 * cibles. Un bloc n'en reçoit que ce qu'il déclare (`TraceDe`).
 */
export type Trace = Lu<keyof Cibles & string, keyof Faits & string> &
  ReponsesLues;

/**
 * Ce que le patient reçoit avec une fiche : la phrase qui l'annonce
 * (point 28), et l'invitation à donner son avis par courriel (TS1014-J01).
 * `avis.texte` se termine par une espace : le courriel le suit.
 */
export type FeuilleDuPatient = {
  readonly introduction: string;
  readonly avis: { readonly texte: string; readonly courriel: string };
};

/**
 * Le résultat de R2, d'après ses réponses : un cas, et ce qu'il porte. Les
 * cas sans fiche ne portent que leur phrase, s'ils en ont une de l'éditeur.
 */
export type ResultatR2 =
  | {
      readonly cas: "hors circuit";
      readonly titre: string;
      readonly texte: string;
    }
  | { readonly cas: "sans issue" }
  | { readonly cas: "sans mode" }
  | {
      readonly cas: "acceptée";
      readonly issue: AcceptedIssueId;
      readonly fiche: TexteDeLaFichePositive;
      readonly feuille: FeuilleDuPatient;
    }
  | {
      readonly cas: "refusée";
      readonly fiche: TexteDeLaFicheNegative;
      readonly feuille: FeuilleDuPatient;
    }
  | {
      readonly cas: "orientée";
      readonly issue: OrientedIssueId;
      readonly page: TexteDuPrescripteur;
    };

/** Le résultat attend le catalogue : une issue le demande. */
export type DemandeLeCatalogue = undefined;

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

  /**
   * Le résultat quand il ne tient pas au catalogue : hors circuit, ou sans
   * issue. Absent quand une issue le demande.
   */
  get sansCatalogue(): ResultatR2 | DemandeLeCatalogue {
    const choix = this.choix();
    return choix instanceof Issue ? undefined : choix;
  }

  /** Le résultat de cette lecture, avec les textes de l'éditeur. */
  resultat(catalogue: CatalogueResultats): ResultatR2 {
    const choix = this.choix();
    return choix instanceof Issue ? this.deLIssue(choix, catalogue) : choix;
  }

  // Hors circuit d'abord : l'issue ne compte alors pas. Sans issue, les règles
  // n'ont pas pu conclure : un fait dont elles dépendent est absent.
  private choix(): ResultatR2 | Issue {
    const { dansLeCircuit, issue } = this.lecture.reading;
    if (!dansLeCircuit) return ORIENTATION_PENITENTIAIRE;
    return Issue.of(issue) ?? SANS_ISSUE;
  }

  private deLIssue(issue: Issue, catalogue: CatalogueResultats): ResultatR2 {
    const { trace } = this;
    if (issue.isAccepted()) {
      const fiche = texteDeLaFichePositive(catalogue, trace, issue.id);
      if (!fiche) return SANS_MODE;
      return {
        cas: "acceptée",
        issue: issue.id,
        fiche,
        feuille: feuille(catalogue),
      };
    }
    if (issue.isOriented()) {
      const { id } = issue;
      const texte = texteDuPrescripteur(catalogue, id, trace);
      const page = selonLAffichage(texte, catalogue.issues[id]);
      return { cas: "orientée", issue: id, page };
    }
    const fiche = texteDeLaFicheNegative(catalogue, trace);
    return { cas: "refusée", fiche, feuille: feuille(catalogue) };
  }
}

// ---- implémentation ----

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

const SANS_ISSUE: ResultatR2 = { cas: "sans issue" };

// Sans mode, les règles n'ont pas pu choisir le transport : un fait dont elles
// dépendent est absent, ou le catalogue n'a aucun texte pour ce mode.
const SANS_MODE: ResultatR2 = { cas: "sans mode" };

// Le titre et le texte de `CONTRAT_ORIENTATION_ADMINISTRATIVE.json`, sans
// introduction : aucune fiche ne suit.
const ORIENTATION_PENITENTIAIRE: ResultatR2 = {
  cas: "hors circuit",
  titre: "Ce retour relève de l’organisation pénitentiaire",
  texte:
    "Ce déplacement a été identifié comme exclusivement administratif, sans indication médicale de transport. Rapprochez-vous de l’administration pénitentiaire pour organiser le déplacement.",
};

function feuille({
  patientSheetIntro,
  patientFeedback,
}: CatalogueResultats): FeuilleDuPatient {
  return {
    introduction: patientSheetIntro,
    avis: { texte: patientFeedback.text, courriel: patientFeedback.email },
  };
}
