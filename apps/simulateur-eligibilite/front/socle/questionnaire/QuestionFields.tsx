// Les champs de la page ouverte. La page affiche son brouillon : une saisie ne
// compte qu'une fois la page validée. Une erreur de saisie s'affiche aussitôt,
// une incohérence au clic sur « Suivant ». Une question en erreur montre ses
// liens vers les réponses à revoir.
//
// Une question qui s'affiche sous une réponse (`shownUnder`) se pose dans le
// panneau de cette réponse, si elle est sélectionnée sur la page ; sinon, à son
// rang (`place-under-a-response.ts`). Un parent n'ouvre qu'un panneau, même
// pour plusieurs questions, et son apparition s'annonce sans bouger le focus.

import type { ReactNode } from "react";
import type { AskedQuestion } from "../../../core/socle/questionnaire-engine";

import { ConditionalPanel } from "../ui";
import { usePanelAnnouncement } from "./announce-a-panel.hook";
import { type CounterOf, counted } from "./count-a-text";
import { QuestionField } from "./QuestionField";
import type { QuestionnaireScreen } from "./questionnaire.hook";
import type { RevisitLink } from "./revisit-an-answer";
import { errorsOf } from "./word-a-problem";

export function QuestionFields({
  questionnaire,
  counterOf,
}: {
  questionnaire: QuestionnaireScreen;
  counterOf?: CounterOf;
}) {
  const field = fieldOf(questionnaire, counterOf);
  return (
    <>
      <PanelAnnouncement questionnaire={questionnaire} />
      {questionnaire.placement.inPlace().map(field)}
    </>
  );
}

// ---- implémentation ----

// Le champ d'une question, et sous chacune de ses réponses, le panneau des
// questions qui s'y placent.
function fieldOf(
  questionnaire: QuestionnaireScreen,
  counterOf: CounterOf | undefined,
): (question: AskedQuestion) => ReactNode {
  const { draft, placement } = questionnaire;
  const field = (question: AskedQuestion): ReactNode => {
    const answer = draft[question.id];
    const counter = counted(counterOf, question.id, answer);
    const errors = [
      ...errorsOf(question, answer, questionnaire.showsInconsistencies),
      ...counter.errors,
    ];
    const links = errors.length > 0 ? questionnaire.revisitsOf(question) : [];
    const nested = (value?: string) => placement.under(question.id, value);
    return (
      <QuestionField
        key={question.id}
        question={question}
        answer={answer}
        errors={errors}
        counter={counter.text}
        onChange={(answer) => questionnaire.answer(question.id, answer)}
        below={(value) => panelOf(nested(value).map(field))}
        after={<RevisitLinks links={links} onOpen={questionnaire.revisit} />}
      />
    );
  };
  return field;
}

function panelOf(fields: readonly ReactNode[]): ReactNode {
  return fields.length > 0 ? (
    <ConditionalPanel>{fields}</ConditionalPanel>
  ) : null;
}

// Une zone que seul un lecteur d'écran lit : elle dit les questions qui
// apparaissent dans un panneau.
function PanelAnnouncement({
  questionnaire,
}: {
  questionnaire: QuestionnaireScreen;
}) {
  const text = usePanelAnnouncement(
    questionnaire.page.id,
    questionnaire.placement.nested,
  );
  return (
    <p className="fr-sr-only" aria-live="polite">
      {text}
    </p>
  );
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
