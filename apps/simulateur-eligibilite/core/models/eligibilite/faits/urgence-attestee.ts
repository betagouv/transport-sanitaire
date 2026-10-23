// fait_urgence_attestee : urgence attestée par le médecin prescripteur.
//
// Q2.3.4 le dit sur la page du trajet, ou Q2.12 quand la branche la reprend :
// « Oui » l'établit, « Non » vaut « non ».
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { Urgence } from "../concepts/urgence.ts";
import type { DeclarationDeFait } from "../declarations/faits.ts";

export const urgenceAttestee: DeclarationDeFait = ({ validated }) =>
  Urgence.of(validated).attestee();
