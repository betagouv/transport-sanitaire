// Le résultat des issues positives : `ISSUE_PMT` et `ISSUE_S3141` (#135),
// `ISSUE_DAP_SANS_URGENCE` et `ISSUE_DAP_URGENCE_ATTESTEE` (#136). Il charge les
// textes de l'éditeur à la demande, calcule la trace des réponses, puis donne
// la page de la fiche patient positive.

import type { Answers, FirstResult } from "../../../../socle";
import type { Cibles } from "../../declarations/cibles";
import type { Questions } from "../../declarations/questions";
import { avecLeCatalogue } from "../avec-le-catalogue";
import { pageDeLaFiche } from "../page-de-la-fiche";
import { traceDuResultat } from "../trace-du-resultat";
import { FichePositive } from "./FichePositive";
import {
  type IssueAvecFichePositive,
  texteDeLaFichePositive,
} from "./texte-de-la-fiche-positive";

type Props = {
  answers: Answers<Questions>;
  cibles: Cibles;
  issue: IssueAvecFichePositive;
};

export function resultatPositif({
  answers,
  cibles,
  issue,
}: Props): Promise<FirstResult> {
  return avecLeCatalogue((catalogue) => {
    const trace = traceDuResultat(answers, cibles);
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
