// Le texte de la fiche patient positive, pour `ISSUE_PMT`, `ISSUE_S3141`
// (#135) et les deux issues d'accord préalable (#136). Une fonction pure, sans
// React.
//
// Tous les mots viennent du catalogue de l'éditeur, recopiés tels quels. Ce
// fichier choisit le titre, la phrase du contexte, la carte, les badges et le
// modus, puis les range : il n'en écrit aucun. Les blocs propres à l'accord
// préalable sont l'introduction (dans les consignes) et la justification dans
// la raison. Un trajet en avion ou en bateau de ligne régulière prend ses
// titres et son modus, ses cartes ont leur préfixe et il n'a pas de badge
// (#221) ; en accord préalable, ni cartes ni étapes. Son mode se dit en texte.
// Avec une partie terrestre (Q2.3.2.terrestre), celle-ci se dit aussi en texte,
// suivie des étapes et des badges de son mode (v10.2.1, R01 et R03). Elle lit
// ce que lisent ces textes (`ce-que-lit-un-texte.ts`).

import type { AcceptedIssueId } from "../../../../../../core/models/eligibilite/cibles/issue.vo";
import type { Portion } from "../../../../../socle";
import {
  badgesDuResultat,
  type CarteAffichee,
  cartesDeLaFiche,
  LU_PAR_LES_CARTES,
} from "../../components/cartes-et-badges";
import { luPar, type TraceDe } from "../../components/ce-que-lit-un-bloc";
import {
  type Consignes,
  consignesDuModus,
  modusDuMode,
} from "../../components/consignes-du-modus";
import {
  LU_PAR_LE_CONTEXTE,
  motifAdministratif,
  motifDuContexte,
  phraseDuContexte,
} from "../../components/contexte-du-resultat";
import {
  type FondementDeLAccord,
  fondementDeLAccord,
  LU_PAR_LE_FONDEMENT_DE_L_ACCORD,
} from "../../components/fondement-de-l-accord-prealable";
import type {
  AucunTexte,
  Bloc,
  CatalogueResultats,
} from "../../components/forme-du-catalogue";
import { type Motif, motifDe } from "../../components/motif";
import {
  LU_PAR_LA_PERMISSION,
  motifAdministratifDeLaPermission,
  phraseDeLaPermission,
} from "../../components/texte-de-la-permission";
import {
  LU_PAR_LE_LIBELLE,
  LU_PAR_LE_RANG_DU_TITRE,
  libelleDeLaFiche,
  libelleDuModeTerrestre,
  porteeDuTrajet,
  rangDuTitreDuPrescripteur,
} from "../../components/variante-du-resultat";

/** La fiche patient positive, et le titre que le prescripteur lit au-dessus. */
export type TexteDeLaFichePositive = {
  readonly titreDuPrescripteur: string;
  readonly titreDuPatient: string;
  /** Absente quand la trace n'établit aucun contexte, ni phrase de permission. */
  readonly raison?: string;
  readonly cartes: readonly CarteAffichee[];
  /**
   * Le mode d'un trajet en ligne régulière, puis sa partie terrestre, en
   * texte. Vide pour un trajet terrestre : ses cartes disent son mode.
   */
  readonly modeDuTrajet: readonly string[];
  readonly consignes: Consignes;
  readonly finance: Bloc;
  /** Les motifs que la raison affiche. */
  readonly motifs: readonly Motif[];
  /** Les portions du trajet que la fiche restitue. */
  readonly portions: readonly Portion[];
};

/** Ce que lit la fiche positive : ce que lisent ses textes. */
export const LU_PAR_LA_FICHE_POSITIVE = luPar(
  {},
  LU_PAR_LE_LIBELLE,
  LU_PAR_LE_RANG_DU_TITRE,
  LU_PAR_LE_CONTEXTE,
  LU_PAR_LA_PERMISSION,
  LU_PAR_LE_FONDEMENT_DE_L_ACCORD,
  LU_PAR_LES_CARTES,
);

/**
 * Le texte de la fiche de cette issue pour cette trace ; absent si les règles
 * n'ont pas donné de mode, ou si le catalogue n'a rien pour lui.
 */
