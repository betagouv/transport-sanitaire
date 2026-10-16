// Le résultat de `ISSUE_NON_ELIGIBLE` (#134). Il charge les textes de
// l'éditeur à la demande, calcule la trace des réponses, puis donne au socle
// le titre du prescripteur, sa phrase d'introduction et la fiche patient.

import type { Answers, FirstResult } from "../../socle";
import { avecLeCatalogue } from "./avec-le-catalogue";
import type { Cibles } from "./declarations/cibles";
import type { Questions } from "./declarations/questions";
import { FicheNegative } from "./FicheNegative";
import { texteDeLaFicheNegative } from "./texte-de-la-fiche-negative";
import { traceDuResultat } from "./trace-du-resultat";

type Props = { answers: Answers<Questions>; cibles: Cibles };

// La phrase d'introduction vient de l'aperçu de l'éditeur : le catalogue ne la
// porte pas.
export function resultatNegatif({
  answers,
  cibles,
}: Props): Promise<FirstResult> {
  return avecLeCatalogue((catalogue) => {
    const trace = traceDuResultat(answers, cibles);
    const texte = texteDeLaFicheNegative(catalogue, trace);
    return {
      title: texte.titreDuPrescripteur,
      intro:
        "Vous trouverez ci-dessous une fiche explicative officielle de l’Assurance Maladie à remettre à votre patient.",
      body: <FicheNegative texte={texte} />,
    };
  });
}
