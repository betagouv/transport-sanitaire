// Affiche une question avec le champ de `front/socle/ui/` qui lui convient. Le
// groupe porte l'identifiant de sa question : un lien qui la rouvre y pose le
// focus.

import { type ReactNode, useState } from "react";
import {
  Address,
  type Answer,
  type AnswerProblem,
  type AskedQuestion,
  type Unanswered,
} from "../../../core/socle/questionnaire-engine";

import {
  AddressField,
  CheckboxField,
  DateField,
  LoneCheckbox,
  NumberField,
  RadioField,
  Reminder,
  SelectField,
  TextAreaField,
  TextField,
} from "../ui";

import { LabelAQuestionService } from "./label-a-question.service";
import { LayOutAnAddressService } from "./lay-out-an-address.service";
import { WordAProblemService } from "./word-a-problem.service";
import "./question-field.css";

type Props = {
  question: AskedQuestion;
  answer: Answer | Unanswered;
  /** `undefined` retire la réponse : un champ vidé n'est plus répondu. */
  onChange: (answer: Answer | Unanswered) => void;
  /**
   * Ce qui ne va pas dans la saisie, un message par ligne sous le champ. Une
   * adresse a un message par champ, et lit celui-ci comme un message de groupe,
   * tant qu'aucun de ses champs n'est fautif.
   */
  errors?: readonly string[];
  /**
   * Ce qui s'affiche sous une réponse sélectionnée : ses questions, dans leur
   * panneau. Une case seule n'a pas de réponse possible.
   */
  below?: (possibleAnswer?: string) => ReactNode;
  /** Le compteur d'un texte long : « 12 / 54 caractères ». */
  counter?: string;
  /** Ce qui s'affiche sous le champ : les liens vers les réponses à revoir. */
  after?: ReactNode;
};

export function QuestionField(props: Props) {
  return (
    <div
      className="fr-form-group socle-question"
      data-question={props.question.id}
    >
      <Reminder reminder={props.question.reminder} />
      {render(props)}
      {props.after}
    </div>
  );
}

// ---- implémentation ----

type Asked<Kind extends AskedQuestion["kind"]> = Extract<
  AskedQuestion,
  { kind: Kind }
>;
type AddressQuestion = Asked<"address">;
type NumberQuestion = Asked<"number">;
type DateQuestion = Asked<"date" | "datetime">;
type CheckboxQuestion = Asked<"checkbox">;
type SingleChoice = Asked<"single choice">;
type MultipleChoice = Asked<"multiple choice">;

// Ce que tous les champs reçoivent. Le libellé est mis en avant : sur une page
// du questionnaire, c'est lui qui porte la question.
function common({ question, errors }: Props) {
  return {
    id: question.id,
    label: LabelAQuestionService.displayedLabel(
      question.label,
      question.optional,
    ),
    hint: question.hint,
    errors,
    lead: true,
  };
}

function render(props: Props) {
  const { question } = props;
  switch (question.kind) {
    case "single choice":
      return <SingleChoiceField {...props} question={question} />;
    case "multiple choice":
      return <MultipleChoiceField {...props} question={question} />;
    case "checkbox":
      return <SingleCheckboxField {...props} question={question} />;
    case "address":
      return <AddressQuestionField {...props} question={question} />;
    case "number":
      return <NumberQuestionField {...props} question={question} />;
    case "date":
    case "datetime":
      return <DateQuestionField {...props} question={question} />;
    case "long text":
      return <TextAreaField {...text(props)} counter={props.counter} />;
    default:
      return <TextField {...text(props)} />;
  }
}

// Chaque champ qui se demande reçoit sa valeur et son message. Le brouillon
// garde la saisie telle quelle : les espaces ne tombent qu'à la validation. Une
// erreur de champ passe devant le message de groupe.
function AddressQuestionField(props: Props & { question: AddressQuestion }) {
  const { question, onChange } = props;
  const address = Address.of(props.answer);
  const problems = address ? question.fieldProblems(address) : {};
  const failing = Object.keys(problems).length > 0;
  return (
    <AddressField
      id={question.id}
      errors={failing ? [] : props.errors}
      label={LabelAQuestionService.displayedLabel(
        question.label,
        question.optional,
      )}
      hint={question.hint}
      lead
      fields={LayOutAnAddressService.displayedFields(question).map((field) => {
        const problem = problems[field.name];
        return {
          ...field,
          value: address?.field(field.name) ?? "",
          error: problem && WordAProblemService.messageOf(problem),
        };
      })}
      onChange={(name, text) =>
        onChange((address ?? Address.empty()).withField(name, text)?.toJSON())
      }
    />
  );
}

