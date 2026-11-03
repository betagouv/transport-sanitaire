// Ce que partagent les tests qui déroulent le modèle de l'éditeur dans le
// formulaire du socle : l'afficher, au début ou sur une page, puis répondre
// comme un prescripteur.

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { model } from "../../../core/models/eligibilite";
import type { Answers } from "../../../core/socle/questionnaire-engine/question/question";
import { QuestionnaireForm } from "../../../front/socle/questionnaire/QuestionnaireForm";

type User = ReturnType<typeof userEvent.setup>;

export const Q11 = /^Concernant son déplacement/;
export const Q13 = /^Avant d’établir le mode de transport/;

export function afficherLeQuestionnaire(onComplete: () => void = () => {}) {
  render(
    <QuestionnaireForm
      parts={model.questionnaire}
      partCount={3}
      endLabel="Voir le résultat"
      tracked={false}
      onComplete={onComplete}
    />,
  );
  return userEvent.setup();
}

// Le questionnaire rouvert sur cette page, avec ces réponses : un retour
// depuis le résultat, sans dérouler les pages d'avant.
export function afficherLaPage(id: string, answers: Answers) {
  render(
    <QuestionnaireForm
      parts={model.questionnaire}
      partCount={3}
      endLabel="Voir le résultat"
      tracked={false}
      initialState={{ answers, page: id }}
      onComplete={() => {}}
    />,
  );
  return userEvent.setup();
}

export const page = (question: RegExp) =>
  screen.findByRole("group", { name: question });
export const choisir = (user: User, reponse: RegExp) =>
  user.click(screen.getByRole("radio", { name: reponse }));
export const cocher = (user: User, reponse: RegExp) =>
  user.click(screen.getByRole("checkbox", { name: reponse }));
export const suivant = (user: User) =>
  user.click(screen.getByRole("button", { name: "Suivant" }));

// Q0.1, puis Q1.1 avec un professionnel, Q1.2 avec ces critères.
export async function avecUnProfessionnel(
  user: User,
  criteres: readonly RegExp[],
) {
  await choisir(user, /^Vérifier une éligibilité/);
  await page(Q11);
  await choisir(user, /^Nécessite une prise en charge spécifique/);
  await page(/^Quelles aides ou conditions particulières/);
  for (const critere of criteres) await cocher(user, critere);
  await suivant(user);
  await page(Q13);
}
