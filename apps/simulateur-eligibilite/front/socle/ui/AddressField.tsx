// La saisie d'une adresse : un groupe de champs du DSFR, un `Input` par champ.
// Chaque champ porte son libellé, et son message quand il est fautif. Le groupe
// porte les siens, quand l'adresse entière est en cause.

import { Input } from "@codegouvfr/react-dsfr/Input";

type Field<Name extends string> = {
  name: Name;
  label: string;
  hint?: string;
  /** Un champ court, pour une saisie de quelques caractères. */
  short?: boolean;
  /** Le champ se range sur la ligne de celui qui le précède. */
  sameLine?: boolean;
  value: string;
  /** Affichée sous ce champ, sans toucher aux autres. */
  error?: string;
};

type Props<Name extends string> = {
  id: string;
  /** Ce qui coiffe le groupe : la question. */
  label: string;
  hint?: string;
  /**
   * Ce qui ne va pas dans l'adresse entière, un message par ligne sous le
   * groupe, dont tous les champs rougissent.
   */
  errors?: readonly string[];
  /** Les champs, dans l'ordre où ils se saisissent. */
  fields: readonly Field<Name>[];
  onChange: (name: Name, value: string) => void;
  /** Le premier champ prend le focus à l'ouverture de la page. */
  autoFocus?: boolean;
  /** Met le libellé en avant, quand le groupe est la question de la page. */
  lead?: boolean;
};

export function AddressField<Name extends string>(props: Props<Name>) {
  const { id, fields } = props;
  const failing = props.errors !== undefined && props.errors.length > 0;
  // `fr-fieldset--error` rougit tous les champs : il ne sert qu'à un message de
  // groupe. Une erreur de champ n'a que son champ, et passe devant : tant qu'il
  // y en a, l'appelant ne donne pas de message de groupe.
  return (
    <fieldset
      id={id}
      className={`fr-fieldset${failing ? " fr-fieldset--error" : ""}`}
      aria-labelledby={`${id}-legend`}
      aria-describedby={failing ? `${id}-messages` : undefined}
    >
      <Legend {...props} />
      {fields.map((field, rank) => (
        <div key={field.name} className={elementClass(field)}>
          <FieldInput
            {...props}
            field={field}
            autoFocus={props.autoFocus && rank === 0}
          />
        </div>
      ))}
      {failing && <GroupMessages id={id} errors={props.errors ?? []} />}
    </fieldset>
  );
}

// ---- implémentation ----

function Legend({
  id,
  label,
  hint,
  lead,
}: Pick<Props<string>, "id" | "label" | "hint" | "lead">) {
  return (
    <legend
      id={`${id}-legend`}
      className={`fr-fieldset__legend fr-text--regular${lead ? " fr-text--lead" : ""}`}
    >
      {label}
      {hint && <span className="fr-hint-text">{hint}</span>}
    </legend>
  );
}

function GroupMessages({
  id,
  errors,
}: {
  id: string;
  errors: readonly string[];
}) {
  return (
    <div
      className="fr-messages-group fr-fieldset__element"
      id={`${id}-messages`}
      aria-live="assertive"
    >
      {errors.map((error) => (
        <p key={error} className="fr-message fr-message--error">
          {error}
        </p>
      ))}
    </div>
  );
}

// Les classes du DSFR pour une adresse : le champ court garde sa largeur, et
// celui qui le suit sur sa ligne prend le reste. Sur un écran étroit, il
// repasse dessous.
function elementClass(field: { short?: boolean; sameLine?: boolean }): string {
  if (field.sameLine)
    return "fr-fieldset__element fr-fieldset__element--inline@md fr-fieldset__element--inline-grow";
  if (field.short)
    return "fr-fieldset__element fr-fieldset__element--inline fr-fieldset__element--postal";
  return "fr-fieldset__element";
}

function FieldInput<Name extends string>({
  id,
  field,
  onChange,
  autoFocus,
}: Props<Name> & { field: Field<Name> }) {
  return (
    <Input
      label={field.label}
      hintText={field.hint}
      state={field.error ? "error" : "default"}
      stateRelatedMessage={field.error}
      nativeInputProps={{
        id: `${id}-${field.name}`,
        name: `${id}-${field.name}`,
        type: "text",
        value: field.value,
        onChange: (e) => onChange(field.name, e.target.value),
        autoFocus,
      }}
    />
  );
}
