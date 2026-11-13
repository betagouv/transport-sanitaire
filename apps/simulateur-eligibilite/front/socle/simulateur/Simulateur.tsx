// Le parcours du simulateur : un questionnaire, son résultat, puis, si la
// préconisation donne un cerfa, un second questionnaire et son résultat. La
// simulation dit l'étape (`core/socle/simulation/`) ; chaque écran affiche la
// sienne, et donne la simulation que ses boutons ouvrent.
//
// Depuis le premier résultat, « Précédent » rouvre le questionnaire. L'action
// principale verrouille : la préconisation est figée, et le second
// questionnaire ne repose aucune question d'avant.
//
// L'adresse de la page suit la position de la simulation, et le bouton Retour
// du navigateur y revient (`follow-the-address.ts`).

import { type ComponentType, type ReactNode, useState } from "react";
import type { Answers } from "../../../core/socle/questionnaire-engine";
import { Simulation } from "../../../core/socle/simulation";
import { useAudience, useRecordTheJourney } from "../analytics";
import type { Model } from "../model";
import { type DebugTraceProps, QuestionnaireForm } from "../questionnaire";
import { useFollowTheAddress } from "./follow-the-address";
import { CerfaScreen } from "./screens/CerfaScreen";
import { ResultatScreen } from "./screens/ResultatScreen";
import { trackAldPathway } from "./track-the-ald-pathway";

type Props = {
  /** La version du modèle que le parcours déroule. */
  model: Model;
  onNewSimulation: () => void;
  // Seed : pré-remplit le parcours, qui s'ouvre là où ses réponses mènent.
  seedAnswers?: Answers | null;
  // L'encadré des developer tools, rendu tel quel sous le questionnaire. `App`
  // le compose. Absent sur un build de production.
  developerToolsPanel?: ReactNode;
  // La trace de debug, rendue sous le questionnaire et sous les résultats. Même
  // garde que l'encadré. C'est un composant, pas du contenu composé : le
  // simulateur lui passe l'état vivant du questionnaire, qu'`App` n'a pas.
  DebugTrace?: ComponentType<DebugTraceProps>;
};

/** Ce qu'un écran du parcours reçoit : la simulation, et où la mener. */
export type ScreenProps = {
  model: Model;
  simulation: Simulation;
  onChange: (simulation: Simulation) => void;
  DebugTrace?: ComponentType<DebugTraceProps>;
  onRestart: () => void;
};

export function Simulateur({
  model,
  onNewSimulation,
  seedAnswers = null,
  developerToolsPanel,
  DebugTrace,
}: Props) {
  const [simulation, setSimulation] = useSimulation(model, seedAnswers);
  useRecordTheJourney(model, simulation, seedAnswers !== null);
  const screen: ScreenProps = {
    model,
    simulation,
    onChange: setSimulation,
    DebugTrace,
    onRestart: onNewSimulation,
  };

  switch (simulation.stage.name) {
    case "questionnaire":
      return (
        <>
          <FirstQuestionnaire {...screen} />
          {developerToolsPanel}
        </>
      );
    case "resultat":
      return <ResultatScreen {...screen} />;
    case "complement":
      return <SecondQuestionnaire {...screen} />;
    default:
      return (
        <CerfaScreen {...screen} completedAt={simulation.stage.completedAt} />
      );
  }
}

// ---- implémentation ----

// La simulation du parcours, au départ ou sur la seed, que l'adresse de la
// page suit.
function useSimulation(model: Model, seedAnswers: Answers | null) {
  const [simulation, setSimulation] = useState(() =>
    seedAnswers
      ? Simulation.resume(model.core, seedAnswers)
      : Simulation.start(model.core),
  );
  useFollowTheAddress(simulation, setSimulation);
  return [simulation, setSimulation] as const;
}

// Le stepper annonce une partie de plus que celles-ci : tant que rien n'est
// décidé, le cerfa reste possible. Arriver au résultat envoie l'indicateur ALD.
function FirstQuestionnaire({
  model,
  simulation,
  onChange,
  DebugTrace,
}: ScreenProps) {
  const parts = model.core.questionnaire;
  const track = useAudience();
  return (
    <QuestionnaireForm
      parts={parts}
      partCount={parts.length + 1}
      simulation={simulation}
      tracked
      endLabel="Voir le résultat"
      DebugTrace={DebugTrace}
      onChange={(next) => {
        if (next.stage.name === "resultat") trackAldPathway(track, model, next);
        onChange(next);
      }}
    />
  );
}

// Le second questionnaire n'émet pas d'évènement.
function SecondQuestionnaire({
  model,
  simulation,
  onChange,
  DebugTrace,
}: ScreenProps) {
  const partsBefore = model.core.questionnaire.length;
  return (
    <QuestionnaireForm
      parts={[model.core.complement]}
      partsBefore={partsBefore}
      partCount={partsBefore + 1}
      simulation={simulation}
      tracked={false}
      endLabel="Terminer"
      DebugTrace={DebugTrace}
      onChange={onChange}
    />
  );
}