function NumberQuestionField(props: Props & { question: NumberQuestion }) {
  const { question, answer, onChange } = props;
  return (
    <NumberField
      {...common(props)}
      min={question.min}
      max={question.max}
      integer={question.integer}
      unit={question.unit}
      value={typeof answer === "number" ? answer : undefined}
      onChange={onChange}
    />
  );
}

// Une date que le navigateur ne lit pas laisse la réponse vide : le message
// vient du champ, pas de la réponse.
function DateQuestionField(props: Props & { question: DateQuestion }) {
  const { question } = props;
  const [unreadable, setUnreadable] = useState(false);
  const errors = unreadable
    ? [WordAProblemService.messageOf(INVALID_DATE)]
    : props.errors;
  return (
    <DateField
      {...text({ ...props, errors })}
      withTime={question.kind === "datetime"}
      min={question.min}
      max={question.max}
      onBadInput={setUnreadable}
    />
  );
}

function SingleChoiceField(props: Props & { question: SingleChoice }) {
  const { question, answer, onChange } = props;
  const value = typeof answer === "string" ? answer : undefined;
  if (question.dropdown)
    return (
      <SelectField
        {...common(props)}
        placeholder="Sélectionnez une option"
        options={question.possibleAnswers}
        value={value ?? ""}
        onChange={onChange}
        below={value !== undefined && props.below?.(value)}
      />
    );
  return (
    <RadioField
      {...common(props)}
      boldLabels={question.boldLabels}
      options={question.possibleAnswers.map((possibleAnswer) => ({
        ...possibleAnswer,
        below: possibleAnswer.value === value && props.below?.(value),
      }))}
      value={value}
      onChange={onChange}
    />
  );
}

// Plus rien de coché n'est pas une réponse vide : c'est une absence de réponse.
function MultipleChoiceField(props: Props & { question: MultipleChoice }) {
  const { question, answer, onChange } = props;
  return (
    <CheckboxField
      {...common(props)}
      options={question.possibleAnswers.map((possibleAnswer) => ({
        ...possibleAnswer,
        below: props.below?.(possibleAnswer.value),
      }))}
      exclusiveOption={question.exclusivePossibleAnswer}
      incompatibleOptions={question.incompatiblePossibleAnswers}
      values={Array.isArray(answer) ? answer : []}
      onChange={(values) => onChange(values.length > 0 ? values : undefined)}
    />
  );
}

// Une case seule : une seule case sous son libellé, ou portant son libellé
// quand elle n'a pas de texte à elle. Décochée, elle répond `false`, pas une
// absence de réponse. Cochée, ses questions s'affichent sous elle.
function SingleCheckboxField(props: Props & { question: CheckboxQuestion }) {
  const { question, answer, onChange } = props;
  const below = answer === true && props.below?.();
  if (question.box === undefined)
    return (
      <LoneCheckbox
        {...common(props)}
        checked={answer === true}
        onChange={onChange}
        below={below}
      />
    );
  return (
    <CheckboxField
      {...common(props)}
      options={[{ value: CHECKED, label: question.box, below }]}
      values={answer === true ? [CHECKED] : []}
      onChange={(values) => onChange(values.includes(CHECKED))}
    />
  );
}

const CHECKED = "coche";

const INVALID_DATE: AnswerProblem = { kind: "invalid date" };

// Ce qu'une saisie de texte reçoit en plus. Un champ vidé n'est plus répondu.
function text(props: Props) {
  return {
    ...common(props),
    value: typeof props.answer === "string" ? props.answer : "",
    onChange: (value: string) => props.onChange(value || undefined),
  };
}
