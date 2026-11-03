// Le parcours du simulateur : un questionnaire, son résultat, puis, si la
// préconisation donne un cerfa, un second questionnaire et son résultat.
//
// Depuis le premier résultat, « Précédent » rouvre le questionnaire. L'action
// principale verrouille : la préconisation est figée, et le second
// questionnaire ne repose aucune question d'avant.

import { type ComponentType, type ReactNode, useState } from "react";
import type { Answers } from "../../../core/socle/questionnaire-engine/question/question";
import type { Model } from "../model";
import {
  type DebugTraceProps,
  QuestionnaireForm,
} from "../questionnaire/QuestionnaireForm";
import { type Screen, startingScreen } from "./screen";
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
  // le compose. Absent hors du service produit.
  developerToolsPanel?: ReactNode;
  // La trace de debug, rendue sous le questionnaire et sous les résultats. Même
  // garde que l'encadré. C'est un composant, pas du contenu composé : le
  // simulateur lui passe l'état vivant du questionnaire, qu'`App` n'a pas.
  DebugTrace?: ComponentType<DebugTraceProps>;
};

export function Simulateur({
  model,
  onNewSimulation,
  seedAnswers = null,
  developerToolsPanel,
  DebugTrace,
}: Props) {
  const [screen, goTo] = useState<Screen>(() =>
    startingScreen(model, seedAnswers),
  );
  const common = { model, goTo, DebugTrace, onRestart: onNewSimulation };

  switch (screen.name) {
    case "questionnaire":
      return (
        <>
          <FirstQuestionnaire screen={screen} {...common} />
          {developerToolsPanel}
        </>
      );
    case "resultat":
      return <OnResultat screen={screen} {...common} />;
    case "complement":
      return <SecondQuestionnaire screen={screen} {...common} />;
    default:
      return <OnCerfa screen={screen} {...common} />;
  }
}

// ---- implémentation ----

type ScreenProps<Name extends Screen["name"]> = {
  model: Model;
  screen: Extract<Screen, { name: Name }>;
  goTo: (screen: Screen) => void;
  DebugTrace?: ComponentType<DebugTraceProps>;
  onRestart: () => void;
};

// Le stepper annonce une partie de plus que celles-ci : tant que rien n'est
// décidé, le cerfa reste possible.
function FirstQuestionnaire({
  model,
  screen,
  goTo,
  DebugTrace,
}: ScreenProps<"questionnaire">) {
  const parts = model.core.questionnaire;
  return (
    <QuestionnaireForm
      parts={parts}
      relevance={model.core.relevance}
      partCount={parts.length + 1}
      initialState={screen.resume}
      tracked
      endLabel="Voir le résultat"
      DebugTrace={DebugTrace}
      onComplete={(answers, previousState) => {
        trackAldPathway(model, answers);
        goTo({ name: "resultat", previousState });
      }}
    />
  );
}

// Le second questionnaire n'émet pas d'évènement.
function SecondQuestionnaire({
  model,
  screen,
  goTo,
  DebugTrace,
}: ScreenProps<"complement">) {
  const { locked } = screen;
  const partsBefore = model.core.questionnaire.length;
  return (
    <QuestionnaireForm
      parts={[model.core.complement]}
      relevance={model.core.relevance}
      partsBefore={partsBefore}
      partCount={partsBefore + 1}
      lockedAnswers={locked.answers}
      cibles={locked.preconisation.cibles}
      initialState={screen.resume}
      tracked={false}
      endLabel="Terminer"
      DebugTrace={DebugTrace}
      onComplete={(_, previousState) =>
        goTo({
          name: "cerfa",
          locked,
          previousState,
          completedAt: new Date(),
        })
      }
    />
  );
}

function OnResultat({ screen, goTo, ...props }: ScreenProps<"resultat">) {
  return (
    <ResultatScreen
      state={screen.previousState}
      onReopen={(resume) => goTo({ name: "questionnaire", resume })}
      onLock={(locked) => goTo({ name: "complement", locked })}
      {...props}
    />
  );
}

function OnCerfa({ screen, goTo, ...props }: ScreenProps<"cerfa">) {
  const { locked } = screen;
  return (
    <CerfaScreen
      state={screen.previousState}
      locked={locked}
      completedAt={screen.completedAt}
      onReopen={(resume) => goTo({ name: "complement", locked, resume })}
      {...props}
    />
  );
}
