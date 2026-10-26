// Les motifs de prise en charge que la PMT coche (rubrique ①) : l'entrée ou la
// sortie d'hospitalisation, ou la séance qualifiée, l'ALD et l'AT/MP.
//
// L'hospitalisation suit la cible des règles : la dialyse en centre seule ne
// la donne pas, un HTNM non plus. La case « ALD non exonérante » ne vaut que
// pour le mineur reconnu en soins prolongés, sans ALD à 100 % établie : les
// règles ne donnent jamais les deux cases ensemble (#128). L'ALD exonérante et
// l'AT/MP sont les liens du transport, sous les noms de la PMT.

import { LIENS } from "./liens";
import { uneRubrique } from "./rubrique";

export type Motifs = {
  readonly hospitalisation: boolean;
  readonly ald_exo: boolean;
  readonly ald_non_exo: boolean;
  readonly atmp: boolean;
  /** `AAAA-MM-JJ`. */
  readonly atmp_date?: string;
};

export const MOTIFS = uneRubrique("Motifs")
  .lit(
    "cible_hospitalisation_ou_seances_assimilees",
    "cible_mineur_ald_non_exonerante_reconnue",
    ...LIENS.lit,
  )
  .cellules<Motifs>({
    hospitalisation: ({ cibles }) =>
      cibles.cible_hospitalisation_ou_seances_assimilees.isOui(),
    ald_exo: LIENS.cellules.lien_ald,
    ald_non_exo: ({ cibles }) =>
      cibles.cible_mineur_ald_non_exonerante_reconnue.isOui(),
    atmp: LIENS.cellules.lien_atmp,
    atmp_date: LIENS.cellules.lien_atmp_date,
  });
