// Le premier résultat, que le verrou suit. Le modèle donne ses morceaux : le
// titre, l'introduction, le corps, la feuille à remettre au patient. Le socle
// compose la page autour : le stepper et ce qui suit, puis les boutons. Sans
// feuille, ils sont sous le corps, séparés d'un trait. Avec une feuille, ils
// passent au-dessus d'elle, et seule la feuille s'imprime. Les boutons
// secondaires sont à gauche, l'avis et la complétion à droite (V02). Le titre d'un résultat
// avec feuille et complétion est vert.

import { type ReactNode, useEffect, useState } from "react";
import type {
  Answers,
  Read,
} from "../../../../core/socle/questionnaire-engine";

import type { Simulation } from "../../../../core/socle/simulation";
import type { FirstResult, Model } from "../../model";
import { NextStep, Stepper } from "../../questionnaire/Stepper";
import { SecondaryButton } from "../../ui/SecondaryButton";
import type { ScreenProps } from "../Simulateur";
import { SheetViewer } from "../sheet/SheetViewer";
import {
  FeedbackLink,
  type FeedbackOffer,
  feedbackOf,
  onFirstResult,
} from "./FeedbackLink";
import "./resultat-screen.css";

// Le verrou ne s'annonce pas à l'écran : l'interface nomme l'action, et le
// « Précédent » de cette page dit ce qui reste ouvert. Sans action qui
// verrouille, rien ne suit ce résultat : le stepper s'arrête sur lui. Le
// stepper et les boutons restent pendant le chargement du résultat.
export function ResultatScreen({
  model,
  simulation,
  onChange,
  DebugTrace,
  onRestart,
}: ScreenProps) {
  const parts = model.core.questionnaire;
  const trace = { title: "résultat", ...simulation.trace() };
  const read = simulation.read(new Date());
  return (
    <>
      <Content
        result={resultOf(model, simulation)}
        step={{ title: model.result.title, part: parts.length }}
        startLabel={startLabelOf(model, read)}
        actions={{
          onReopen: () => onChange(simulation.reopen()),
          onLock: () => onChange(simulation.lock()),
          onRestart,
        }}
        feedback={feedbackOf(model, read)}
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
function startLabelOf(model: Model, read: Read): string | null {
  const { form, startLabel } = model.cerfa;
  const opens = model.core.complement.pages.length > 0 || read(form) !== null;
  return opens ? read(startLabel) : null;
}

type Loading = FirstResult | Promise<FirstResult>;

// La promesse d'un résultat qui charge, par modèle puis par réponses. Gardée
// hors de React : chaque rendu de la page relancerait le chargement.
const loading = new WeakMap<Model, WeakMap<Answers, Promise<FirstResult>>>();

function resultOf(model: Model, simulation: Simulation): Loading {
  const { answers } = simulation;
  const known = loading.get(model)?.get(answers);
  if (known) return known;
  const reading = simulation.read(new Date())(model.result.reading);
  const result = model.result.content({ reading });
  if (!(result instanceof Promise)) return result;
  const byAnswers = loading.get(model) ?? new WeakMap();
  loading.set(model, byAnswers.set(answers, result));
  return result;
}

/** Ce que font les boutons de la page : rouvrir le questionnaire, verrouiller, recommencer. */
type Actions = {
  onReopen: () => void;
  onLock: () => void;
  onRestart: () => void;
};

// Ce qui suit le résultat : l'action qui verrouille, et son libellé ; rien ;
// ou on ne le sait pas encore, le temps que le résultat charge.
type Completion = { label: string } | "none" | "pending";

type Buttons = Actions & {
  completion: Completion;
  feedback: FeedbackOffer | null;
};

// Où le stepper en est : le titre du résultat, et la partie qu'il clôt.
type Step = { title: string; part: number };

type Placement = "below" | "above";

type ContentProps = {
  result: Loading;
  step: Step;
  startLabel: string | null;
  actions: Actions;
  feedback: FeedbackOffer | null;
};

// L'avis entre dans la barre d'actions, une fois le résultat chargé. La page
// prend le nom que le résultat lui donne, une fois chargé.
function Content({
  result,
  step,
  startLabel,
  actions,
  feedback,
}: ContentProps) {
  const loaded = useLoaded(result);
  const completion = completionOf(startLabel, loaded);
  const completes = typeof completion === "object";
  const offer = loaded && onFirstResult(feedback, completes);
  const buttons = { ...actions, completion, feedback: offer || null };
  return (
    <section aria-label={loaded?.label}>
      <div className="fr-no-print">
        <ResultStepper {...step} completion={buttons.completion} />
      </div>
      {loaded === null ? (
        <>
          <p aria-live="polite">Chargement du résultat…</p>
          <PageActions placement="below" {...buttons} />
        </>
      ) : (
        <Page result={loaded} buttons={buttons} />
      )}
    </section>
  );
}

// La complétion n'est offerte qu'une fois le résultat chargé : un résultat qui
// ne peut rien compléter (`terminal`) la retire, quoi que dise le libellé.
function completionOf(
  startLabel: string | null,
  loaded: FirstResult | null,
): Completion {
  if (startLabel === null || loaded?.terminal) return "none";
  if (loaded === null) return "pending";
  return { label: startLabel };
}

// Une partie de plus tant que la complétion est possible, ou pas encore connue.
function ResultStepper({
  title,
  part,
  completion,
}: Step & { completion: Completion }) {
  return (
    <Stepper
      title={title}
      part={part}
      total={completion === "none" ? part : part + 1}
      details={detailsOf(completion)}
    />
  );
}

function detailsOf(completion: Completion): ReactNode {
  if (completion === "pending") return null;
  if (completion === "none") {
    return <span className="fr-text--bold">Évaluation terminée.</span>;
  }
  return <NextStep label={completion.label} />;
}

// Le titre d'un refus est rouge foncé ; celui d'un résultat avec feuille et
// complétion, vert ; les autres restent noirs.
function titleClass({ tone, sheet }: FirstResult, buttons: Buttons): string {
  if (tone === "refusal") return "fr-h2 socle-result-title--refusal";
  const success = sheet !== undefined && typeof buttons.completion === "object";
  return success ? "fr-h2 socle-result-title--success" : "fr-h2";
}

function Page({ result, buttons }: { result: FirstResult; buttons: Buttons }) {
  const { title, intro, body, sheet } = result;
  const page = (
    <>
      <h1 className={titleClass(result, buttons)}>{title}</h1>
      {intro && <p className="fr-text--lg">{intro}</p>}
      {body}
    </>
  );
  if (!sheet) {
    return (
      <>
        {page}
        <PageActions placement="below" {...buttons} />
      </>
    );
  }
  return (
    <>
      <div className="fr-no-print">{page}</div>
      <PageActions placement="above" {...buttons} />
      <SheetViewer sheet={sheet} />
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

// Une seule rangée, empilée sur mobile : les secondaires à gauche, l'avis et la
// complétion poussés à droite. Elle n'est posée qu'offerte. Rien de ces
// boutons ne s'imprime.
function PageActions({
  placement,
  completion,
  onReopen,
  onLock,
  onRestart,
  feedback,
}: Buttons & { placement: Placement }) {
  return (
    <div
      className={`socle-page-actions socle-page-actions--${placement} fr-no-print`}
    >
      <div className="fr-btns-group fr-btns-group--inline-md">
        <SecondaryButton onClick={onReopen}>Précédent</SecondaryButton>
        <SecondaryButton onClick={onRestart}>
          Faire une nouvelle simulation
        </SecondaryButton>
        {feedback && <FeedbackLink offer={feedback} />}
        {typeof completion === "object" && (
          <button
            type="button"
            className="fr-btn socle-page-actions__completion"
            onClick={onLock}
          >
            {completion.label}
          </button>
        )}
      </div>
    </div>
  );
}
