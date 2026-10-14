// La saisie d'une date, avec ou sans heure : l'`Input` du DSFR. Le navigateur
// garantit le format ISO.

import { Input } from "@codegouvfr/react-dsfr/Input";
import { ErrorLines } from "./ErrorLines";

type Props = {
  id: string;
  label: string;
  hint?: string;
  /** Saisit aussi l'heure, locale. */
  withTime?: boolean;
  /** Au format ISO, ou vide. */
  value: string;
  /** Les bornes, au même format : le calendrier grise ce qui en sort. */
  min?: string;
  max?: string;
  onChange: (value: string) => void;
  /** Un message par ligne, sous le champ. */
  errors?: readonly string[];
  autoFocus?: boolean;
  /** Met le libellé en avant, quand le champ est la question de la page. */
  lead?: boolean;
};

export function DateField(props: Props) {
  return (
    <Input
      label={props.label}
      hintText={props.hint}
      state={props.errors?.length ? "error" : "default"}
      stateRelatedMessage={
        props.errors?.length ? <ErrorLines errors={props.errors} /> : undefined
      }
      classes={{ label: props.lead ? "fr-text--lead" : undefined }}
      style={{ maxWidth: "16rem" }}
      nativeInputProps={{
        id: props.id,
        name: props.id,
        // `datetime-local` et non `datetime` : les navigateurs ne rendent que le
        // premier, et il donne une heure locale.
        type: props.withTime ? "datetime-local" : "date",
        value: props.value,
        min: props.min,
        max: props.max,
        onChange: (e) => props.onChange(e.target.value),
        autoFocus: props.autoFocus,
      }}
    />
  );
}
