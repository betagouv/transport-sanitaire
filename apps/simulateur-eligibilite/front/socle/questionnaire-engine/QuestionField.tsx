// Rend une question avec le champ de `front/socle/ui/` qui lui convient.

import { CheckboxField } from "../ui/CheckboxField";
import { DateField } from "../ui/DateField";
import { NumberField } from "../ui/NumberField";
import { RadioField } from "../ui/RadioField";
import { SelectField } from "../ui/SelectField";
import { TextAreaField } from "../ui/TextAreaField";
import { TextField } from "../ui/TextField";
import type {
  Answer,
  MultipleChoice,
  Question,
  SingleChoice,
} from "./question";

type Props = {
  question: Question;
  answer: Answer | undefined;
  /** `undefined` retire la réponse : un champ vidé n'est plus répondu. */
  onChange: (answer: Answer | undefined) => void;
  /** Ce qui ne va pas dans la saisie, affiché sous le champ. */
  error?: string;
  /** Le champ prend le focus à l'ouverture de la page. */
  autoFocus?: boolean;
};

export function QuestionField(props: Props) {
  return (
    <div className="fr-form-group" style={{ marginBottom: "1.5rem" }}>
      {render(props)}
    </div>
  );
}

// ---- implémentation ----

type NumberQuestion = Extract<Question, { kind: "number" }>;
type DateQuestion = Extract<Question, { kind: "date" | "datetime" }>;

// Ce que tous les champs reçoivent. Le libellé est mis en avant : sur une page
// du questionnaire, c'est lui qui porte la question.
function common({ question, error, autoFocus }: Props) {
  return {
    id: question.id,
    label: question.label,
    hint: question.hint,
    error,
    autoFocus,
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
    case "number":
      return <NumberQuestionField {...props} question={question} />;
    case "date":
    case "datetime":
      return <DateQuestionField {...props} question={question} />;
    case "long text":
      return <TextAreaField {...text(props)} />;
    default:
      return <TextField {...text(props)} />;
  }
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

function DateQuestionField(props: Props & { question: DateQuestion }) {
  const { question } = props;
  return (
    <DateField
      {...text(props)}
      withTime={question.kind === "datetime"}
      min={question.min}
      max={question.max}
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
        options={question.options}
        value={value ?? ""}
        onChange={onChange}
      />
    );
  return (
    <RadioField
      {...common(props)}
      options={question.options}
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
      options={question.options}
      exclusiveOption={question.exclusiveOption}
      incompatibleOptions={question.incompatibleOptions}
      values={Array.isArray(answer) ? answer : []}
      onChange={(values) => onChange(values.length > 0 ? values : undefined)}
    />
  );
}

// Ce qu'une saisie de texte reçoit en plus. Un champ vidé n'est plus répondu.
function text(props: Props) {
  return {
    ...common(props),
    value: typeof props.answer === "string" ? props.answer : "",
    onChange: (value: string) => props.onChange(value || undefined),
  };
}
