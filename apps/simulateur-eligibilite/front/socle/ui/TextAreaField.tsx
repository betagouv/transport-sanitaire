// La saisie d'un texte sur plusieurs lignes : l'`Input` du DSFR, en zone de
// texte. « Entrée » y va à la ligne, sans valider la page.

import { Input } from "@codegouvfr/react-dsfr/Input";

type Props = {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoFocus?: boolean;
  /** Met le libellé en avant, quand le champ est la question de la page. */
  lead?: boolean;
};

export function TextAreaField(props: Props) {
  return (
    <Input
      textArea
      label={props.label}
      hintText={props.hint}
      state={props.error ? "error" : "default"}
      stateRelatedMessage={props.error}
      classes={{ label: props.lead ? "fr-text--lead" : undefined }}
      nativeTextAreaProps={{
        id: props.id,
        name: props.id,
        rows: 4,
        value: props.value,
        onChange: (e) => props.onChange(e.target.value),
        autoFocus: props.autoFocus,
      }}
    />
  );
}
