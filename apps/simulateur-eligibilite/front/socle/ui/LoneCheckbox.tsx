// Une case seule, sans titre au-dessus : son libellé est celui de la case.
//
// Elle se range comme une option d'un groupe, en carte bordée. Le conteneur
// reprend les classes du groupe du DSFR, sans en être un : une case seule n'a
// pas de légende, et son nom lui vient de son propre libellé.

import "./checkbox-card.css";

type Props = {
  id: string;
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Un message par ligne, sous la case. */
  errors?: readonly string[];
};

export function LoneCheckbox(props: Props) {
  const { id, errors = [] } = props;
  const inputId = `${id}-case`;
  const error = errors.length > 0;
  return (
    <div
      id={id}
      className={`fr-fieldset${error ? " fr-fieldset--error" : ""}`}
      style={{ marginBottom: "1.5rem" }}
    >
      <div className="fr-fieldset__content">
        <div className="fr-checkbox-group socle-checkbox-card">
          <input
            type="checkbox"
            id={inputId}
            name={inputId}
            checked={props.checked}
            aria-describedby={`${id}-messages`}
            onChange={(e) => props.onChange(e.target.checked)}
          />
          <label className="fr-label" htmlFor={inputId}>
            {props.label}
            {props.hint && <span className="fr-hint-text">{props.hint}</span>}
          </label>
        </div>
      </div>
      <Messages id={`${id}-messages`} errors={errors} />
    </div>
  );
}

// ---- implémentation ----

// Les erreurs sous la case, annoncées dès qu'elles changent.
function Messages({ id, errors }: { id: string; errors: readonly string[] }) {
  return (
    <div className="fr-messages-group" id={id} aria-live="assertive">
      {errors.map((text) => (
        <p key={text} className="fr-message fr-message--error">
          {text}
        </p>
      ))}
    </div>
  );
}
