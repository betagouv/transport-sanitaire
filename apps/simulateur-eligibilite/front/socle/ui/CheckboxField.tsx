// Un choix multiple, en cases à cocher : chaque option est une carte bordée,
// comme un bouton radio. Une option peut être exclusive, et deux options
// peuvent s'exclure l'une l'autre.

import { type ChangeEvent, useState } from "react";
import { type Choice, ChoiceFieldset, type Message } from "./ChoiceFieldset";

type Option = Omit<Choice, "input">;

type Props = {
  id: string;
  label: string;
  hint?: string;
  options: readonly Option[];
  /** La cocher décoche les autres, et inversement. Rendue en dernier. */
  exclusiveOption?: Option;
  /**
   * Les options qui s'excluent deux à deux. Cocher l'une décoche l'autre, et
   * l'explication s'affiche jusqu'au geste suivant.
   */
  incompatibleOptions?: ReadonlyArray<{
    values: readonly [string, string];
    explanation: string;
  }>;
  values: readonly string[];
  onChange: (values: readonly string[]) => void;
  /** Un message par ligne, sous le groupe. */
  errors?: readonly string[];
  /** Met le libellé en avant, quand le champ est la question de la page. */
  lead?: boolean;
};

export function CheckboxField(props: Props) {
  const [explanation, setExplanation] = useState<string>();
  const toggle = (value: string, checked: boolean) => {
    const after = afterToggle(props, value, checked);
    setExplanation(after.explanation);
    props.onChange(after.values);
  };
  return (
    <ChoiceFieldset
      id={props.id}
      type="checkbox"
      legend={props.label}
      hint={props.hint}
      lead={props.lead}
      message={message(props.errors, explanation)}
      choices={checkboxes(props, toggle)}
    />
  );
}

// ---- implémentation ----

type Toggled = { values: readonly string[]; explanation?: string };

// Les erreurs passent devant l'explication : ce sont elles qui retiennent la
// page.
function message(
  errors: readonly string[] = [],
  explanation?: string,
): Message | undefined {
  if (errors.length > 0) return { state: "error", texts: errors };
  if (explanation) return { state: "info", texts: [explanation] };
  return undefined;
}

function checkboxes(
  props: Props,
  toggle: (value: string, checked: boolean) => void,
): Choice[] {
  const options = props.exclusiveOption
    ? [...props.options, props.exclusiveOption]
    : props.options;
  return options.map((option) => ({
    ...option,
    input: {
      name: `${props.id}-${option.value}`,
      checked: props.values.includes(option.value),
      onChange: (e: ChangeEvent<HTMLInputElement>) =>
        toggle(option.value, e.target.checked),
    },
  }));
}

// Cocher l'option exclusive décoche tout le reste, cocher une autre option la
// décoche. Cocher une option décoche aussi celles qui ne vont pas avec elle.
function afterToggle(props: Props, value: string, checked: boolean): Toggled {
  const exclusive = props.exclusiveOption?.value;
  if (!checked) return { values: props.values.filter((v) => v !== value) };
  if (value === exclusive) return { values: [value] };
  const clashes = (props.incompatibleOptions ?? []).filter(
    ({ values }) =>
      values.includes(value) &&
      values.some((other) => other !== value && props.values.includes(other)),
  );
  const unchecked = [exclusive, ...clashes.flatMap(({ values }) => values)];
  return {
    values: [...props.values.filter((v) => !unchecked.includes(v)), value],
    explanation: clashes[0]?.explanation,
  };
}
