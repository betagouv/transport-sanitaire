// Racine de l'app. Elle choisit l'écran à afficher et branche les developer
// tools sur le simulateur.
//
// L'écran de rattachement passe en premier : on ne simule pas sans s'être
// rattaché. Voir docs/knowledge/adr/identification.md, ADR-1.

import type { ComponentProps } from "react";
import {
  AudienceProvider,
  type AudienceUseCases,
  JournalProvider,
  type JournalUseCases,
} from "../analytics";
import {
  DebugTrace,
  DeveloperTools,
  debugTraceUnlocked,
  developerToolsUnlocked,
  ToolButton,
} from "../developer-tools";

import type { Model } from "../model";
import { RattachementScreen } from "../rattachement";
import { SeedsScreen } from "../seeds";
import { Container } from "../ui";
import { type ModelChoice, type Models, useModelChoice } from "./model-choice";
import { useModelLoading } from "./model-loading";
import type { Navigation } from "./navigation";
import { useNavigation } from "./navigation";
import { SimulateurScreen } from "./SimulateurScreen";

// `referentiel`, `declarer`, `audience` et `journal` viennent du conteneur ;
// les tests passent les leurs.
type Props = ScreensProps & {
  /** La mesure d'audience. Absente, rien n'est mesuré. */
  audience?: AudienceUseCases;
  /** Le journal des parcours. Absent, aucun journal ne reçoit rien. */
  journal?: JournalUseCases;
};

type ScreensProps = Pick<
  ComponentProps<typeof RattachementScreen>,
  "referentiel" | "declarer"
> & {
  /**
   * Les modèles que l'app peut dérouler, chacun sous le nom que `main.tsx` lui
   * donne. Le premier s'ouvre au démarrage. S'il y en a plusieurs, les
   * developer tools proposent d'en changer.
   */
  models: Models;
  /**
   * Les developer tools s'ouvrent-ils ? En local oui, sur un build de
   * production jamais (`developerToolsUnlocked`). Un test passe `false` pour
   * voir l'app comme en production.
   */
  developerTools?: boolean;
};

export function App({ audience, journal, ...screens }: Props) {
  return (
    <AudienceProvider value={audience ?? null}>
      <JournalProvider value={journal ?? null}>
        <Screens {...screens} />
      </JournalProvider>
    </AudienceProvider>
  );
}

// ---- implémentation ----

// Le rattachement n'attend pas le modèle : il se charge pendant que
// le prescripteur se rattache.
function Screens({
  models,
  referentiel,
  declarer,
  developerTools = developerToolsUnlocked(),
}: ScreensProps) {
  const navigation = useNavigation();
  const opened = useModelChoice(models);
  const { model, failed } = useModelLoading(opened.source);

  if (navigation.screen === "rattachement")
    return (
      <RattachementScreen
        referentiel={referentiel}
        declarer={declarer}
        onRattache={navigation.rattacher}
      />
    );
  if (!model) return <ModelPending failed={failed} />;
  return (
    <AfterRattachement
      model={model}
      navigation={navigation}
      modelChoices={opened.choices}
      developerTools={developerTools}
    />
  );
}

function ModelPending({ failed }: { failed: boolean }) {
  return (
    <Container>
      {failed ? (
        <div className="fr-alert fr-alert--error" role="alert">
          <p>Le simulateur n’a pas pu se charger. Rechargez la page.</p>
        </div>
      ) : (
        <p role="status">Chargement du simulateur…</p>
      )}
    </Container>
  );
}

// Ce qui suit le rattachement : l'écran des seeds, ou le simulateur.
function AfterRattachement({
  model,
  navigation,
  modelChoices,
  developerTools,
}: {
  model: Model;
  navigation: Navigation;
  modelChoices: ModelChoice[];
  developerTools: boolean;
}) {
  if (navigation.screen === "seeds")
    return (
      <SeedsScreen
        model={model}
        onOpen={navigation.openSeed}
        onBack={navigation.closeTool}
      />
    );
  return (
    <SimulateurScreen
      key={navigation.simulationNumber}
      model={model}
      seedAnswers={navigation.seedAnswers}
      onNewSimulation={navigation.restart}
      developerToolsPanel={
        developerTools
          ? developerToolsPanel(navigation, modelChoices)
          : undefined
      }
      DebugTrace={
        debugTraceUnlocked(developerTools, navigation.structure)
          ? DebugTrace
          : undefined
      }
    />
  );
}

// Le branchement des developer tools sur le simulateur se décide ici. Le
// simulateur reçoit du contenu déjà composé et n'importe rien de
// `developer-tools/`. En local, ils ouvrent trois choses : le bouton vers
// l'écran des seeds, le choix du modèle quand l'app en a plusieurs, et la trace
// de debug. La trace s'ouvre aussi partout pour « Assurance Maladie » (D-280).
function developerToolsPanel(
  navigation: Navigation,
  modelChoices: ModelChoice[],
) {
  return (
    <DeveloperTools>
      <ToolButton onClick={navigation.openSeeds}>Seeds</ToolButton>
      {modelChoices.map((modelChoice) => (
        <ModelChoiceButton
          key={modelChoice.label}
          modelChoice={modelChoice}
          onChange={navigation.restart}
        />
      ))}
    </DeveloperTools>
  );
}

// Changer de modèle commence une simulation : les réponses de l'un ne valent
// rien pour l'autre. Choisir le modèle déjà ouvert ne change rien.
function ModelChoiceButton({
  modelChoice,
  onChange,
}: {
  modelChoice: ModelChoice;
  onChange: () => void;
}) {
  const change = () => {
    if (modelChoice.active) return;
    modelChoice.choose();
    onChange();
  };
  return (
    <ToolButton onClick={change} pressed={modelChoice.active}>
      {modelChoice.label}
    </ToolButton>
  );
}
