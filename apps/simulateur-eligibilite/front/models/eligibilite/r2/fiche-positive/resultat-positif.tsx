// Le résultat des issues positives : `ISSUE_PMT` et `ISSUE_S3141` (#135),
// `ISSUE_DAP_SANS_URGENCE` et `ISSUE_DAP_URGENCE_ATTESTEE` (#136). Il charge les
// textes de l'éditeur à la demande, calcule la trace des réponses, puis donne
// la page de la fiche patient positive.

import type { FirstResult } from "../../../../socle";
import { avecLeCatalogue } from "../avec-le-catalogue";
import { pageDeLaFiche } from "../page-de-la-fiche";
import { type ReponsesEtCibles, traceDuResultat } from "../trace-du-resultat";
import { FichePositive } from "./FichePositive";
import {
  type IssueAvecFichePositive,
  texteDeLaFichePositive,
} from "./texte-de-la-fiche-positive";

type Props = ReponsesEtCibles & { issue: IssueAvecFichePositive };

export function resultatPositif({
  issue,
  ...reponses
}: Props): Promise<FirstResult> {
  return avecLeCatalogue((catalogue) => {
    const trace = traceDuResultat(reponses);
    const texte = texteDeLaFichePositive(catalogue, trace, issue);
    if (!texte) return SANS_MODE;
    return pageDeLaFiche(
      catalogue,
      texte.titreDuPrescripteur,
      <FichePositive texte={texte} />,
    );
  });
}

// ---- implémentation ----

// Sans mode, les règles n'ont pas pu choisir le transport : un fait dont elles
// dépendent est absent.
const SANS_MODE: FirstResult = {
  title: "Le mode de transport n’a pas pu être choisi",
  body: (
    <p>
      Les réponses données ne suffisent pas à choisir le mode de transport : le
      questionnaire n’est pas complet.
    </p>
  ),
};
