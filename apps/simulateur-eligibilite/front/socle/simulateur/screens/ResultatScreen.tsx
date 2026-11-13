// Le premier résultat, que le verrou suit. Le modèle donne ses morceaux : le
// titre, l'introduction, le corps, la feuille à remettre au patient. Le socle
// compose la page autour : le stepper et ce qui suit, puis les boutons. Sans
// feuille, ils sont sous le corps, séparés d'un trait. Avec une feuille, ils
// passent au-dessus d'elle, et seule la feuille s'imprime. Les boutons
// secondaires sont à gauche, l'avis et la complétion à droite (V02). Le titre d'un résultat
// avec feuille et complétion est vert.

import type { ReactNode } from "react";
import type { Read } from "../../../../core/socle/questionnaire-engine";
import {
  type Button,
  type ButtonTracking,
  type ResultCodes,
  useResultScreen,
  useResultTracking,
} from "../../analytics";
import type { PdfSignals } from "../../cerfa";
import type { FirstResult, Model } from "../../model";
import { NextStep, Stepper } from "../../questionnaire";
import { SecondaryButton } from "../../ui";
import type { ScreenProps } from "../Simulateur";
import { SheetViewer } from "../sheet/SheetViewer";
import {
  FeedbackLink,
  type FeedbackOffer,
  feedbackOf,
  onFirstResult,
} from "./FeedbackLink";
import { type Loading, resultOf, useLoaded } from "./load-the-result";
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
  useResultScreen("R2", simulation);
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
        codes={model.resultCodes ? read(model.resultCodes) : null}
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
  tracking: ButtonTracking;
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
  codes: ResultCodes | null;
};

// L'avis entre dans la barre d'actions, une fois le résultat chargé. La page
// prend le nom que le résultat lui donne, une fois chargé. Le journal le
// reçoit chargé.
function Content({
  result,
  step,
  startLabel,
  actions,
  feedback,
  codes,
}: ContentProps) {
  const loaded = useLoaded(result);
  const completion = completionOf(startLabel, loaded);
  const completes = typeof completion === "object";
  const canComplete = completion === "pending" ? null : completes;
  const offer = (loaded && onFirstResult(feedback, completes)) || null;
  const tracking = useResultTracking({
    loaded,
    canComplete,
    codes,
    buttons: offered(loaded, offer),
  });
  const buttons = { ...actions, completion, feedback: offer, tracking };
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

// Les boutons que le résultat chargé offre au journal : ceux de sa fiche, et
// l'avis.
function offered(
  loaded: FirstResult | null,
  feedback: FeedbackOffer | null,
): Button[] {
  return [
    ...(loaded?.sheet ? (["sheet_print", "sheet_download"] as const) : []),
    ...(feedback ? (["feedback"] as const) : []),
  ];
}

function sheetSignals(tracking: ButtonTracking): PdfSignals {
  return {
    onPrint: () => tracking.pressed("sheet_print"),
    onDownload: () => tracking.pressed("sheet_download"),
    onDownloaded: () => tracking.delivered("sheet_download"),
  };
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
      <SheetViewer sheet={sheet} signals={sheetSignals(buttons.tracking)} />
    </>
  );
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
  tracking,
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
        {feedback && (
          <FeedbackLink
            offer={feedback}
            onClick={() => tracking.pressed("feedback")}
          />
        )}
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
