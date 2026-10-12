// Un choix multiple : le `Checkbox` du DSFR. Une option peut être exclusive, et
// deux options peuvent s'exclure l'une l'autre.

import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { type ChangeEvent, type ComponentProps, useState } from "react";
import { type Help, OptionHelp } from "./OptionHelp";

type Option = {
  value: string;
  label: string;
  description?: string;
  /** Une aide dépliable, rendue sous les cases. */
  help?: Help;
};

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
  error?: string;
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
    <>
      <Checkbox
        legend={props.label}
        hintText={props.hint}
        {...message(props.error, explanation)}
        options={checkboxes(props, toggle)}
        classes={{ legend: props.lead ? "fr-text--lead" : undefined }}
        style={{ marginBottom: "1.5rem" }}
      />
      <OptionHelp options={props.options} />
    </>
  );
}

// ---- implémentation ----

// La forme des cases est empruntée au composant DSFR, pas recopiée.
type DsfrCheckbox = ComponentProps<typeof Checkbox>["options"][number];

type Toggled = { values: readonly string[]; explanation?: string };

// L'erreur passe devant l'explication : c'est elle qui retient la page.
function message(error?: string, explanation?: string) {
  if (error) return { state: "error", stateRelatedMessage: error } as const;
  if (explanation)
    return { state: "info", stateRelatedMessage: explanation } as const;
  return { state: "default" } as const;
}

function checkboxes(
  props: Props,
  toggle: (value: string, checked: boolean) => void,
): DsfrCheckbox[] {
  const options = props.exclusiveOption
    ? [...props.options, props.exclusiveOption]
    : props.options;
  return options.map((option) => ({
    label: option.label,
    hintText: option.description,
    nativeInputProps: {
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
