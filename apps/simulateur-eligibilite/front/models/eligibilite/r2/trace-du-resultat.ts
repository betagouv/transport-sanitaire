// La trace du résultat : ce que les textes de R2 lisent (D-111). Une fonction
// pure des faits, des cibles et des réponses validées, sans React.
//
// Elle suit le « Contrat de trace » du README de l'éditeur, moins ce que nous
// ne portons pas : la version du paquet, l'empreinte du modèle et la révision
// (D-104 : une simulation se fait en une fois, sur le modèle chargé à
// l'ouverture). Un fait inconnu est une clé absente, jamais un « non ».
//
// R2 ne lit que `LU_PAR_R2` : le socle le calcule et le lui passe. Ce que R2
// lit des réponses se sait donc sans le dérouler (#254), et ce qu'il lit des
// cibles et des faits est ce que ses textes déclarent (#260). Ce que lit un
// texte ne compte que pour les issues qui le montrent (#255).

import type { Cibles } from "../../../../core/models/eligibilite/declarations/cibles";
import type { Faits } from "../../../../core/models/eligibilite/declarations/faits";
import { dansLeCircuit } from "../../../../core/models/eligibilite/p2/retour-penitentiaire";
import { given } from "../../../../core/models/eligibilite/question";
import type { ValueOf } from "../../../../core/socle";
import type { ResultatProps } from "../../../socle";
import { type Lu, luPar, type TraceDe } from "./ce-que-lit-un-texte";
import { LU_PAR_LA_FICHE_NEGATIVE } from "./fiche-negative/texte-de-la-fiche-negative";
import { LU_PAR_LA_FICHE_POSITIVE } from "./fiche-positive/texte-de-la-fiche-positive";
import {
  PRECISIONS_DE_LA_FICHE_NEGATIVE,
  PRECISIONS_DE_LA_FICHE_POSITIVE,
  PRECISIONS_DU_PRESCRIPTEUR,
  type Precisions,
  UN_SEJOUR_REEL,
} from "./precisions-du-resultat";
import { LU_PAR_LE_PRESCRIPTEUR } from "./prescripteur/texte-du-prescripteur";
import { issuesDuTexte } from "./texte-de-l-issue";

/** Ce que R2 reçoit du socle : `LU_PAR_R2`. */
export type Lecture = ResultatProps<LuParR2>;

/**
 * Tout ce que les textes de R2 peuvent lire, pour des réponses et leurs
 * cibles. Un texte n'en reçoit que ce qu'il déclare (`TraceDe`).
 */
export type Trace = Lu<keyof Cibles & string, keyof Faits & string> &
  ReponsesLues;

/** Ce que les textes de R2 lisent des réponses, hors des faits et des cibles. */
export type ReponsesLues = {
  /**
   * Les numéros de Q1.2 réellement choisis, tels que les réponses les disent.
   * Vide si Q1.2 ne s'est pas posée (Q1.1 prouve alors qu'elle ne s'applique
   * pas). Jamais refaits depuis `fait_critere_tap`, qui les regroupe.
   */
  readonly criteres: readonly number[];
  /** La réponse à Q2.8.5, si elle est validée. */
  readonly permissionRepeated?: boolean;
  /**
   * Une partie terrestre d'un trajet en ligne régulière est prouvée. Aucune
   * question ne la pose : Q2.3.2 dit la ligne régulière, pas ce qui l'entoure.
   * La clé reste donc absente.
   */
  readonly partieTerrestre?: true;
  /**
   * Un séjour réel est prouvé. Ce n'est pas une clé de l'éditeur : un texte de
   * R2 le lit ici, plutôt que de redécouper l'identifiant du lexique.
   */
  readonly sejourReel?: true;
  readonly precisions: Precisions;
};

/** Ce que R2 lit. */
export type LuParR2 = ValueOf<typeof LU_PAR_R2>;

/** La trace de ces réponses : ce que lisent les textes de R2. */
export function traceDuResultat({
  reading,
}: Lecture): TraceDe<typeof LU_PAR_LES_TEXTES> {
  return { ...reading.textes, ...reading.reponses };
}

// Q2.8.5 dit si la permission se répète. Sans réponse, la clé reste absente.
const REPETITION = given
  .question("Q2.8.5")
  .answer()
  .compute((repetition): { permissionRepeated?: boolean } => {
    if (repetition.is("1_OUI")) return { permissionRepeated: true };
    if (repetition.is("2_NON")) return { permissionRepeated: false };
    return {};
  });

const ISSUE = given.cible("cible_issue_id");

// Les précisions de chaque texte, sous les issues qui le montrent (D-224).
const PRECISIONS = given
  .all({
    positive: ISSUE.branch(
      issuesDuTexte("fiche positive"),
      PRECISIONS_DE_LA_FICHE_POSITIVE,
    ),
    negative: ISSUE.branch(
      issuesDuTexte("fiche négative"),
      PRECISIONS_DE_LA_FICHE_NEGATIVE,
    ),
    prescripteur: ISSUE.branch(
      issuesDuTexte("prescripteur"),
      PRECISIONS_DU_PRESCRIPTEUR,
    ),
  })
  .compute(
    ({ positive, negative, prescripteur }): Precisions => ({
      ...positive,
      ...negative,
      ...prescripteur,
    }),
  );

// Ce que la trace lit des réponses, en plus des faits et des cibles.
const LU_DES_REPONSES = given
  .all({
    criteres: given
      .question("Q1.2")
      .answer()
      // Le slug porte en tête le numéro de l'option au catalogue (D-75).
      .compute((aides) =>
        aides.checkedBoxes().map((option) => Number.parseInt(option, 10)),
      ),
    repetition: REPETITION,
    sejourReel: UN_SEJOUR_REEL,
    precisions: PRECISIONS,
  })
  .compute(({ criteres, repetition, sejourReel, precisions }) => ({
    criteres,
    ...repetition,
    ...(sejourReel && { sejourReel: true as const }),
    precisions,
  }));

// Ce que lisent les textes de R2 : les deux fiches et le prescripteur.
const LU_PAR_LES_TEXTES = luPar(
  {},
  ISSUE.branch(issuesDuTexte("fiche positive"), LU_PAR_LA_FICHE_POSITIVE),
  ISSUE.branch(issuesDuTexte("fiche négative"), LU_PAR_LA_FICHE_NEGATIVE),
  ISSUE.branch(issuesDuTexte("prescripteur"), LU_PAR_LE_PRESCRIPTEUR),
);

/**
 * Tout ce que R2 lit : le circuit, l'issue qui choisit le texte, ce que lisent
 * les textes, et ce qu'ils tirent des réponses validées.
 */
export const LU_PAR_R2 = given.all({
  dansLeCircuit,
  issue: ISSUE,
  textes: LU_PAR_LES_TEXTES,
  reponses: LU_DES_REPONSES,
});
