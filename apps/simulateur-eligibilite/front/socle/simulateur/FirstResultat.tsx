// Le premier résultat, que le verrou suit. Le modèle donne ses morceaux : le
// titre, l'introduction, le corps. Le socle compose la page autour : le
// stepper et ce qui suit, puis les boutons sous le corps, séparés d'un trait.

import { type ComponentType, useEffect, useState } from "react";
import { type FirstResult, type Model, preconisationOf } from "../model";
import type { DebugTraceProps } from "../questionnaire-engine/QuestionnaireForm";
import type { Answers, AnyCibles } from "../questionnaire-engine/question";
import { pagesOf } from "../questionnaire-engine/question";
import type { QuestionnaireState } from "../questionnaire-engine/questionnaire";
import { Stepper } from "../questionnaire-engine/Stepper";
import { PrimaryButton, SecondaryButton, traceOf } from "./Resultats";
import type { Locked } from "./start";
import "./first-resultat.css";

type Props = {
  model: Model;
  /** Le questionnaire derrière ce résultat : « Précédent » le rouvre. */
  state: QuestionnaireState;
  DebugTrace?: ComponentType<DebugTraceProps>;
  onReopen: (state: QuestionnaireState) => void;
  onLock: (locked: Locked) => void;
  onRestart: () => void;
};

// Le verrou ne s'annonce pas à l'écran : l'interface nomme l'action, et le
// « Précédent » de cette page dit ce qui reste ouvert. Sans action qui
// verrouille, rien ne suit ce résultat : le stepper s'arrête sur lui. Les
// boutons restent pendant le chargement du résultat.
export function FirstResultat({ model, state, DebugTrace, ...on }: Props) {
  const { answers } = state;
  const preconisation = preconisationOf(model, answers);
  const { parts, title } = model.transportAndEligibility;
  const startLabel = startLabelOf(model, preconisation.cibles);
  const trace = traceOf("résultat", pagesOf(parts), answers, preconisation);
  return (
    <>
      <div className="fr-no-print">
        <Stepper
          title={title}
          part={parts.length}
          total={parts.length + (startLabel === null ? 0 : 1)}
          details={<NextStep startLabel={startLabel} />}
        />
      </div>
      <Content result={resultOf(model, answers, preconisation.cibles)} />
      <PageActions
        startLabel={startLabel}
        onReopen={() => on.onReopen(state)}
        onLock={() => on.onLock({ answers, preconisation })}
        onRestart={on.onRestart}
      />
      {DebugTrace && (
        <div className="fr-no-print">
          <DebugTrace {...trace} />
        </div>
      )}
    </>
  );
}

// ---- implémentation ----

// L'action qui verrouille, si elle a de quoi ouvrir la partie suivante : une
// page à poser, ou un cerfa à remplir. Un modèle peut donner un libellé sans
// avoir encore de partie à ouvrir ; le verrou ne mène pas à un écran vide.
function startLabelOf(model: Model, cibles: AnyCibles): string | null {
  const { part, form, startLabel } = model.cerfa;
  const opens = part.pages.length > 0 || form(cibles) !== null;
  return opens ? startLabel(cibles) : null;
}

type Loading = FirstResult | Promise<FirstResult>;

// La promesse d'un résultat qui charge, par modèle puis par réponses. Gardée
// hors de React : chaque rendu de la page relancerait le chargement.
const loading = new WeakMap<Model, WeakMap<Answers, Promise<FirstResult>>>();

function resultOf(model: Model, answers: Answers, cibles: AnyCibles): Loading {
  const known = loading.get(model)?.get(answers);
  if (known) return known;
  const result = model.transportAndEligibility.result({ answers, cibles });
  if (!(result instanceof Promise)) return result;
  const byAnswers = loading.get(model) ?? new WeakMap();
  loading.set(model, byAnswers.set(answers, result));
  return result;
}

function Content({ result }: { result: Loading }) {
  const loaded = useLoaded(result);
  if (loaded === null) {
    return <p aria-live="polite">Chargement du résultat…</p>;
  }
  const { title, intro, body } = loaded;
  return (
    <>
      <h1 className="fr-h2">{title}</h1>
      {intro && <p className="fr-text--lg">{intro}</p>}
      {body}
    </>
  );
}

// Un état plutôt que `use()` : une suspension née dans un `act` synchrone, celui
// d'un clic sous les tests, ne reprend jamais.
function useLoaded(result: Loading): FirstResult | null {
  const [loaded, setLoaded] = useState<{ from: Loading; value: FirstResult }>();
  useEffect(() => {
    if (!(result instanceof Promise)) return;
    let live = true;
    result.then((value) => live && setLoaded({ from: result, value }));
    return () => {
      live = false;
    };
  }, [result]);
  if (!(result instanceof Promise)) return result;
  return loaded?.from === result ? loaded.value : null;
}

function NextStep({ startLabel }: { startLabel: string | null }) {
  if (startLabel === null) {
    return <span className="fr-text--bold">Évaluation terminée.</span>;
  }
  return (
    <>
      <span className="fr-text--bold">Étape suivante :</span> {startLabel}
    </>
  );
}

// Une seule rangée sous le corps, empilée sur mobile. « Compléter » verrouille,
// et se tient en dernier ; un libellé `null` le retire. Rien de ces boutons ne
// s'imprime.
function PageActions({
  startLabel,
  onReopen,
  onLock,
  onRestart,
}: {
  startLabel: string | null;
  onReopen: () => void;
  onLock: () => void;
  onRestart: () => void;
}) {
  return (
    <div className="socle-page-actions fr-no-print">
      <div className="fr-btns-group fr-btns-group--inline-md">
        <SecondaryButton onClick={onReopen}>Précédent</SecondaryButton>
        <SecondaryButton onClick={onRestart}>
          Faire une nouvelle simulation
        </SecondaryButton>
        {startLabel !== null && (
          <PrimaryButton onClick={onLock}>{startLabel}</PrimaryButton>
        )}
      </div>
    </div>
  );
}
