// Le résultat de la prescription préremplie (R3). Tant qu'il n'a pas son PDF
// (#157), il récapitule les réponses de P3.

import {
  type LectureDuComplement,
  recapitulatifDuComplement,
} from "./recapitulatif-du-complement";

/**
 * R3 : en attendant le PDF du cerfa (#157), les réponses de P3, sous leur
 * question.
 */
export function PrescriptionPreremplie(lecture: LectureDuComplement) {
  return (
    <>
      <p>
        Le document prérempli à imprimer n’est pas encore disponible. Voici les
        informations recueillies.
      </p>
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
