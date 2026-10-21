// Le résultat de l'éligibilité (R2).
//
// Cinq issues n'ont pas de fiche patient : leur texte est celui du praticien
// (#133). La non-éligibilité a sa fiche patient négative (#134), la
// prescription médicale de transport et le S3141 leur fiche positive (#135),
// les deux demandes d'accord préalable la leur (#136). Les dix issues ont donc
// leur texte. Un retour pénitentiaire hors du circuit de prescription n'a pas
// d'issue : R2 oriente vers l'administration pénitentiaire (point 34).

import {
  type Answers,
  type FirstResult,
  pagesOf,
  type Validated,
  validatedQuestions,
} from "../../../socle";
import type { Cibles } from "../declarations/cibles";
import type { Questions } from "../declarations/questions";
import { horsCircuit } from "../p2/retour-penitentiaire";
import { PARTS } from "../questionnaire";
import { resultatNegatif } from "./fiche-negative/resultat-negatif";
import { resultatPositif } from "./fiche-positive/resultat-positif";
import { resultatDuPraticien } from "./praticien/resultat-du-praticien";
import { estSansFiche } from "./praticien/texte-du-praticien";

type Props = { answers: Answers<Questions>; cibles: Cibles };

export function eligibilite({
  answers,
  cibles,
}: Props): FirstResult | Promise<FirstResult> {
  if (horsCircuit(validees(answers))) return ORIENTATION_PENITENTIAIRE;
  const issue = cibles.cible_issue_id;
  if (!issue) return SANS_ISSUE;
  if (issue === "ISSUE_NON_ELIGIBLE")
    return resultatNegatif({ answers, cibles });
  if (estSansFiche(issue))
    return resultatDuPraticien({ answers, cibles, issue });
  return resultatPositif({ answers, cibles, issue });
}

// ---- implémentation ----

// Sans issue, les règles n'ont pas pu conclure : un fait dont elles dépendent
// est absent.
const SANS_ISSUE: FirstResult = {
  title: "L’éligibilité n’a pas pu être calculée",
  body: (
    <p>
      Les réponses données ne suffisent pas à calculer l’éligibilité : le
      questionnaire n’est pas complet.
    </p>
  ),
};

// Le titre et le texte de `CONTRAT_ORIENTATION_ADMINISTRATIVE.json`, sans
// introduction : aucune fiche ne suit.
const ORIENTATION_PENITENTIAIRE: FirstResult = {
  title: "Ce retour relève de l’organisation pénitentiaire",
  body: (
    <p>
      Ce déplacement a été identifié comme exclusivement administratif, sans
      indication médicale de transport. Rapprochez-vous de l’administration
      pénitentiaire pour organiser le déplacement.
    </p>
  ),
};

function validees(answers: Answers<Questions>): Validated<Questions> {
  return validatedQuestions(pagesOf(PARTS), answers) as Validated<Questions>;
}
