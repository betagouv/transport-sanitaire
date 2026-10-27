// Le résultat du cerfa, le second du parcours, et ce qu'il partage avec le
// premier (`FirstResultat.tsx`) : la trace de debug et les boutons. Le modèle
// fournit son titre, son texte et son cerfa ; la page les range ici, de haut en
// bas (C03 du contrat d'intégration) : le stepper, titré du document ; le
// texte ; « Précédent » et « Faire une nouvelle simulation » ; « Imprimer » et
// « Télécharger » ; l'aperçu du document ; l'avis, une fois le document prêt.

import type { ComponentType, ReactNode } from "react";
import type { Preconisation } from "../../../core/socle/model";
import {
  type Read,
  readIn,
} from "../../../core/socle/questionnaire-engine/condition";
import {
  type Answers,
  type AnyCibles,
  type Page,
  pagesOf,
} from "../../../core/socle/questionnaire-engine/question";
import {
  Questionnaire,
  type QuestionnaireState,
} from "../../../core/socle/questionnaire-engine/questionnaire";
import { resultReading } from "../../../core/socle/questionnaire-engine/result-reading";
import { CerfaDocument } from "../cerfa/CerfaDocument";
import { dtoFrom } from "../cerfa-mapping";
import type { CerfaInput, Model } from "../model";
import type { DebugTraceProps } from "../questionnaire-engine/QuestionnaireForm";
import { Stepper } from "../questionnaire-engine/Stepper";
import { FeedbackLink, type FeedbackOffer, feedbackOf } from "./FeedbackLink";
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
  const part = model.core.complement;
  const { title, Resultat } = model.cerfa;
  const all = [...pagesOf(model.core.questionnaire), ...part.pages];
  const trace = traceOf("cerfa", all, answers, locked.preconisation, cibles);
  const read = readOf(all, answers, locked.preconisation, completedAt);
  return (
    <Frame
      title={title(cibles)}
      part={model.core.questionnaire.length + 1}
      trace={trace}
      DebugTrace={DebugTrace}
    >
      <Resultat read={read} faits={faits} cibles={cibles} />
      <div className="fr-btns-group fr-btns-group--inline-md fr-no-print">
        <SecondaryButton onClick={() => onReopen(state)}>
          Précédent
        </SecondaryButton>
        <SecondaryButton onClick={onRestart}>
          Faire une nouvelle simulation
        </SecondaryButton>
      </div>
      <Cerfa
        model={model}
        input={{ read, faits, cibles, completedAt }}
        feedback={feedbackOf(model, answers)}
      />
    </Frame>
  );
}

/**
 * Ce que lit un résultat : les questions validées de ces pages, avec ces faits
 * et ces cibles, au jour `on`.
 */
export function readOf(
  pages: readonly Page[],
  answers: Answers,
  { faits, cibles }: Preconisation,
  on: Date,
): Read {
  const { validated } = new Questionnaire(pages).readWith(answers, cibles);
  return readIn(resultReading({ validated, faits, cibles, on }));
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
  const read = new Questionnaire(pages).readWith(answers, locked);
  return {
    title,
    pages: read.askedPages(),
    answers,
    validated: read.validated.toJSON(),
    ...preconisation,
  };
}

type ButtonProps = { onClick: () => void; children: ReactNode };

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
// validé. Rien quand elle n'en donne pas. Le modèle peut tenir la place de son
// aperçu. L'avis le suit, une fois son PDF prêt.
type CerfaProps = {
  model: Model;
  input: CerfaInput;
  feedback: FeedbackOffer | null;
};

function Cerfa({ model, input, feedback }: CerfaProps) {
  const { form, standIn, printLabel, downloadLabel } = model.cerfa;
  const bound = form(input.cibles);
  return (
    bound && (
      <CerfaDocument
        cerfa={bound.cerfa}
        dto={dtoFrom(bound.mapping, input.read)}
        date={input.completedAt}
        printLabel={printLabel}
        downloadLabel={downloadLabel}
        standIn={standIn?.(input)}
        onceReady={feedback && <FeedbackLink offer={feedback} />}
      />
    )
  );
}

// Le stepper titre la page du titre du document : c'est son `h1`. Le second
// résultat est la dernière partie, que rien ne suit.
function Frame({
  title,
  part,
  trace,
  DebugTrace,
  children,
}: {
  title: string;
  part: number;
  trace: DebugTraceProps;
  DebugTrace?: ComponentType<DebugTraceProps>;
  children: ReactNode;
}) {
  return (
    <>
      <div className="fr-no-print">
        <Stepper
          title={title}
          level={1}
          part={part}
          total={part}
          details={<span className="fr-text--bold">Préparation terminée.</span>}
        />
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
