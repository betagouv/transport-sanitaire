// Le résultat de `ISSUE_NON_ELIGIBLE` (#134). Il charge les textes de
// l'éditeur à la demande, calcule la trace des réponses, puis donne au socle
// le titre du prescripteur, sa phrase d'introduction et la feuille du patient.

import type { Answers, FirstResult } from "../../../../socle";
import type { Cibles } from "../../declarations/cibles";
import type { Questions } from "../../declarations/questions";
import { avecLeCatalogue } from "../avec-le-catalogue";
import { pageDeLaFeuille } from "../page-de-la-fiche";
import { traceDuResultat } from "../trace-du-resultat";
import { FicheNegative } from "./FicheNegative";
import { texteDeLaFicheNegative } from "./texte-de-la-fiche-negative";

type Props = { answers: Answers<Questions>; cibles: Cibles };

export function resultatNegatif({
  answers,
  cibles,
}: Props): Promise<FirstResult> {
  return avecLeCatalogue((catalogue) => {
    const trace = traceDuResultat(answers, cibles);
    const texte = texteDeLaFicheNegative(catalogue, trace);
    return pageDeLaFeuille(catalogue, texte.titreDuPrescripteur, {
      title: texte.titreDuPatient,
      intro: texte.raison,
      body: <FicheNegative texte={texte} />,
    });
  });
}
