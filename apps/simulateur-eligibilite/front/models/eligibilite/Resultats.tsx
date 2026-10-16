// Les deux résultats du modèle : l'éligibilité (R2), puis la prescription
// préremplie (R3).
//
// Cinq issues n'ont pas de fiche patient : leur texte est celui du praticien
// (#133). La non-éligibilité a sa fiche patient négative (#134), la
// prescription médicale de transport et le S3141 leur fiche positive (#135),
// les deux demandes d'accord préalable la leur (#136). Les dix issues ont donc
// leur texte.

import type { Answers, FirstResult } from "../../socle";
import type { Cibles } from "./declarations/cibles";
import type { Questions } from "./declarations/questions";
import { resultatDuPraticien } from "./resultat-du-praticien";
import { resultatNegatif } from "./resultat-negatif";
import { resultatPositif } from "./resultat-positif";
import { estSansFiche } from "./texte-du-praticien";

type Props = { answers: Answers<Questions>; cibles: Cibles };

export function eligibilite({
  answers,
  cibles,
}: Props): FirstResult | Promise<FirstResult> {
  const issue = cibles.cible_issue_id;
  if (!issue) return SANS_ISSUE;
  if (issue === "ISSUE_NON_ELIGIBLE")
    return resultatNegatif({ answers, cibles });
  if (estSansFiche(issue))
    return resultatDuPraticien({ answers, cibles, issue });
  return resultatPositif({ answers, cibles, issue });
}

/** Jamais affichée tant qu'aucun cerfa n'est produit. */
export function PrescriptionPreremplie() {
  return null;
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
