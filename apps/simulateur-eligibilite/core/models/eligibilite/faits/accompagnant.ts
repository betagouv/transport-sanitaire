// fait_accompagnant : présence nécessaire d'un proche accompagnant.
//
// Q1.1 le dit : un proche accompagne le patient, ou il se déplace seul, ou
// un professionnel intervient.
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { AideDuPatient } from "../concepts/aide-du-patient.ts";
import type { DeclarationDeFait } from "../declarations/faits.ts";

export const accompagnant: DeclarationDeFait = ({ validated }) => {
  const aide = AideDuPatient.of(validated);
  return unFait()
    .ouiSi(aide.avecUnProche(), aide.provenance())
    .nonSi(
      aide.seDeplaceSeul() || aide.avecUnProfessionnel(),
      aide.provenance(),
    )
    .sinon(aide.provenance());
};
