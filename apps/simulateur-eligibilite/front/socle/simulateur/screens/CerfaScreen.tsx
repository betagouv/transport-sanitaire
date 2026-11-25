// Le résultat du cerfa, le second du parcours, et ce qu'il partage avec le
// premier (`ResultatScreen.tsx`) : la trace de debug et les boutons. Le modèle
// fournit son titre, son texte et son cerfa ; la page les range ici, de haut en
// bas (C03 du contrat d'intégration) : le stepper, titré du document ; le
// texte, une fois le document prêt, l'état de sa génération d'ici là ;
// « Précédent », « Faire une nouvelle simulation » et, à droite, l'avis
// une fois le document prêt (V02) ; « Imprimer » et « Télécharger » ; l'aperçu
// du document.
//
// Un texte strict qui ne tient pas se réécrit au-dessus des actions. La
// simulation garde son brouillon et son texte validé : le
// texte validé remplace celui du modèle, et chaque validation remonte le
// document, régénéré. Le focus va alors au titre de la page.

import { type ComponentType, type ReactNode, type Ref, useRef } from "react";
import type { Context } from "../../../../core/socle/questionnaire-engine";
import type { Simulation } from "../../../../core/socle/simulation";
import {
  type Button,
  type ButtonTracking,
  type DocumentTracking,
  useDocumentTracking,
  useResultScreen,
} from "../../analytics";
import {
  type BoundCerfa,
  CerfaDocument,
  type CerfaDto,
  dtoFrom,
  PdfFileName,
  type PdfSignals,
  type StrictTextEdits,
} from "../../cerfa";

import type { CerfaInput, Model } from "../../model.types";
import { type DebugTraceProps, Stepper } from "../../questionnaire";

import { SecondaryButton } from "../../ui";
import type { ScreenProps } from "../Simulateur";
import { FeedbackLink, type FeedbackOffer, feedbackOf } from "./FeedbackLink";
import "./resultat-screen.css";

// « Précédent » revient au second questionnaire, jamais avant le verrou. La
// préconisation affichée est celle que le verrou a figée. Le cerfa se télécharge
// tel que le résultat l'affiche, daté du jour où le complément a été validé.
export function CerfaScreen({
  model,
  simulation,
  completedAt,
  DebugTrace,
  onChange,
  onRestart,
}: ScreenProps & { completedAt: Date }) {
  const { title, Resultat, reading: lecture } = model.cerfa;
  const trace = { title: "cerfa", ...simulation.trace() };
  const context = simulation.resultContext(completedAt);
  const reading = lecture.in(context);
  const titleRef = useRef<HTMLHeadingElement>(null);
  useResultScreen("R3", simulation);
  const edits = editsOf(simulation, onChange, () => titleRef.current?.focus());
  return (
    <Frame
      title={title.in(context)}
      part={model.core.questionnaire.length + 1}
      trace={trace}
      DebugTrace={DebugTrace}
      titleRef={titleRef}
    >
      <Cerfa
        model={model}
        context={context}
        text={<Resultat reading={reading} />}
        input={{ reading, completedAt }}
        actions={{ onReopen: () => onChange(simulation.reopen()), onRestart }}
        feedback={feedbackOf(model, context)}
        edits={edits}
      />
    </Frame>
  );
}

type CerfaActionsProps = {
  readonly onReopen: () => void;
  readonly onRestart: () => void;
};

// Sous le texte : revenir au questionnaire, ou recommencer, et l'avis à droite.
// La barre suit celle du premier résultat (`resultat-screen.css`). Rien ne
// s'imprime.
function CerfaActions({
  onReopen,
  onRestart,
  feedback,
  onFeedback,
}: CerfaActionsProps & {
  feedback: FeedbackOffer | null;
  onFeedback?: () => void;
}) {
  return (
    <div className="socle-page-actions fr-no-print">
      <div className="fr-btns-group fr-btns-group--inline-md">
        <SecondaryButton onClick={onReopen}>Précédent</SecondaryButton>
        <SecondaryButton onClick={onRestart}>
          Faire une nouvelle simulation
        </SecondaryButton>
        {feedback && <FeedbackLink offer={feedback} onClick={onFeedback} />}
      </div>
    </div>
  );
}

// ---- implémentation ----

