// Les deux résultats du modèle : l'éligibilité (R2), puis la prescription
// préremplie (R3).
//
// L'éditeur n'a pas livré le texte de la fiche R2. D'ici là, elle montre ce que
// les règles ont calculé, sans phrase.

import type { Answers } from "../../socle";
import type { Cibles } from "./declarations/cibles";
import type { Questions } from "./declarations/questions";

type Props = { answers: Answers<Questions>; cibles: Cibles };

export function Eligibilite({ cibles }: Props) {
  if (!cibles.cible_issue_id) return <SansIssue />;
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

/** Jamais affichée tant qu'aucun cerfa n'est produit. */
export function PrescriptionPreremplie() {
  return null;
}

// ---- implémentation ----

// Sans issue, les règles n'ont pas pu conclure : un fait dont elles dépendent
// est absent. Tant que P1 et P2 ne sont pas posées, c'est toujours le cas.
function SansIssue() {
  return (
    <p>
      Les réponses données ne suffisent pas à calculer l’éligibilité : le
      questionnaire n’est pas complet.
    </p>
  );
}
