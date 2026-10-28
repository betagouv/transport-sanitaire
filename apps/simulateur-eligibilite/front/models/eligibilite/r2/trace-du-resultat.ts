// La trace du résultat : ce que les textes de R2 lisent (D-111). Une fonction
// pure des faits, des cibles et des réponses validées, sans React.
//
// Elle suit le « Contrat de trace » du README de l'éditeur, moins ce que nous
// ne portons pas : la version du paquet, l'empreinte du modèle et la révision
// (D-104 : une simulation se fait en une fois, sur le modèle chargé à
// l'ouverture). Un fait inconnu est une clé absente, jamais un « non ».
//
// R2 ne lit des réponses que `LU_PAR_R2` : le socle le calcule et le lui passe.
// Ce que R2 lit se sait donc sans le dérouler (#254).

import type { Cibles } from "../../../../core/models/eligibilite/declarations/cibles";
import type { Faits } from "../../../../core/models/eligibilite/declarations/faits";
import { dansLeCircuit } from "../../../../core/models/eligibilite/p2/retour-penitentiaire";
import { given } from "../../../../core/models/eligibilite/question";
import type { Value } from "../../../../core/socle";
import type { ResultatProps } from "../../../socle";
import {
  PRECISIONS,
  type Precisions,
  UN_SEJOUR_REEL,
} from "./precisions-du-resultat";

/** Ce que R2 reçoit du socle : les faits, les cibles, et `LU_PAR_R2`. */
export type Lecture = ResultatProps<Faits, Cibles, LuParR2>;

/** Ce que les textes de R2 lisent, pour des réponses et leurs cibles. */
export type Trace = {
  readonly cibles: Cibles;
  /** Les faits tels que les réponses les établissent. */
  readonly faits: Faits;
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

/** Ce que R2 lit des réponses validées, hors des faits et des cibles. */
export type LuParR2 = {
  /** Le trajet reste dans le circuit de prescription. */
  readonly dansLeCircuit: boolean;
  readonly trace: Omit<Trace, "cibles" | "faits">;
};

/** La trace de ces réponses, sur les questions validées. */
export function traceDuResultat({ reading, faits, cibles }: Lecture): Trace {
  return { cibles, faits, ...reading.trace };
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

/** Tout ce que R2 lit des réponses validées. */
export const LU_PAR_R2: Value<LuParR2> = given.all({
  dansLeCircuit,
  trace: LU_DES_REPONSES,
});
