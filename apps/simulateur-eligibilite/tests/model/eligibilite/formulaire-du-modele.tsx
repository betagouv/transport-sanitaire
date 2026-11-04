// Ce que partagent les tests qui déroulent le modèle de l'éditeur dans le
// formulaire du socle : l'afficher, au début ou sur une page, puis répondre
// comme un prescripteur.

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import type { Answers } from "../../../core/socle/questionnaire-engine";
import { Simulation } from "../../../core/socle/simulation/simulation";
import { model } from "../../../front/models/eligibilite";
import { QuestionnaireForm } from "../../../front/socle/questionnaire/QuestionnaireForm";

type User = ReturnType<typeof userEvent.setup>;

// Sans le graphe de décision : le formulaire pose tout ce que le modèle
// déclare. Le filtrage par le graphe a ses propres tests.
const { relevance: _graphe, ...core } = model.core;

export const Q11 = /^Concernant son déplacement/;
export const Q13 = /^Avant d’établir le mode de transport/;

export function afficherLeQuestionnaire(onComplete: () => void = () => {}) {
  render(
    <Formulaire depart={Simulation.start(core)} onComplete={onComplete} />,
  );
  return userEvent.setup();
}

// Le questionnaire rouvert sur cette page, avec ces réponses : un retour
// depuis le résultat, sans dérouler les pages d'avant. Les réponses s'arrêtent
// avant la page : la simulation reprend dessus.
export function afficherLaPage(id: string, answers: Answers) {
  const simulation = Simulation.resume(core, answers);
  if (simulation.page.id !== id) {
    throw new Error(`Ces réponses ouvrent ${simulation.page.id}, pas ${id}.`);
  }
  render(<Formulaire depart={simulation} onComplete={() => {}} />);
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

// ---- implémentation ----

// Le formulaire garde la simulation ; atteindre le résultat ne l'enlève pas
// de l'écran.
function Formulaire({
  depart,
  onComplete,
}: {
  depart: Simulation;
  onComplete: () => void;
}) {
  const [simulation, setSimulation] = useState(depart);
  return (
    <QuestionnaireForm
      parts={core.questionnaire}
      partCount={3}
      endLabel="Voir le résultat"
      tracked={false}
      simulation={simulation}
      onChange={(next) => {
        if (next.stage.name === "resultat") onComplete();
        else setSimulation(next);
      }}
    />
  );
}
