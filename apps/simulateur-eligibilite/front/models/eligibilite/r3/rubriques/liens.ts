// Les liens du transport : avec une ALD exonérante, avec un accident du
// travail ou une maladie professionnelle (AT/MP). La date de l'AT/MP vient de
// Q3.6.1, qui ne se pose que si P2 a établi le lien.

import { given } from "../../../../../core/models/eligibilite/question";
import type { Rubrique } from "./rubrique";

export type Liens = {
  readonly lien_ald: boolean;
  readonly lien_atmp: boolean;
  /** `AAAA-MM-JJ`. */
  readonly lien_atmp_date?: string;
};

const atmp = given.cible("cible_situation_at_mp").isOui();

export const LIENS: Rubrique<Liens> = {
  lien_ald: given
    .cible("cible_ald_juridiquement_qualifiante_3_ou_4_degres")
    .isOui(),
  lien_atmp: atmp,
  lien_atmp_date: atmp.computeWith(
    given.question("Q3.6.1").answer(),
    (lie, { value }) => (lie ? value : undefined),
  ),
};
