// Le formulaire du questionnaire : le stepper, les champs de la page et les
// boutons de navigation. La simulation est la sienne ; seul le brouillon de la page
// vit dans `questionnaire.ts`. Le stepper titre l'écran du nom de la partie, et annonce
// la partie suivante s'il y en a une dans ce questionnaire. La dernière n'annonce
// rien : ce qui la suit dépend du résultat, encore inconnu.
//
// À chaque nouvelle page, en avant comme en arrière, le titre de sa première
// question prend le focus et l'écran revient en haut, sans animation
// (NAV-Q221-PROGRESSIF-001). Une page qu'un lien « Revoir… » rouvre donne le
// focus à la question qu'il vise (ADR-30).

import type { ComponentType, ReactNode } from "react";
import type {
  Answers,
  AnyCibles,
  AskedQuestion,
  QuestionnairePart,
  Validated,
} from "../../../core/socle/questionnaire-engine";

import { ConditionalPanel } from "../ui";
import { QuestionField } from "./QuestionField";
import type {
  QuestionnaireOptions,
  QuestionnaireScreen,
} from "./questionnaire";
import { useQuestionnaire } from "./questionnaire";
import type { RevisitLink } from "./revisit-an-answer";
import { NextStep, Stepper } from "./Stepper";
import { scrollToTheTop } from "./scroll-to-the-top";
import { errorsOf } from "./word-a-problem";

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
  // La trace de debug, un developer tool. Le questionnaire sait où l'afficher
  // et quoi lui donner, pas à qui elle s'ouvre. Absente, rien n'est rendu.
  DebugTrace?: ComponentType<DebugTraceProps>;
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
  DebugTrace,
  ...options
}: Props) {
  const questionnaire = useQuestionnaire(options);
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
        <form
          onSubmit={(e) => {
            e.preventDefault();
            questionnaire.next();
          }}
        >
          <QuestionFields questionnaire={questionnaire} />
          <NavigationButtons
            questionnaire={questionnaire}
            endLabel={endLabel}
          />
        </form>
      </div>
      {DebugTrace && <DebugTrace {...traceOf(questionnaire)} />}
    </>
  );
}

// ---- implémentation ----

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

// La page affiche son brouillon : une saisie ne compte qu'une fois la page
// validée. Une question en erreur montre ses liens vers les réponses à revoir.
// Une question qui s'affiche sous une option (`shownUnder`) se pose dans le
// panneau de cette option, si celle-ci est sur la page ; sinon, à son rang.
function QuestionFields({
  questionnaire,
}: {
  questionnaire: QuestionnaireScreen;
}) {
  const { questions, draft } = questionnaire;
  const parentOf = (question: AskedQuestion) =>
    questions.find(({ id }) => id === question.under?.question);
  const field = (question: AskedQuestion): ReactNode => {
    const errors = errorsOf(question, draft[question.id]);
    const links = errors.length > 0 ? questionnaire.revisitsOf(question) : [];
    return (
      <QuestionField
        key={question.id}
        question={question}
        answer={draft[question.id]}
        errors={errors}
        onChange={(answer) => questionnaire.answer(question.id, answer)}
        below={(option) => {
          const nested = questions.filter(
            (q) => parentOf(q) === question && q.under?.option === option,
          );
          return nested.length > 0 ? (
            <ConditionalPanel>{nested.map(field)}</ConditionalPanel>
          ) : null;
        }}
        after={<RevisitLinks links={links} onOpen={questionnaire.revisit} />}
      />
    );
  };
  return questions.filter((question) => !parentOf(question)).map(field);
}

// Les liens vers les réponses d'avant à revoir. Ce sont de vraies adresses :
// on peut les ouvrir au clavier, et le bouton Retour du navigateur en revient.
// Le clic passe par la simulation, qui garde le brouillon de la page quittée.
function RevisitLinks({
  links,
  onOpen,
}: {
  links: readonly RevisitLink[];
  onOpen: (question: string) => void;
}) {
  if (links.length === 0) return null;
  return (
    <ul className="fr-links-group fr-mt-1w">
      {links.map(({ label, href, question }) => (
        <li key={question}>
          <a
            className="fr-link"
            href={href}
            onClick={(event) => {
              event.preventDefault();
              onOpen(question);
            }}
          >
            {label}
          </a>
        </li>
      ))}
    </ul>
  );
}

function NavigationButtons({
  questionnaire,
  endLabel,
}: {
  questionnaire: QuestionnaireScreen;
  endLabel: string;
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
