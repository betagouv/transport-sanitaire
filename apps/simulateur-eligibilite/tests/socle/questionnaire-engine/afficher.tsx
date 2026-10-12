// Ce que les tests d'une capacité du questionnaire partagent : afficher des pages
// écrites dans le test, sans passer par l'application ni par un modèle.

import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuestionnaireForm } from "../../../front/socle/questionnaire-engine/QuestionnaireForm";
import type {
  Answers,
  AnyCibles,
  Page,
} from "../../../front/socle/questionnaire-engine/question";

/**
 * Affiche ces pages. `reponses` rend ce que le questionnaire a validé, une fois
 * fini. `apresVerrou` les affiche comme après le verrou : sur des réponses
 * acquises et des cibles figées.
 */
export function afficher(
  pages: readonly Page[],
  apresVerrou: { lockedAnswers?: Answers; cibles?: AnyCibles } = {},
) {
  let validees: Answers | undefined;
  render(
    <QuestionnaireForm
      parts={[{ id: "partie", title: "Partie", pages }]}
      partCount={1}
      endLabel="Terminer"
      tracked={false}
      {...apresVerrou}
      onComplete={(answers) => {
        validees = answers;
      }}
    />,
  );
  return { user: userEvent.setup(), reponses: () => validees };
}
