// Les deux résultats du parcours : le premier, que le verrou suit, et celui du
// cerfa. Le modèle fournit leur contenu ; le cadre, le stepper et les boutons
// sont ici.

import type { ComponentType, ReactNode } from "react";
import { CerfaDownload } from "../cerfa/CerfaDownload";
import {
  type CerfaInput,
  type Model,
  type Preconisation,
  preconisationOf,
} from "../model";
import {
  askedPages,
  validatedQuestions,
} from "../questionnaire-engine/asked-questions";
import type { DebugTraceProps } from "../questionnaire-engine/QuestionnaireForm";
import {
  type Answers,
  type AnyCibles,
  type Page,
  pagesOf,
} from "../questionnaire-engine/question";
import type { QuestionnaireState } from "../questionnaire-engine/questionnaire";
import { Stepper } from "../questionnaire-engine/Stepper";
import type { Locked } from "./start";

type Props = {
  model: Model;
  /** Le questionnaire derrière ce résultat : « Précédent » le rouvre. */
  state: QuestionnaireState;
  DebugTrace?: ComponentType<DebugTraceProps>;
  onReopen: (state: QuestionnaireState) => void;
  onRestart: () => void;
};

// Le verrou ne s'annonce pas à l'écran : l'interface nomme l'action, et le
// « Précédent » de cette page dit ce qui reste ouvert. Sans cerfa, rien ne suit
// ce résultat : le stepper s'arrête sur lui.
export function FirstResultat({
  model,
  state,
  DebugTrace,
  onReopen,
  onLock,
  onRestart,
}: Props & { onLock: (locked: Locked) => void }) {
  const { answers } = state;
  const preconisation = preconisationOf(model, answers);
  const { parts, title, Resultat } = model.transportAndEligibility;
  const hasCerfa = model.cerfa.form(preconisation.cibles) !== null;
  const trace = traceOf("résultat", pagesOf(parts), answers, preconisation);
  return (
    <Frame
      title={title}
      part={parts.length}
      total={parts.length + (hasCerfa ? 1 : 0)}
      trace={trace}
      DebugTrace={DebugTrace}
    >
      <Resultat answers={answers} cibles={preconisation.cibles} />
      <div className="fr-btns-group fr-btns-group--inline">
        <SecondaryButton onClick={() => onReopen(state)}>
          Précédent
        </SecondaryButton>
        {hasCerfa && (
          <PrimaryButton onClick={() => onLock({ answers, preconisation })}>
            {model.cerfa.startLabel}
          </PrimaryButton>
        )}
        <SecondaryButton onClick={onRestart}>
          Nouvelle simulation
        </SecondaryButton>
      </div>
    </Frame>
  );
}

// « Précédent » revient au second questionnaire, jamais avant le verrou. La
// préconisation affichée est celle que le verrou a figée. Le cerfa se télécharge
// tel que le résultat l'affiche, daté du jour où le complément a été validé.
export function CerfaResultat({
  model,
  state,
  locked,
  completedAt,
  DebugTrace,
  onReopen,
  onRestart,
}: Props & { locked: Locked; completedAt: Date }) {
  const { answers } = state;
  const { cibles } = locked.preconisation;
  const { part, title, Resultat } = model.cerfa;
  const total = model.transportAndEligibility.parts.length + 1;
  const all = [...pagesOf(model.transportAndEligibility.parts), ...part.pages];
  const trace = traceOf("cerfa", all, answers, locked.preconisation, cibles);
  return (
    <Frame
      title={title}
      part={total}
      total={total}
      trace={trace}
      DebugTrace={DebugTrace}
    >
      <Resultat answers={answers} cibles={cibles} />
      <Cerfa model={model} input={{ answers, cibles, completedAt }} />
      <div className="fr-btns-group fr-btns-group--inline">
        <SecondaryButton onClick={() => onReopen(state)}>
          Précédent
        </SecondaryButton>
        <SecondaryButton onClick={onRestart}>
          Nouvelle simulation
        </SecondaryButton>
      </div>
    </Frame>
  );
}

// ---- implémentation ----

// Le cerfa de la préconisation figée, daté du jour où le complément a été
// validé. Rien quand elle n'en donne pas.
function Cerfa({ model, input }: { model: Model; input: CerfaInput }) {
  const form = model.cerfa.form(input.cibles);
  return (
    form && (
      <CerfaDownload
        form={form}
        input={input}
        date={input.completedAt}
        label={model.cerfa.downloadLabel}
      />
    )
  );
}

// Ce que la trace de debug lit sous un résultat : les pages affichées, les
// questions validées, et la préconisation. `locked` : les cibles figées, que
// les questions d'après le verrou lisent.
function traceOf(
  title: string,
  pages: readonly Page[],
  answers: Answers,
  preconisation: Preconisation,
  locked?: AnyCibles,
): DebugTraceProps {
  return {
    title,
    pages: askedPages(pages, answers, locked),
    answers,
    validated: validatedQuestions(pages, answers, locked),
    ...preconisation,
  };
}

function Frame({
  title,
  part,
  total,
  trace,
  DebugTrace,
  children,
}: {
  title: string;
  part: number;
  total: number;
  trace: DebugTraceProps;
  DebugTrace?: ComponentType<DebugTraceProps>;
  children: ReactNode;
}) {
  return (
    <>
      <h1 className="fr-h3">{title}</h1>
      <Stepper part={part} total={total} />
      {children}
      {DebugTrace && <DebugTrace {...trace} />}
    </>
  );
}

type ButtonProps = { onClick: () => void; children: ReactNode };

function PrimaryButton({ onClick, children }: ButtonProps) {
  return (
    <button type="button" className="fr-btn" onClick={onClick}>
      {children}
    </button>
  );
}

function SecondaryButton({ onClick, children }: ButtonProps) {
  return (
    <button
      type="button"
      className="fr-btn fr-btn--secondary"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
