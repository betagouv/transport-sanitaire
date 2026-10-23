// Le résultat de la prescription préremplie (R3) : le texte du contrat, sous
// le stepper. Le socle pose ensuite les boutons, puis l'aperçu du document. Le
// S3141 se remplit (#158) : il se montre. Tant que la PMT et la DAP sortent
// vierges (#160, #161), les réponses de P3 tiennent la place de leur aperçu,
// pour la recette.

import type { ReactNode } from "react";
import { sortVierge } from "./documents-du-resultat";
import {
  type LectureDuComplement,
  recapitulatifDuComplement,
} from "./recapitulatif-du-complement";
import { TEXTE_DU_RESULTAT } from "./titre-du-resultat";

/** R3 : le texte du contrat. */
export function PrescriptionPreremplie() {
  return <p>{TEXTE_DU_RESULTAT}</p>;
}

/**
 * À la place de l'aperçu d'un document vierge : les réponses de P3 sous leur
 * question. `null` pour un document rempli, qui se montre.
 */
export function aLaPlaceDeLApercu(lecture: LectureDuComplement): ReactNode {
  if (!sortVierge(lecture.cibles)) return null;
  return (
    // Sans le retrait que le DSFR donne aux listes.
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
  );
}
