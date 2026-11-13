// Ce que les tests d'une capacité du questionnaire partagent : afficher des pages
// écrites dans le test, sans passer par l'application ni par un modèle.

import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import type { CoreModel } from "../../../core/socle/model";
import type {
  Answers,
  AnyCibles,
  Page,
  QuestionnairePart,
} from "../../../core/socle/questionnaire-engine";
import { Simulation } from "../../../core/socle/simulation";
import { QuestionnaireForm } from "../../../front/socle/questionnaire/QuestionnaireForm";

type ApresVerrou = { lockedAnswers?: Answers; cibles?: AnyCibles };

/**
 * Affiche ces pages. `reponses` donne ce que le questionnaire a validé, une
 * fois fini. `apresVerrou` les affiche comme après le verrou : sur des réponses
 * acquises et des cibles figées.
 */
export function afficher(pages: readonly Page[], apresVerrou?: ApresVerrou) {
  let validees: Answers | undefined;
  const core = modeleDe(pages, apresVerrou);
  const simulation = apresVerrou
    ? Simulation.afterLock(core, {
        answers: apresVerrou.lockedAnswers ?? {},
        preconisation: { faits: {}, cibles: apresVerrou.cibles ?? {} },
      })
    : Simulation.start(core);
  render(
    <Formulaire
      core={core}
      depart={simulation}
      onComplete={(answers) => {
        validees = answers;
      }}
    />,
  );
  return { user: userEvent.setup(), reponses: () => validees };
}

// ---- implémentation ----

const PARTIE = { id: "partie", title: "Partie" };

// Un modèle sans préconisation : ces pages, avant ou après le verrou.
function modeleDe(
  pages: readonly Page[],
  apresVerrou?: ApresVerrou,
): CoreModel {
  const partie = { ...PARTIE, pages } as QuestionnairePart;
  return {
    preconisation: { faits: () => ({}), cibles: () => ({}), reads: new Map() },
    questionnaire: apresVerrou
      ? []
      : [partie as QuestionnairePart<never, undefined>],
    complement: apresVerrou
      ? partie
      : { id: "complement", title: "Complément", pages: [] },
    seeds: async () => [],
  };
}

// Le formulaire garde la simulation ; finir ne l'enlève pas de l'écran.
function Formulaire({
  core,
  depart,
  onComplete,
}: {
  core: CoreModel;
  depart: Simulation;
  onComplete: (answers: Answers) => void;
}) {
  const [simulation, setSimulation] = useState(depart);
  const parts =
    "locked" in simulation.stage ? [core.complement] : core.questionnaire;
  return (
    <QuestionnaireForm
      parts={parts}
      partCount={1}
      endLabel="Terminer"
      counted={false}
      simulation={simulation}
      onChange={(next) => {
        if (next.stage.name !== simulation.stage.name) onComplete(next.answers);
        else setSimulation(next);
      }}
    />
  );
}
