// Le résultat du cerfa, le second du parcours, et ce qu'il partage avec le
// premier (`FirstResultat.tsx`) : la trace de debug et les boutons. Le modèle
// fournit son titre, son texte et son cerfa ; la page les range ici, de haut en
// bas (C03 du contrat d'intégration) : le stepper, titré du document ; le
// texte ; « Précédent », « Faire une nouvelle simulation » et, à droite, l'avis
// une fois le document prêt (V02) ; « Imprimer » et « Télécharger » ; l'aperçu
// du document.

import type { ComponentType, ReactNode } from "react";
import type { Preconisation } from "../../../core/socle/model";
import {
  type Read,
  readIn,
} from "../../../core/socle/questionnaire-engine/condition";
import {
  type Answers,
  type AnyCibles,
  pagesOf,
} from "../../../core/socle/questionnaire-engine/question";
import type {
  Questionnaire,
  QuestionnaireState,
} from "../../../core/socle/questionnaire-engine/questionnaire";
import { resultReading } from "../../../core/socle/questionnaire-engine/result-reading";
import { CerfaDocument } from "../cerfa/CerfaDocument";
import { dtoFrom } from "../cerfa-mapping";
import type { CerfaInput, Model } from "../model";
import type { DebugTraceProps } from "../questionnaire-engine/QuestionnaireForm";
import { Stepper } from "../questionnaire-engine/Stepper";
import { FeedbackLink, type FeedbackOffer, feedbackOf } from "./FeedbackLink";
import { questionnaireOf } from "./questionnaire-of";
import "./first-resultat.css";
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
  const part = model.core.complement;
  const { title, Resultat, reading: lecture } = model.cerfa;
  const all = questionnaireOf(model, [
    ...pagesOf(model.core.questionnaire),
    ...part.pages,
  ]);
  const { cibles } = locked.preconisation;
  const trace = traceOf("cerfa", all, answers, locked.preconisation, cibles);
  const read = readOf(all, answers, locked.preconisation, completedAt);
  const reading = read(lecture);
  return (
    <Frame
      title={read(title)}
      part={model.core.questionnaire.length + 1}
      trace={trace}
      DebugTrace={DebugTrace}
    >
      <Resultat reading={reading} />
      <Cerfa
        model={model}
        read={read}
        input={{ reading, completedAt }}
        actions={{ onReopen: () => onReopen(state), onRestart }}
        feedback={feedbackOf(model, read)}
      />
    </Frame>
  );
}

type CerfaActionsProps = {
  readonly onReopen: () => void;
  readonly onRestart: () => void;
};

// Sous le texte : revenir au questionnaire, ou recommencer, et l'avis à droite.
// La barre suit celle du premier résultat (`first-resultat.css`). Rien ne
// s'imprime.
function CerfaActions({
  onReopen,
  onRestart,
  feedback,
}: CerfaActionsProps & { feedback: FeedbackOffer | null }) {
  return (
    <div className="socle-page-actions fr-no-print">
      <div className="fr-btns-group fr-btns-group--inline-md">
        <SecondaryButton onClick={onReopen}>Précédent</SecondaryButton>
        <SecondaryButton onClick={onRestart}>
          Faire une nouvelle simulation
        </SecondaryButton>
        {feedback && <FeedbackLink offer={feedback} />}
      </div>
    </div>
  );
}

/**
 * Ce que lit un résultat : les questions validées de ce questionnaire, avec ces
 * faits et ces cibles, au jour `on`.
 */
export function readOf(
  questionnaire: Questionnaire,
  answers: Answers,
  { faits, cibles }: Preconisation,
  on: Date,
): Read {
  const { validated } = questionnaire.readWith(answers, cibles);
  return readIn(resultReading({ validated, faits, cibles, on }));
}

// Ce que la trace de debug lit sous un résultat : les pages affichées, les
// questions validées, et la préconisation. `locked` : les cibles figées, que
// les questions d'après le verrou lisent.
export function traceOf(
  title: string,
  questionnaire: Questionnaire,
  answers: Answers,
  preconisation: Preconisation,
  locked?: AnyCibles,
): DebugTraceProps {
  const read = questionnaire.readWith(answers, locked);
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
// validé, rien quand elle n'en donne pas. Le modèle peut tenir la place de son
// aperçu. Les boutons le précèdent, et l'avis s'y ajoute une fois son PDF
// prêt. Sans cerfa, les boutons restent, sans avis.
type CerfaProps = {
  model: Model;
  /** Ce que lisent les entrées du cerfa. */
  read: Read;
  input: CerfaInput;
  actions: CerfaActionsProps;
  feedback: FeedbackOffer | null;
};

function Cerfa({ model, read, input, actions, feedback }: CerfaProps) {
  const { form, standIn, printLabel, downloadLabel } = model.cerfa;
  const bound = read(form);
  if (!bound) return <CerfaActions {...actions} feedback={null} />;
  return (
    <CerfaDocument
      cerfa={bound.cerfa}
      dto={dtoFrom(bound.mapping, read)}
      date={input.completedAt}
      printLabel={printLabel}
      downloadLabel={downloadLabel}
      standIn={standIn?.(input)}
      above={(ready) => (
        <CerfaActions {...actions} feedback={ready ? feedback : null} />
      )}
    />
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
