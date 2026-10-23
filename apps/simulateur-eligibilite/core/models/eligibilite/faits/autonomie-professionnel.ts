// fait_autonomie_professionnel : intervention d'un professionnel nécessaire.
//
// Q1.1 le dit : un professionnel intervient, ou le patient s'en passe, seul
// ou avec un proche.
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { regles } from "../../../socle/index.ts";
import { AideDuPatient } from "../concepts/aide-du-patient.ts";
import type { DeclarationDeFait } from "../declarations/faits.ts";

export const autonomieProfessionnel: DeclarationDeFait = ({ validated }) => {
  const aide = AideDuPatient.of(validated);
  return regles()
    .ouiSi(aide.avecUnProfessionnel(), aide.provenance())
    .nonSi(aide.sansProfessionnel(), aide.provenance())
    .sinon(aide.provenance());
};
