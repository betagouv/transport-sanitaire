// Le résultat de `ISSUE_PMT` et de `ISSUE_S3141` (#135) : la fiche patient
// positive. Il charge les textes de l'éditeur à la demande, calcule la trace
// des réponses, puis donne la page de la fiche.

import type { Answers, FirstResult } from "../../socle";
import { avecLeCatalogue } from "./avec-le-catalogue";
import type { Cibles } from "./declarations/cibles";
import type { Questions } from "./declarations/questions";
import { FichePositive } from "./FichePositive";
import { pageDeLaFiche } from "./page-de-la-fiche";
import {
  type IssueAvecFichePositive,
  texteDeLaFichePositive,
} from "./texte-de-la-fiche-positive";
import { traceDuResultat } from "./trace-du-resultat";

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
