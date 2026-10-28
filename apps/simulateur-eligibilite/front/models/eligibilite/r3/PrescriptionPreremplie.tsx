// Le résultat de la prescription préremplie (R3) : le texte du contrat, sous
// le stepper. Le socle pose ensuite les boutons, puis l'aperçu du document.

import { given } from "../../../../core/models/eligibilite/question";
import { TEXTE_DU_RESULTAT } from "./titre-du-resultat";

/** Le texte de R3 ne lit rien des réponses : le document les porte. */
export const RIEN_DES_REPONSES = given.all({});

/** R3 : le texte du contrat. */
export function PrescriptionPreremplie() {
  return <p>{TEXTE_DU_RESULTAT}</p>;
}
