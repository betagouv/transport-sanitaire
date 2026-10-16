// Les deux résultats du modèle : l'éligibilité (R2), puis la prescription
// préremplie (R3).
//
// Cinq issues n'ont pas de fiche patient : leur texte est celui du praticien
// (#133). La non-éligibilité a sa fiche patient négative (#134), la
// prescription médicale de transport et le S3141 leur fiche positive (#135).
// Les autres montrent, d'ici à leur fiche, ce que les règles ont calculé,
// sans phrase.

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
  if (issue === "ISSUE_PMT" || issue === "ISSUE_S3141")
    return resultatPositif({ answers, cibles, issue });
  if (estSansFiche(issue))
    return resultatDuPraticien({ answers, cibles, issue });
  return {
    title: "Ce que les règles ont calculé",
    body: <CiblesCalculees cibles={cibles} />,
  };
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

function CiblesCalculees({ cibles }: { cibles: Cibles }) {
  return (
    <dl>
      <dt>Issue</dt>
      <dd>{cibles.cible_issue_id}</dd>
      <dt>Mode de transport</dt>
      <dd>{cibles.cible_mode_id}</dd>
      <dt>Financeur</dt>
      <dd>{cibles.cible_financeur}</dd>
      <dt>Document</dt>
      <dd>{cibles.cible_support_id}</dd>
    </dl>
  );
}
