// Le formulaire du questionnaire : le stepper, les champs de la page et les
// boutons de navigation. La simulation est la sienne ; seul le brouillon de la page
// vit dans `questionnaire.hook.ts`. Le stepper titre l'écran du nom de la partie, et annonce
// la partie suivante s'il y en a une dans ce questionnaire. La dernière n'annonce
// rien : ce qui la suit dépend du résultat, encore inconnu.
//
// À chaque nouvelle page, en avant comme en arrière, le titre de sa première
// question prend le focus et l'écran revient en haut, sans animation
// (NAV-Q221-PROGRESSIF-001). Une page qu'un lien « Revoir… » rouvre donne le
// focus à la question qu'il vise (ADR-0041).

import type { ComponentType, FormEvent } from "react";
import type {
  Answers,
  AnyCibles,
  QuestionnairePart,
  Validated,
} from "../../../core/socle/questionnaire-engine";

import type { CounterOf } from "./count-a-text";
import { QuestionFields } from "./QuestionFields";
import type {
  QuestionnaireOptions,
  QuestionnaireScreen,
} from "./questionnaire.hook";
import { useQuestionnaire } from "./questionnaire.hook";
import { useFocusReturn } from "./return-the-focus.hook";
import { NextStep, Stepper } from "./Stepper";
import { scrollToTheTop } from "./scroll-to-the-top";

type Props = QuestionnaireOptions & {
  // Les parties de ce questionnaire, dans l'ordre : celles de l'étape de la
  // simulation. Le stepper les titre.
  parts: readonly QuestionnairePart[];
  // Le nombre de parties déjà passées avant ce questionnaire.
  partsBefore?: number;
  // Nombre de parties que le stepper annonce, tous questionnaires confondus. Il
  // compte des parties, pas des pages : une question de plus ne le décale pas.
  partCount: number;
  // Libellé du bouton de la dernière page.
  endLabel: string;
  // Ouvre une simulation vide. Un blocage qui le propose en montre le bouton.
  onRestart: () => void;
  // La trace de debug, un developer tool. Le questionnaire sait où l'afficher
  // et quoi lui donner, pas à qui elle s'ouvre. Absente, rien n'est rendu.
  DebugTrace?: ComponentType<DebugTraceProps>;
  // Le compteur d'une question, pour sa saisie. Sans lui, aucun.
  counterOf?: CounterOf;
};

/** Ce qu'un écran du simulateur donne à lire à la trace de debug. */
export type DebugTraceProps = {
  title: string;
  /** Les pages affichées, dans l'ordre. */
  pages: ReadonlyArray<{ id: string }>;
  /** La page ouverte, s'il y en a une. */
  currentPage?: string;
  /** Les questions affichées sur la page ouverte, répondues ou non. */
  questions?: ReadonlyArray<{ id: string; label: string }>;
  /** Le brouillon de la page ouverte. */
  draft?: Answers;
  answers: Answers;
  /** Les questions validées, avec ce qui s'y proposait. */
  validated?: Validated;
  /** Ce que la préconisation a calculé, sur un résultat. */
  faits?: Readonly<Record<string, unknown>>;
  cibles?: AnyCibles;
};

export function QuestionnaireForm({
  parts,
  partsBefore = 0,
  partCount,
  endLabel,
  onRestart,
  DebugTrace,
  counterOf,
  ...options
}: Props) {
  const questionnaire = useQuestionnaire(options);
  const pageForm = usePageForm(questionnaire);
  const part = parts.findIndex((p) => p.pages.includes(questionnaire.page));
  const stepper = { parts, part, partsBefore, partCount };

  return (
    <>
      <div
        key={questionnaire.page.id}
        ref={enterPage}
        data-focus={questionnaire.focus}
      >
        <PartStepper {...stepper} />
        <form {...pageForm}>
          <QuestionFields questionnaire={questionnaire} counterOf={counterOf} />
          <NavigationButtons
            questionnaire={questionnaire}
            endLabel={endLabel}
            onRestart={onRestart}
          />
        </form>
      </div>
      {DebugTrace && <DebugTrace {...traceOf(questionnaire)} />}
    </>
  );
}

// ---- implémentation ----

// « Suivant » valide la page ; le focus d'un champ retiré de son panneau revient
// à la réponse qui l'ouvrait.
function usePageForm(questionnaire: QuestionnaireScreen) {
  const onFocus = useFocusReturn();
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    questionnaire.next();
  };
  return { onFocus, onSubmit };
}

// L'écran d'une page vient d'apparaître : il revient en haut d'un coup, ce qui
// respecte la réduction des animations, puis le titre de la première question
// prend le focus, ou celui de la question qu'un lien vient de rouvrir. Ce titre
// est la légende d'un groupe, ou le libellé d'un champ. La page qui intègre
// l'écran, s'il y en a une, remonte aussi au haut de l'iframe.
function enterPage(screen: HTMLDivElement | null) {
  if (!screen) return;
  scrollToTheTop(screen.ownerDocument);
  const focused = `[data-question="${screen.dataset.focus}"]`;
  const title =
    screen.querySelector<HTMLElement>(`${focused} legend, ${focused} label`) ??
    screen.querySelector<HTMLElement>("form legend, form label");
  if (!title) return;
  title.tabIndex = -1;
  title.focus({ preventScroll: true });
}

// Le stepper de la partie ouverte, qui titre l'écran. Il annonce la partie
// suivante de ce questionnaire, s'il y en a une.
function PartStepper({
  parts,
  part,
  partsBefore,
  partCount,
}: Pick<Props, "parts" | "partCount"> & { part: number; partsBefore: number }) {
  const next = parts[part + 1];
  return (
    <Stepper
      title={parts[part]?.title}
      level={1}
      part={partsBefore + part + 1}
      total={partCount}
      details={next && <NextStep label={next.title} />}
    />
  );
}

// Ce que la trace lit sous le questionnaire : la page affichée et ses questions,
// répondues ou non, les pages, le brouillon et les réponses validées.
function traceOf(questionnaire: QuestionnaireScreen): DebugTraceProps {
  return {
    title: "chemin parcouru",
    pages: questionnaire.pages,
    currentPage: questionnaire.page.id,
    questions: questionnaire.questions.map(({ id, label }) => ({ id, label })),
    draft: questionnaire.draft,
    answers: questionnaire.answers,
    validated: questionnaire.validated,
  };
}

function NavigationButtons({
  questionnaire,
  endLabel,
  onRestart,
}: {
  questionnaire: QuestionnaireScreen;
  endLabel: string;
  onRestart: () => void;
}) {
  return (
    <div
      className="fr-btns-group fr-btns-group--inline"
      style={{ marginTop: "2rem" }}
    >
      {questionnaire.hasPrevious && (
        <button
          type="button"
          className="fr-btn fr-btn--secondary"
          onClick={questionnaire.back}
        >
          Précédent
        </button>
      )}
      {questionnaire.offersRestart && <RestartButton onClick={onRestart} />}
      {/* Une page à choix unique avance d'elle-même : lui donner un bouton de
          validation contredirait le geste qu'on attend du prescripteur. */}
      {!questionnaire.autoAdvances && (
        <button
          type="submit"
          className="fr-btn"
          disabled={questionnaire.hasPendingQuestions}
        >
          {questionnaire.isLast ? endLabel : "Suivant"}
        </button>
      )}
    </div>
  );
}

// Le blocage demande une autre simulation : il en donne le moyen.
function RestartButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="fr-btn fr-btn--secondary"
      onClick={onClick}
    >
      Faire une nouvelle simulation
    </button>
  );
}
