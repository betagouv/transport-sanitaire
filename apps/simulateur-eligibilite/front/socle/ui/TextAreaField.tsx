// La saisie d'un texte sur plusieurs lignes : l'`Input` du DSFR, en zone de
// texte. « Entrée » y va à la ligne, sans valider la page. Un compteur se lit
// sous le champ, en information, ou en rouge sous ses erreurs.

import { Input } from "@codegouvfr/react-dsfr/Input";
import { ErrorLines } from "./ErrorLines";

type Props = {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  /** Un message par ligne, sous le champ. */
  errors?: readonly string[];
  /** Le compteur, sous le champ et après ses erreurs : « 12 / 54 caractères ». */
  counter?: string;
  /** Met le libellé en avant, quand le champ est la question de la page. */
  lead?: boolean;
};

export function TextAreaField(props: Props) {
  const errors = props.errors ?? [];
  const lines = props.counter ? [...errors, props.counter] : errors;
  return (
    <Input
      textArea
      label={props.label}
      hintText={props.hint}
      state={errors.length ? "error" : lines.length ? "info" : "default"}
      stateRelatedMessage={
        lines.length ? <ErrorLines errors={lines} /> : undefined
      }
      classes={{ label: props.lead ? "fr-text--lead" : undefined }}
      nativeTextAreaProps={{
        id: props.id,
        name: props.id,
        rows: 4,
        value: props.value,
        onChange: (e) => props.onChange(e.target.value),
      }}
    />
  );
}
