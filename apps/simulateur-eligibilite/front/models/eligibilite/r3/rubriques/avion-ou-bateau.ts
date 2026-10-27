// La situation d'un transport par avion ou bateau de ligne (rubrique ① de la
// DAP) : la personne accompagnante, puis ce à quoi le transport est lié. Elle
// ne se remplit que si l'avion ou le bateau est un motif de la DAP.
//
// Seule exception, « ALD non exonérante » : le mineur reconnu en soins
// prolongés la coche même sans avion ni bateau, que la DAP ne coche pas pour
// autant (#128). La personne accompagnante est celle de P1 sur ce trajet : les
// règles n'ont pas de cible propre au trajet aérien.

import { given } from "../../../../../core/models/eligibilite/question";
import type { Condition } from "../../../../../core/socle";
import { MOTIFS } from "./motifs";
import { MOTIFS_DE_LA_DAP } from "./motifs-de-la-dap";
import type { Rubrique } from "./rubrique";

export type AvionOuBateau = {
  readonly air_accompagnant: boolean;
  readonly air_hospitalisation: boolean;
  readonly air_ald_exo: boolean;
  readonly air_ald_non_exo: boolean;
  readonly air_atmp: boolean;
  /** `AAAA-MM-JJ`. */
  readonly air_atmp_date?: string;
};

const avionOuBateau = MOTIFS_DE_LA_DAP.avion_bateau;

export const AVION_OU_BATEAU: Rubrique<AvionOuBateau> = {
  air_accompagnant: siAvionOuBateau(
    given.cible("cible_personne_accompagnante").isOui(),
  ),
  air_hospitalisation: siAvionOuBateau(MOTIFS.hospitalisation),
  air_ald_exo: siAvionOuBateau(MOTIFS.ald_exo),
  air_ald_non_exo: MOTIFS.ald_non_exo,
  air_atmp: siAvionOuBateau(MOTIFS.atmp),
  air_atmp_date: avionOuBateau.computeWith(MOTIFS.atmp_date, (motif, date) =>
    motif ? date : undefined,
  ),
};

// ---- implémentation ----

// La case, si l'avion ou le bateau est un motif ; vide sinon.
function siAvionOuBateau(coche: Condition): Condition {
  return avionOuBateau.and(coche);
}
