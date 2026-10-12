// Racine de l'app. Elle choisit l'écran à afficher et branche les developer
// tools sur le simulateur.
//
// L'écran de rattachement passe en premier : on ne simule pas sans s'être
// rattaché. Voir docs/knowledge/adr/identification.md, ADR-1.

import type { ComponentProps } from "react";
import { DebugTrace } from "../developerTools/DebugTrace";
import { DeveloperTools, ToolButton } from "../developerTools/DeveloperTools";
import type { Model } from "../model";
import { RattachementScreen } from "../rattachement/RattachementScreen";
import { SeedsScreen } from "../seeds/SeedsScreen";
import { SimulateurScreen } from "../simulateur/SimulateurScreen";
import { Container } from "./Container";
import {
  type ModelToggle,
  type OtherModel,
  useModelChoice,
} from "./model-choice";
import { type ModelSource, useModelLoading } from "./model-loading";
import type { Navigation } from "./navigation";
import { useNavigation } from "./navigation";

// `referentiel` et `declarer` sont injectables pour les tests.
type Props = Pick<
  ComponentProps<typeof RattachementScreen>,
  "referentiel" | "declarer"
> & {
  /**
   * La version du modèle que l'app déroule, ou sa promesse quand elle se charge
   * à la demande. `Main` la fournit.
   */
  model: ModelSource;
  /**
   * Les autres modèles, s'il y en a. Les developer tools proposent de dérouler
   * chacun à la place de `model`, sous le nom que `Main` lui donne.
   */
  otherModels?: OtherModel[];
};

// Le rattachement n'attend pas le modèle : il se charge pendant que
// l'utilisateur se rattache.
export function App({
  model: initial,
  otherModels,
  referentiel,
  declarer,
}: Props) {
  const navigation = useNavigation();
  const choice = useModelChoice(initial, otherModels);
  const { model, failed } = useModelLoading(choice.source);

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
      modelToggles={choice.toggles}
    />
  );
}

// ---- implémentation ----

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
  modelToggles,
}: {
  model: Model;
  navigation: Navigation;
  modelToggles: ModelToggle[];
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
      developerToolsPanel={developerToolsPanel(navigation, modelToggles)}
      DebugTrace={navigation.developerTools ? DebugTrace : undefined}
    />
  );
}

// Le branchement des developer tools sur le simulateur se décide ici. Le
// simulateur reçoit du contenu déjà composé et n'importe rien de
// `developerTools/`. Le service n° 4 déverrouille trois choses : le bouton vers
// l'écran des seeds, une bascule par autre modèle, et la trace de debug.
function developerToolsPanel(
  navigation: Navigation,
  modelToggles: ModelToggle[],
) {
  if (!navigation.developerTools) return undefined;
  return (
    <DeveloperTools>
      <ToolButton onClick={navigation.openSeeds}>Seeds</ToolButton>
      {modelToggles.map((modelToggle) => (
        <ModelToggleButton
          key={modelToggle.label}
          modelToggle={modelToggle}
          onChange={navigation.restart}
        />
      ))}
    </DeveloperTools>
  );
}

// Changer de modèle commence une simulation : les réponses de l'un ne valent
// rien pour l'autre.
function ModelToggleButton({
  modelToggle,
  onChange,
}: {
  modelToggle: ModelToggle;
  onChange: () => void;
}) {
  const change = () => {
    modelToggle.toggle();
    onChange();
  };
  return (
    <ToolButton onClick={change} pressed={modelToggle.active}>
      {modelToggle.label}
    </ToolButton>
  );
}
