// Les motifs de prise en charge que la PMT coche (rubrique ①) : l'entrée ou la
// sortie d'hospitalisation, ou la séance qualifiée, l'ALD et l'AT/MP.
//
// L'hospitalisation suit la cible des règles : la dialyse en centre seule ne
// la donne pas, un HTNM non plus. La case « ALD non exonérante » ne vaut que
// pour le mineur reconnu en soins prolongés, sans ALD à 100 % établie : les
// règles ne donnent jamais les deux cases ensemble (#128). L'ALD exonérante et
// l'AT/MP sont les liens du transport, sous les noms de la PMT.

import { given } from "../../../../../core/models/eligibilite/question";
import { LIENS } from "./liens";
import type { Rubrique } from "./rubrique";

export type Motifs = {
  readonly hospitalisation: boolean;
  readonly ald_exo: boolean;
  readonly ald_non_exo: boolean;
  readonly atmp: boolean;
  /** `AAAA-MM-JJ`. */
  readonly atmp_date?: string;
};

export const MOTIFS: Rubrique<Motifs> = {
  hospitalisation: given
    .cible("cible_hospitalisation_ou_seances_assimilees")
    .isOui(),
  ald_exo: LIENS.lien_ald,
  ald_non_exo: given.cible("cible_mineur_ald_non_exonerante_reconnue").isOui(),
  atmp: LIENS.lien_atmp,
  atmp_date: LIENS.lien_atmp_date,
};
