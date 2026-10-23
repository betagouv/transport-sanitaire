// Le résultat de la prescription préremplie (R3) : le texte du contrat, sous
// le stepper. Le socle pose ensuite les boutons, puis l'aperçu du document.

import { TEXTE_DU_RESULTAT } from "./titre-du-resultat";

/** R3 : le texte du contrat. */
export function PrescriptionPreremplie() {
  return <p>{TEXTE_DU_RESULTAT}</p>;
}
