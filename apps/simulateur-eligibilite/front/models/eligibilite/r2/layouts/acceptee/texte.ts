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
// (#221) ; en accord préalable, ni cartes ni étapes. Son mode se dit en texte,
// avant la raison. Avec une partie terrestre (Q2.3.2.terrestre), celle-ci se
// dit aussi en texte, après la raison, et ses étapes viennent à part, sans
// badge (v10.2.1, R01 et R03 ; `rendu-resultats.mjs` de l'éditeur). Elle lit
// ce que lisent ces textes (`ce-que-lit-un-texte.ts`).

import type { AcceptedIssueId } from "../../../../../../core/models/eligibilite/cibles/issue.vo";
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
   * Le mode d'un trajet en ligne régulière, en texte, avant la raison. Absent
   * pour un trajet terrestre : ses cartes disent son mode.
   */
  readonly modeDuTrajet?: string;
  /** La partie terrestre d'un trajet en ligne régulière, si elle est établie. */
  readonly partieTerrestre?: PartieTerrestre;
  readonly consignes: Consignes;
  readonly finance: Bloc;
  /** Les motifs que la raison affiche. */
  readonly motifs: readonly Motif[];
};

/** La partie terrestre : son mode en texte, puis les étapes de ce mode. */
export type PartieTerrestre = {
  readonly mode: string;
  readonly titre: string;
  readonly etapes: Consignes["etapes"];
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
  const modus = libelle && modusDuMode(issue, libelle);
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
  return {
    titreDuPrescripteur,
    titreDuPatient: titre,
    ...(fondement.raison !== undefined && { raison: fondement.raison }),
    cartes: sansCartes ? [] : cartesDeLaFiche(issue, trace),
    ...modeDuTrajet(issue, trace, fondement.motifAdministratif),
    consignes: sansCartes ? { ...consignes, etapes: [] } : consignes,
    finance: issue.finance,
    motifs: fondement.motifs,
  };
}

// ---- implémentation ----

type LuParLaFiche = TraceDe<typeof LU_PAR_LA_FICHE_POSITIVE>;

// Le mode d'un trajet en ligne régulière, et celui de sa partie terrestre. Ces
// mots ne sont pas dans le catalogue : ce sont ceux de la projection et du
// rendu de l'éditeur (`integration_resultats/projection-positive.mjs` et
// `rendu-resultats.mjs`, v10.2.1).
const MODE_EN_LIGNE_REGULIERE =
  "Mode de transport : Avion ou bateau de ligne régulière";
const PARTIE_TERRESTRE = "Partie terrestre : ";
const TITRE_DE_LA_PARTIE_TERRESTRE = "Pour la partie terrestre du trajet";

type ModeDuTrajet = Pick<
  TexteDeLaFichePositive,
  "modeDuTrajet" | "partieTerrestre"
>;

// Le mode d'un trajet en ligne régulière, et sa partie terrestre si
// Q2.3.2.terrestre l'établit. Ses étapes sont celles du modus de son mode,
// sans badge : l'éditeur n'en donne aucun en ligne régulière (R01).
function modeDuTrajet(
  issue: CatalogueResultats["issues"][AcceptedIssueId],
  trace: LuParLaFiche,
  motif: string | undefined,
): ModeDuTrajet {
  if (porteeDuTrajet(trace) === "L") return {};
  const mode = { modeDuTrajet: MODE_EN_LIGNE_REGULIERE };
  const terrestre =
    porteeDuTrajet(trace) === "M-TERRE" && libelleDuModeTerrestre(trace);
  const modus = terrestre && modusDuMode(issue, terrestre);
  if (!terrestre || !modus) return mode;
  const { etapes } = consignesDuModus(modus, motif, SANS_BADGE);
  const partieTerrestre = {
    mode: PARTIE_TERRESTRE + terrestre,
    titre: TITRE_DE_LA_PARTIE_TERRESTRE,
    etapes,
  };
  return { ...mode, partieTerrestre };
}

const SANS_BADGE: readonly string[] = [];

// Une demande d'accord préalable en ligne régulière n'a pas de cartes, même
// avec une partie terrestre (TS1014-J04, R01), ni étapes : elle ne garde que
// son introduction. Les étapes de la partie terrestre viennent à part.
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
    };
  }
  const issue = catalogue.issues[issueId];
  if ("intro" in issue) return fondementDeLAccord(issue, trace);
  const contexte = motifDuContexte(issue, trace);
  return {
    raison: phraseDuContexte(issue, trace),
    motifAdministratif: motifAdministratif(issue, trace),
    motifs: contexte ? [motifDe(contexte)] : [],
  };
}