// Les textes réécrits de la simulation : chaque frappe et chaque validation
// donnent une nouvelle simulation.
function editsOf(
  simulation: Simulation,
  onChange: (next: Simulation) => void,
  onValidated: () => void,
): Edits {
  const { edits } = simulation;
  return {
    drafts: edits.drafts,
    accepted: edits.accepted,
    onEdit: (entry, text) =>
      onChange(simulation.withEdits(edits.draft(entry, text))),
    onValidate: (entry) => {
      onChange(simulation.withEdits(edits.accept(entry)));
      onValidated();
    },
  };
}

// Le cerfa de la préconisation figée, daté du jour où le complément a été
// validé, rien quand elle n'en donne pas. Le modèle peut tenir la place de son
// aperçu. Le texte et l'avis attendent que son PDF soit prêt ; les boutons le
// précèdent. Sans cerfa, le texte et les boutons restent, sans avis. Le journal
// reçoit le document prêt, tel qu'il se télécharge, avec ses boutons, chaque
// échec, et chaque clic.
type CerfaProps = {
  model: Model;
  /** Le contexte où se lisent les entrées du cerfa. */
  context: Context;
  /** Le texte du résultat. */
  text: ReactNode;
  input: CerfaInput;
  actions: CerfaActionsProps;
  feedback: FeedbackOffer | null;
  edits: Edits;
};

// Les textes réécrits, et ceux qui sont validés.
type Edits = StrictTextEdits & { readonly accepted: Texts };
type Texts = Readonly<Record<string, string>>;

// Le DTO du cerfa, où chaque texte validé remplace le sien : dans les champs,
// ou dans les dessins pour un texte que le cerfa dessine.
function dtoWithAccepted(
  { mapping, cerfa }: BoundCerfa,
  context: Context,
  accepted: Texts,
): CerfaDto {
  const dto = dtoFrom(mapping, context);
  const drawn = cerfa.drawings;
  const among = (inDrawings: boolean) =>
    Object.fromEntries(
      Object.entries(accepted).filter(([key]) => key in drawn === inDrawings),
    );
  return {
    ...dto,
    fields: { ...dto.fields, ...among(false) },
    drawings: { ...dto.drawings, ...among(true) },
  };
}

function Cerfa({
  model,
  context,
  text,
  input,
  actions,
  feedback,
  edits,
}: CerfaProps) {
  const { form, standIn, printLabel, downloadLabel } = model.cerfa;
  const tracking = useDocumentTracking(offered(feedback));
  const bound = form.in(context);
  if (!bound)
    return (
      <>
        {text}
        <CerfaActions {...actions} feedback={null} />
      </>
    );
  const dto = dtoWithAccepted(bound, context, edits.accepted);
  const file = new PdfFileName(bound.cerfa.fileName, input.completedAt).value;
  return (
    <CerfaDocument
      key={JSON.stringify(edits.accepted)}
      cerfa={bound.cerfa}
      dto={dto}
      edits={edits}
      date={input.completedAt}
      printLabel={printLabel}
      downloadLabel={downloadLabel}
      text={text}
      standIn={standIn?.(input)}
      above={aboveTheDocument(actions, feedback, tracking)}
      onReady={(typography) => tracking.displayed({ file, dto, typography })}
      onFailure={tracking.failed}
      onWithdrawn={tracking.withdrawn}
      signals={documentSignals(tracking)}
    />
  );
}

// Ce qui précède le document : l'avis attend que son PDF soit prêt.
function aboveTheDocument(
  actions: CerfaActionsProps,
  feedback: FeedbackOffer | null,
  tracking: ButtonTracking,
) {
  return (ready: boolean) => (
    <CerfaActions
      {...actions}
      feedback={ready ? feedback : null}
      onFeedback={() => tracking.pressed("feedback")}
    />
  );
}

// Les boutons que le document prêt offre au journal : les siens, et l'avis.
function offered(feedback: FeedbackOffer | null): Button[] {
  return [
    "document_print",
    "document_download",
    ...(feedback ? (["feedback"] as const) : []),
  ];
}

function documentSignals(tracking: DocumentTracking): PdfSignals {
  return {
    onPrint: () => tracking.pressed("document_print"),
    onDownload: () => tracking.pressed("document_download"),
    onPrintLaunched: () => tracking.launched("print"),
    onDownloadLaunched: () => tracking.launched("download"),
    onDownloaded: tracking.delivered,
  };
}

// Le stepper titre la page du titre du document : c'est son `h1`. Le second
// résultat est la dernière partie, que rien ne suit.
function Frame({
  title,
  part,
  trace,
  DebugTrace,
  titleRef,
  children,
}: {
  titleRef: Ref<HTMLHeadingElement>;
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
          titleRef={titleRef}
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
