// Les liens du transport : avec une ALD exonérante, avec un accident du
// travail ou une maladie professionnelle (AT/MP). La date de l'AT/MP vient de
// Q3.6.1, qui ne se pose que si P2 a établi le lien.

import type { Cibles } from "../../../../../core/models/eligibilite/declarations/cibles";
import type { Rubrique } from "./rubrique";

export type Liens = {
  readonly lien_ald: boolean;
  readonly lien_atmp: boolean;
  /** `AAAA-MM-JJ`. */
  readonly lien_atmp_date?: string;
};

export const LIENS: Rubrique<Liens> = {
  lien_ald: ({ cibles }) =>
    cibles.cible_ald_juridiquement_qualifiante_3_ou_4_degres.isOui(),
  lien_atmp: ({ cibles }) => atmp(cibles),
  lien_atmp_date: ({ validated, cibles }) =>
    atmp(cibles) ? validated.question("Q3.6.1").value : undefined,
};

// ---- implémentation ----

function atmp(cibles: Cibles): boolean {
  return cibles.cible_situation_at_mp.isOui();
}
