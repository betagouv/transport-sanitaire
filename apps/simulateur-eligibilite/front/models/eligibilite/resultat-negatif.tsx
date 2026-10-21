// Le résultat de `ISSUE_NON_ELIGIBLE` (#134) : la fiche patient négative. Il
// charge les textes de l'éditeur à la demande, calcule la trace des réponses,
// puis donne la page de la fiche.

import type { Answers, FirstResult } from "../../socle";
import { avecLeCatalogue } from "./avec-le-catalogue";
import type { Cibles } from "./declarations/cibles";
import type { Questions } from "./declarations/questions";
import { FicheNegative } from "./FicheNegative";
import { pageDeLaFiche } from "./page-de-la-fiche";
import { texteDeLaFicheNegative } from "./texte-de-la-fiche-negative";
import { traceDuResultat } from "./trace-du-resultat";

type Props = { answers: Answers<Questions>; cibles: Cibles };

export function resultatNegatif({
  answers,
  cibles,
}: Props): Promise<FirstResult> {
  return avecLeCatalogue((catalogue) => {
    const trace = traceDuResultat(answers, cibles);
    const texte = texteDeLaFicheNegative(catalogue, trace);
    return pageDeLaFiche(
      texte.titreDuPrescripteur,
      <FicheNegative texte={texte} />,
    );
  });
}
