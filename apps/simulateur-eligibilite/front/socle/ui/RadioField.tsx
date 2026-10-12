// Un choix unique : le `RadioButtons` du DSFR, en variante « riche ».

import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { type Help, OptionHelp } from "./OptionHelp";

type Props = {
  id: string;
  label: string;
  hint?: string;
  options: ReadonlyArray<{
    value: string;
    label: string;
    description?: string;
    /** Une aide dépliable, rendue sous les boutons. */
    help?: Help;
  }>;
  value: string | undefined;
  onChange: (value: string) => void;
  error?: string;
  /** La première option prend le focus à l'affichage. */
  autoFocus?: boolean;
  /** Met le libellé en avant, quand le champ est la question de la page. */
  lead?: boolean;
};

export function RadioField(props: Props) {
  return (
    <>
      <RadioButtons
        id={`fieldset-${props.id}`}
        name={props.id}
        legend={props.label}
        hintText={props.hint}
        state={props.error ? "error" : "default"}
        stateRelatedMessage={props.error}
        // Variante « riche » du DSFR : chaque option est une carte bordée. Le picto
        // est facultatif, on l'omet. `classes.inputGroup` pose `fr-radio-rich` sur
        // chaque groupe : le composant ne le fait seul que si une option a une
        // `illustration`. Incompatible avec `small`.
        classes={{
          inputGroup: "fr-radio-rich",
          legend: props.lead ? "fr-text--lead" : undefined,
        }}
        options={radios(props)}
      />
      <OptionHelp options={props.options} />
    </>
  );
}

// ---- implémentation ----

function radios(props: Props) {
  return props.options.map((option, index) => ({
    label: option.label,
    hintText: option.description,
    nativeInputProps: {
      value: option.value,
      checked: props.value === option.value,
      onChange: () => props.onChange(option.value),
      autoFocus: props.autoFocus && index === 0,
    },
  }));
}
