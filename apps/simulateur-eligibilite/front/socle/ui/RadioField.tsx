// Un choix unique, en boutons radio : chaque option est une carte bordée.

import { type Choice, ChoiceFieldset } from "./ChoiceFieldset";

type Props = {
  id: string;
  label: string;
  hint?: string;
  options: ReadonlyArray<Omit<Choice, "input">>;
  value: string | undefined;
  onChange: (value: string) => void;
  /** Un message par ligne, sous le groupe. */
  errors?: readonly string[];
  /** La première option prend le focus à l'affichage. */
  autoFocus?: boolean;
  /** Met le libellé en avant, quand le champ est la question de la page. */
  lead?: boolean;
};

export function RadioField(props: Props) {
  return (
    <ChoiceFieldset
      id={`fieldset-${props.id}`}
      type="radio"
      legend={props.label}
      hint={props.hint}
      lead={props.lead}
      message={
        props.errors?.length
          ? { state: "error", texts: props.errors }
          : undefined
      }
      choices={radios(props)}
    />
  );
}

// ---- implémentation ----

function radios(props: Props): Choice[] {
  return props.options.map((option, index) => ({
    ...option,
    input: {
      name: props.id,
      value: option.value,
      checked: props.value === option.value,
      onChange: () => props.onChange(option.value),
      autoFocus: props.autoFocus && index === 0,
    },
  }));
}
