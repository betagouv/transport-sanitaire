// L'écran affiché, et comment on en change : rattachement, seeds, simulateur.
//
// Le rattachement saisi ne passe pas par ici : il est rangé en session.

import { useState } from "react";
import type { Answers } from "../../../core/socle/questionnaire-engine";
import type { Seed } from "../../../core/socle/simulation";

type Screen = "rattachement" | "seeds" | "simulateur";

export type Navigation = {
  screen: Screen;
  // Les réponses de la seed ouverte, qui pré-remplissent le simulateur.
  seedAnswers: Answers | null;
  // Change à chaque nouvelle simulation. `App` s'en sert pour remonter le
  // simulateur et repartir d'un questionnaire vierge.
  simulationNumber: number;
  // Le rattachement ouvre le simulateur. Les developer tools s'ouvrent après
  // lui, depuis le simulateur.
  rattacher: () => void;
  // Ouvre la seed choisie : son résultat si elle est complète, sinon la
  // première page qu'elle laisse sans réponse.
  openSeed: (seed: Seed) => void;
  openSeeds: () => void;
  closeTool: () => void;
  restart: () => void;
};

export function useNavigation(): Navigation {
  const [state, setState] = useState<State>({
    screen: "rattachement",
    seedAnswers: null,
    simulationNumber: 0,
  });
  const patch = (partial: Partial<State>) =>
    setState((current) => ({ ...current, ...partial }));

  return { ...state, ...actions(state, patch) };
}

// ---- implémentation ----

type State = Pick<Navigation, "screen" | "seedAnswers" | "simulationNumber">;

function actions(
  state: State,
  patch: (partial: Partial<State>) => void,
): Omit<Navigation, keyof State> {
  return {
    rattacher: () => patch({ screen: "simulateur" }),
    // Ouvrir une seed commence une simulation. Rouverte, la même seed repart
    // de ses réponses.
    openSeed: (seed) =>
      patch({
        screen: "simulateur",
        seedAnswers: seed.answers,
        simulationNumber: state.simulationNumber + 1,
      }),
    openSeeds: () => patch({ screen: "seeds" }),
    closeTool: () => patch({ screen: "simulateur" }),
    restart: () =>
      patch({
        screen: "simulateur",
        seedAnswers: null,
        simulationNumber: state.simulationNumber + 1,
      }),
  };
}