export function texteDeLaFichePositive(
  catalogue: CatalogueResultats,
  trace: LuParLaFiche,
  issueId: AcceptedIssueId,
): TexteDeLaFichePositive | AucunTexte {
  const issue = catalogue.issues[issueId];
  const libelle = libelleDeLaFiche(trace);
  const titre = libelle && issue.titles[libelle];
  const terrestre = libelleDeLaPartieTerrestre(trace);
  const modus = libelle && modusDuMode(issue, terrestre ?? libelle);
  const titreDuPrescripteur =
    issue.prescriberTitles[rangDuTitreDuPrescripteur(trace)];
  if (!titre || !modus || !titreDuPrescripteur) return undefined;
  const fondement = fondementDe(catalogue, trace, issueId);
  const badges = badgesDuResultat(catalogue.badges, trace);
  const consignes = consignesDuModus(
    modus,
    fondement.motifAdministratif,
    badges,
    "intro" in issue ? issue.intro : undefined,
  );
  const sansCartes = sansCartesNiEtapes(issue, trace);
  const sansEtapes = sansCartes && terrestre === undefined;
  return {
    titreDuPrescripteur,
    titreDuPatient: titre,
    ...(fondement.raison !== undefined && { raison: fondement.raison }),
    cartes: sansCartes ? [] : cartesDeLaFiche(issue, trace),
    modeDuTrajet: modeDuTrajet(trace, terrestre),
    consignes: sansEtapes ? { ...consignes, etapes: [] } : consignes,
    finance: issue.finance,
    motifs: fondement.motifs,
    portions: fondement.portions,
  };
}

// ---- implémentation ----

type LuParLaFiche = TraceDe<typeof LU_PAR_LA_FICHE_POSITIVE>;

// Le mode d'un trajet en ligne régulière, et celui de sa partie terrestre. Ces
// mots ne sont pas dans le catalogue : ce sont ceux de la projection de
// l'éditeur (`integration_resultats/projection-positive.mjs`, v10.2.1).
const MODE_EN_LIGNE_REGULIERE =
  "Mode de transport : Avion ou bateau de ligne régulière";
const PARTIE_TERRESTRE = "Partie terrestre : ";

// Le libellé du mode de la partie terrestre, si Q2.3.2.terrestre l'établit.
// Il choisit le modus : ses étapes sont celles de cette partie (R01).
function libelleDeLaPartieTerrestre(trace: LuParLaFiche): string | AucunTexte {
  return porteeDuTrajet(trace) === "M-TERRE"
    ? libelleDuModeTerrestre(trace)
    : undefined;
}

function modeDuTrajet(
  trace: LuParLaFiche,
  terrestre: string | AucunTexte,
): readonly string[] {
  if (porteeDuTrajet(trace) === "L") return [];
  return terrestre === undefined
    ? [MODE_EN_LIGNE_REGULIERE]
    : [MODE_EN_LIGNE_REGULIERE, PARTIE_TERRESTRE + terrestre];
}

// Une demande d'accord préalable en ligne régulière n'a pas de cartes, même
// avec une partie terrestre (TS1014-J04, R01). Sans partie terrestre établie,
// elle n'a pas non plus d'étapes : elle ne garde que son introduction.
function sansCartesNiEtapes(
  issue: CatalogueResultats["issues"][AcceptedIssueId],
  trace: LuParLaFiche,
): boolean {
  return (
    "suppressCardsAndStepsForLine" in issue &&
    issue.suppressCardsAndStepsForLine &&
    porteeDuTrajet(trace) !== "L"
  );
}

// Pourquoi le transport est pris en charge : le contexte du soin pour la
// prescription médicale de transport, la permission pour le S3141, le contexte
// et la justification de l'accord pour une demande d'accord préalable.
// Seul l'accord préalable restitue des portions du trajet : les autres textes
// n'en nomment aucune.
function fondementDe(
  catalogue: CatalogueResultats,
  trace: LuParLaFiche,
  issueId: AcceptedIssueId,
): FondementDeLAccord {
  if (issueId === "ISSUE_S3141") {
    const issue = catalogue.issues.ISSUE_S3141;
    const phrase = phraseDeLaPermission(issue, trace);
    return {
      raison: phrase?.text,
      motifAdministratif: motifAdministratifDeLaPermission(issue, trace),
      motifs: phrase ? [motifDe(phrase)] : [],
      portions: [],
    };
  }
  const issue = catalogue.issues[issueId];
  if ("intro" in issue) return fondementDeLAccord(issue, trace);
  const contexte = motifDuContexte(issue, trace);
  return {
    raison: phraseDuContexte(issue, trace),
    motifAdministratif: motifAdministratif(issue, trace),
    motifs: contexte ? [motifDe(contexte)] : [],
    portions: [],
  };
}
