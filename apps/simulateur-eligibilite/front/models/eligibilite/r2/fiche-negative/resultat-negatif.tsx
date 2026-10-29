// Le résultat de `ISSUE_NON_ELIGIBLE` (#134). Il charge les textes de
// l'éditeur à la demande, calcule la trace des réponses, puis donne au socle
// le titre du prescripteur, sa phrase d'introduction et la feuille du patient.

import type { FirstResult } from "../../../../socle";
import { avecLeCatalogue } from "../avec-le-catalogue";
import { pageDeLaFeuille } from "../page-de-la-fiche";
import { type Lecture, traceDuResultat } from "../trace-du-resultat";
import { FicheNegative } from "./FicheNegative";
import { texteDeLaFicheNegative } from "./texte-de-la-fiche-negative";

export function resultatNegatif(lecture: Lecture): Promise<FirstResult> {
  return avecLeCatalogue((catalogue) => {
    const trace = traceDuResultat(lecture);
    const texte = texteDeLaFicheNegative(catalogue, trace);
    const page = pageDeLaFeuille(catalogue, texte.titreDuPrescripteur, {
      title: texte.titreDuPatient,
      intro: texte.raison,
      body: <FicheNegative texte={texte} />,
    });
    // Le titre du prescripteur dit le refus, en rouge foncé (TS1014-J05).
    return { ...page, tone: "refusal" };
  });
}
