// Le nombre que ce document prescrit (Q3.1.1), sur la PMT et la DAP : celui
// des trajets du sens choisi. Trois allers-retours valent 3, la case
// aller-retour cochée, et non 6 (`CONTRAT_Q31_QUANTITES.json`, D-246). Il ne
// compte que ceux de ce document : deux documents peuvent former une série.

import { given } from "../../../../../core/models/eligibilite/questions/question";
import type { Rubrique } from "./rubrique";

export type Nombre = {
  readonly nombre?: string;
};

export const NOMBRE: Rubrique<Nombre> = {
  nombre: given
    .question("Q3.1.1")
    .answer()
    .compute(({ value }) => (value === undefined ? undefined : String(value))),
};
