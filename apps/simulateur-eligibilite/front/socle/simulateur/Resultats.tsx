// Le résultat du cerfa, le second du parcours, et ce qu'il partage avec le
// premier (`FirstResultat.tsx`) : la trace de debug et les boutons. Le modèle
// fournit son contenu ; le cadre, le stepper et les boutons sont ici.

import type { ComponentType, ReactNode } from "react";
import { CerfaActions } from "../cerfa/CerfaActions";
import { dtoFrom } from "../cerfa-mapping";
import {
  type CerfaInput,
  type Model,
  type Preconisation,
  readingOf,
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
  const { faits, cibles } = locked.preconisation;
  const { part, title, Resultat } = model.cerfa;
  const total = model.transportAndEligibility.parts.length + 1;
  const all = [...pagesOf(model.transportAndEligibility.parts), ...part.pages];
  const trace = traceOf("cerfa", all, answers, locked.preconisation, cibles);
  const read = readingOf(all, answers, cibles);
  return (
    <Frame
      title={title(cibles)}
      part={total}
      total={total}
      trace={trace}
      DebugTrace={DebugTrace}
    >
      <Resultat {...read} cibles={cibles} />
      <Cerfa model={model} input={{ ...read, faits, cibles, completedAt }} />
      <div className="fr-btns-group fr-btns-group--inline fr-no-print">
        <SecondaryButton onClick={() => onReopen(state)}>
          Précédent
        </SecondaryButton>
        <SecondaryButton onClick={onRestart}>
          Faire une nouvelle simulation
        </SecondaryButton>
      </div>
    </Frame>
  );
}

// Ce que la trace de debug lit sous un résultat : les pages affichées, les
// questions validées, et la préconisation. `locked` : les cibles figées, que
// les questions d'après le verrou lisent.
export function traceOf(
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

type ButtonProps = { onClick: () => void; children: ReactNode };

export function PrimaryButton({ onClick, children }: ButtonProps) {
  return (
    <button type="button" className="fr-btn" onClick={onClick}>
      {children}
    </button>
  );
}

export function SecondaryButton({ onClick, children }: ButtonProps) {
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

// ---- implémentation ----

// Le cerfa de la préconisation figée, daté du jour où le complément a été
// validé. Rien quand elle n'en donne pas.
function Cerfa({ model, input }: { model: Model; input: CerfaInput }) {
  const bound = model.cerfa.form(input.cibles);
  return (
    bound && (
      <CerfaActions
        cerfa={bound.cerfa}
        dto={dtoFrom(bound.mapping, input)}
        date={input.completedAt}
        printLabel={model.cerfa.printLabel}
        downloadLabel={model.cerfa.downloadLabel}
      />
    )
  );
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
      <div className="fr-no-print">
        <Stepper part={part} total={total} />
      </div>
      {children}
      {DebugTrace && (
        <div className="fr-no-print">
          <DebugTrace {...trace} />
        </div>
      )}
    </>
  );
}
