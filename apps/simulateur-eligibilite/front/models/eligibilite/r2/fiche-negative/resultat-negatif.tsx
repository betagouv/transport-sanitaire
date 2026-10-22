// Le résultat de `ISSUE_NON_ELIGIBLE` (#134). Il charge les textes de
// l'éditeur à la demande, calcule la trace des réponses, puis donne au socle
// le titre du prescripteur, sa phrase d'introduction et la feuille du patient.

import type { FirstResult } from "../../../../socle";
import { avecLeCatalogue } from "../avec-le-catalogue";
import { pageDeLaFeuille } from "../page-de-la-fiche";
import { type ReponsesEtCibles, traceDuResultat } from "../trace-du-resultat";
import { FicheNegative } from "./FicheNegative";
import { texteDeLaFicheNegative } from "./texte-de-la-fiche-negative";

export function resultatNegatif(
  reponses: ReponsesEtCibles,
): Promise<FirstResult> {
  return avecLeCatalogue((catalogue) => {
    const trace = traceDuResultat(reponses);
    const texte = texteDeLaFicheNegative(catalogue, trace);
    return pageDeLaFeuille(catalogue, texte.titreDuPrescripteur, {
      title: texte.titreDuPatient,
      intro: texte.raison,
      body: <FicheNegative texte={texte} />,
    });
  });
}
