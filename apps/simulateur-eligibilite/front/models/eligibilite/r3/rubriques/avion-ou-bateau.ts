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
import type { Donnees, Rubrique } from "./rubrique";

export type AvionOuBateau = {
  readonly air_accompagnant: boolean;
  readonly air_hospitalisation: boolean;
  readonly air_ald_exo: boolean;
  readonly air_ald_non_exo: boolean;
  readonly air_atmp: boolean;
  /** `AAAA-MM-JJ`. */
  readonly air_atmp_date?: string;
};

export const AVION_OU_BATEAU: Rubrique<AvionOuBateau> = {
  air_accompagnant: (donnees) =>
    siAvionOuBateau(donnees, ({ cibles }) =>
      cibles.cible_personne_accompagnante.isOui(),
    ),
  air_hospitalisation: (donnees) =>
    siAvionOuBateau(donnees, MOTIFS.hospitalisation),
  air_ald_exo: (donnees) => siAvionOuBateau(donnees, MOTIFS.ald_exo),
  air_ald_non_exo: MOTIFS.ald_non_exo,
  air_atmp: (donnees) => siAvionOuBateau(donnees, MOTIFS.atmp),
  air_atmp_date: (donnees) =>
    avionOuBateau(donnees.cibles) ? MOTIFS.atmp_date(donnees) : undefined,
};

// ---- implémentation ----

// La case, si l'avion ou le bateau est un motif ; vide sinon.
function siAvionOuBateau(
  donnees: Donnees,
  coche: (donnees: Donnees) => boolean,
): boolean {
  return avionOuBateau(donnees.cibles) && coche(donnees);
}
