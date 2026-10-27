// fait_prefere_transport_commun : préférence transports en commun si mode
// non professionnel.
//
// Q1.4 le dit, et ne se pose qu'au patient qui se passe d'un professionnel.
// Sinon, la préférence est sans objet : elle vaut « non ».
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { AideDuPatient } from "../concepts/aide-du-patient.ts";
import type { DeclarationDeFait } from "../declarations/faits.ts";

export const prefereTransportCommun: DeclarationDeFait = ({ validated }) =>
  unFait()
    .selon(validated.question("Q1.4"), {
      "1_VEHICULE_PERSONNEL": "non",
      "2_TRANSPORTS_EN_COMMUN": "oui",
    })
    .nonSi(
      AideDuPatient.of(validated).avecUnProfessionnel(),
      "Q1.4 ne se pose pas : un professionnel intervient.",
    )
    .sinon("Q1.4 n'est pas encore validée.");
