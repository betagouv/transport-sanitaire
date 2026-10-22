// Le résultat de la prescription préremplie (R3) : le texte du contrat, au-dessus
// des boutons que le socle pose. Tant que les documents se téléchargent vierges
// (#158 à #161), il récapitule aussi les réponses de P3, pour la recette.

import {
  type LectureDuComplement,
  recapitulatifDuComplement,
} from "./recapitulatif-du-complement";
import { TEXTE_DU_RESULTAT } from "./titre-du-resultat";

/** R3 : le texte du contrat, puis les réponses de P3 sous leur question. */
export function PrescriptionPreremplie(lecture: LectureDuComplement) {
  return (
    <>
      <p>{TEXTE_DU_RESULTAT}</p>
      {/* Sans le retrait que le DSFR donne aux listes. */}
      <dl style={{ paddingLeft: 0 }}>
        {recapitulatifDuComplement(lecture).map((ligne) => (
          <div key={ligne.question} style={{ marginBottom: "1rem" }}>
            <dt>{ligne.question}</dt>
            <dd style={{ margin: 0, paddingLeft: 0, fontWeight: 700 }}>
              {ligne.reponse}
            </dd>
          </div>
        ))}
      </dl>
    </>
  );
}
