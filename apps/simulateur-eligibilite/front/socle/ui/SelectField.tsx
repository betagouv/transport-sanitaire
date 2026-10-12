// Une liste déroulante : le `fr-select` du DSFR.

type Props = {
  id: string;
  label: string;
  hint?: string;
  /** Option affichée tant que rien n'est sélectionné. */
  placeholder: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoFocus?: boolean;
  /** Met le libellé en avant, quand le champ est la question de la page. */
  lead?: boolean;
};

export function SelectField(props: Props) {
  const messageId = `${props.id}-message`;
  return (
    <div
      className={`fr-select-group${props.error ? " fr-select-group--error" : ""}`}
    >
      <label
        className={`fr-label${props.lead ? " fr-text--lead" : ""}`}
        htmlFor={props.id}
      >
        {props.label}
        {props.hint && <span className="fr-hint-text">{props.hint}</span>}
      </label>
      <select
        className={`fr-select${props.error ? " fr-select--error" : ""}`}
        id={props.id}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        aria-describedby={props.error ? messageId : undefined}
        // biome-ignore lint/a11y/noAutofocus: le premier champ sans réponse prend le focus à l'ouverture de la page, comme les autres champs du questionnaire
        autoFocus={props.autoFocus}
      >
        <Options placeholder={props.placeholder} options={props.options} />
      </select>
      {props.error && (
        <p id={messageId} className="fr-error-text">
          {props.error}
        </p>
      )}
    </div>
  );
}

// ---- implémentation ----

// Les options de la liste. La première tient lieu d'invite : on ne peut pas la
// choisir, et elle disparaît de la liste ouverte.
function Options({
  placeholder,
  options,
}: Pick<Props, "placeholder" | "options">) {
  return (
    <>
      <option value="" disabled hidden>
        {placeholder}
      </option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </>
  );
}
