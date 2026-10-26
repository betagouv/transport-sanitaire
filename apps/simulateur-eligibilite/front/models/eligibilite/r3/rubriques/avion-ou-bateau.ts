// La situation d'un transport par avion ou bateau de ligne (rubrique ① de la
// DAP) : la personne accompagnante, puis ce à quoi le transport est lié. Elle
// ne se remplit que si l'avion ou le bateau est un motif de la DAP.
//
// Seule exception, « ALD non exonérante » : le mineur reconnu en soins
// prolongés la coche même sans avion ni bateau, que la DAP ne coche pas pour
// autant (#128). La personne accompagnante est celle de P1 sur ce trajet : les
// règles n'ont pas de cible propre au trajet aérien.

import { MOTIFS } from "./motifs";
import { avionOuBateau } from "./motifs-de-la-dap";
import { type Lues, uneRubrique } from "./rubrique";

export type AvionOuBateau = {
  readonly air_accompagnant: boolean;
  readonly air_hospitalisation: boolean;
  readonly air_ald_exo: boolean;
  readonly air_ald_non_exo: boolean;
  readonly air_atmp: boolean;
  /** `AAAA-MM-JJ`. */
  readonly air_atmp_date?: string;
};

// Ses cases reprennent celles des motifs de la PMT : elle lit ce qu'ils lisent.
const LUS = [
  "cible_personne_accompagnante",
  "cible_dap_motif_avion_bateau",
  ...MOTIFS.lit,
] as const;

type LuesParLAvion = Lues<(typeof LUS)[number]>;

export const AVION_OU_BATEAU = uneRubrique("Avion ou bateau")
  .lit(...LUS)
  .cellules<AvionOuBateau>({
    air_accompagnant: (donnees) =>
      siAvionOuBateau(donnees, ({ cibles }) =>
        cibles.cible_personne_accompagnante.isOui(),
      ),
    air_hospitalisation: (donnees) =>
      siAvionOuBateau(donnees, MOTIFS.cellules.hospitalisation),
    air_ald_exo: (donnees) => siAvionOuBateau(donnees, MOTIFS.cellules.ald_exo),
    air_ald_non_exo: MOTIFS.cellules.ald_non_exo,
    air_atmp: (donnees) => siAvionOuBateau(donnees, MOTIFS.cellules.atmp),
    air_atmp_date: (donnees) =>
      avionOuBateau(donnees.cibles)
        ? MOTIFS.cellules.atmp_date(donnees)
        : undefined,
  });

// ---- implémentation ----

// La case, si l'avion ou le bateau est un motif ; vide sinon.
function siAvionOuBateau(
  donnees: LuesParLAvion,
  coche: (donnees: LuesParLAvion) => boolean,
): boolean {
  return avionOuBateau(donnees.cibles) && coche(donnees);
}
