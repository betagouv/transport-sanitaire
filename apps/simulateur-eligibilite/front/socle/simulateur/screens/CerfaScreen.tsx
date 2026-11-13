// Le résultat du cerfa, le second du parcours, et ce qu'il partage avec le
// premier (`ResultatScreen.tsx`) : la trace de debug et les boutons. Le modèle
// fournit son titre, son texte et son cerfa ; la page les range ici, de haut en
// bas (C03 du contrat d'intégration) : le stepper, titré du document ; le
// texte, une fois le document prêt, l'état de sa génération d'ici là ;
// « Précédent », « Faire une nouvelle simulation » et, à droite, l'avis
// une fois le document prêt (V02) ; « Imprimer » et « Télécharger » ; l'aperçu
// du document.

import type { ComponentType, ReactNode } from "react";
import type { Read } from "../../../../core/socle/questionnaire-engine";
import {
  type Button,
  type ButtonTracking,
  useDocumentTracking,
  useResultScreen,
} from "../../analytics";
import {
  CerfaDocument,
  dtoFrom,
  fileNameOf,
  type PdfSignals,
} from "../../cerfa";

import type { CerfaInput, Model } from "../../model";
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
  const read = simulation.read(completedAt);
  const reading = read(lecture);
  useResultScreen("R3", simulation);
  return (
    <Frame
      title={read(title)}
      part={model.core.questionnaire.length + 1}
      trace={trace}
      DebugTrace={DebugTrace}
    >
      <Cerfa
        model={model}
        read={read}
        text={<Resultat reading={reading} />}
        input={{ reading, completedAt }}
        actions={{ onReopen: () => onChange(simulation.reopen()), onRestart }}
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

// Le cerfa de la préconisation figée, daté du jour où le complément a été
// validé, rien quand elle n'en donne pas. Le modèle peut tenir la place de son
// aperçu. Le texte et l'avis attendent que son PDF soit prêt ; les boutons le
// précèdent. Sans cerfa, le texte et les boutons restent, sans avis. Le journal
// reçoit le document prêt, tel qu'il se télécharge, avec ses boutons, chaque
// échec, et chaque clic.
type CerfaProps = {
  model: Model;
  /** Ce que lisent les entrées du cerfa. */
  read: Read;
  /** Le texte du résultat. */
  text: ReactNode;
  input: CerfaInput;
  actions: CerfaActionsProps;
  feedback: FeedbackOffer | null;
};

function Cerfa({ model, read, text, input, actions, feedback }: CerfaProps) {
  const { form, standIn, printLabel, downloadLabel } = model.cerfa;
  const tracking = useDocumentTracking(offered(feedback));
  const bound = read(form);
  if (!bound)
    return (
      <>
        {text}
        <CerfaActions {...actions} feedback={null} />
      </>
    );
  const dto = dtoFrom(bound.mapping, read);
  const file = fileNameOf(bound.cerfa.fileName, input.completedAt);
  return (
    <CerfaDocument
      cerfa={bound.cerfa}
      dto={dto}
      date={input.completedAt}
      printLabel={printLabel}
      downloadLabel={downloadLabel}
      text={text}
      standIn={standIn?.(input)}
      above={aboveTheDocument(actions, feedback, tracking)}
      onReady={() => tracking.displayed({ file, dto })}
      onFailure={tracking.failed}
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

function documentSignals(tracking: ButtonTracking): PdfSignals {
  return {
    onPrint: () => tracking.pressed("document_print"),
    onDownload: () => tracking.pressed("document_download"),
    onDownloaded: () => tracking.delivered("document_download"),
  };
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
