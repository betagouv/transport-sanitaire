// fait_htnm_hors_maternite : segment HTNM hors Engagement maternité.
//
// Q2.1 = 13 décrit un trajet de l'Engagement maternité. Les options 4 et 5 de
// Q2.2.1.b s'excluent pour un même trajet (`CONTRAT_CONTEXTES_DECISIFS.md`) :
// il n'est pas un HTNM hors maternité. Sinon, l'autre cadre de Q2.2.1 le dit.
// Le HTNM se dit hors Engagement maternité dans son libellé même (point 11).
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { regles } from "../../../socle/index.ts";
import { ContextesDuTrajet } from "../concepts/contextes-du-trajet.ts";
import {
  type DeclarationDeFait,
  PAS_ENCORE_ETABLI,
} from "../declarations/faits.ts";

export const htnmHorsMaternite: DeclarationDeFait = ({ validated }) =>
  regles()
    .nonSi(
      validated.question("Q2.2.1").hasAnswer() &&
        validated.question("Q2.1").is("13_MATERNITE"),
      "Q2.1 : « 13_MATERNITE » ; le même trajet n'est pas un HTNM hors maternité.",
    )
    .retient(ContextesDuTrajet.of(validated).situation("5_HTNM"))
    .sinon(PAS_ENCORE_ETABLI);
