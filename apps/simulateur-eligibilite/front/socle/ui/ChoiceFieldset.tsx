// Un groupe de cases ou de boutons radio, au balisage du DSFR. Chaque option
// est une carte bordée : la variante « riche » du DSFR pour un bouton radio,
// la même carte, écrite ici, pour une case à cocher.
//
// Il est écrit ici, et non avec le composant du DSFR : celui-ci range tout le
// contenu d'une option dans son libellé. Or l'aide d'une option se rend juste
// sous elle, et un bouton n'a pas sa place dans un libellé.

import type { ComponentProps, ReactNode } from "react";
import { type Help, OptionHelp } from "./OptionHelp";
import "./checkbox-card.css";

export type Choice = {
  value: string;
  label: string;
  /** Ce que l'option veut dire, rendu sous son libellé. */
  description?: string;
  /** Une aide dépliable, rendue sous l'option. */
  help?: Help;
  /**
   * Ce qui s'affiche juste sous l'option, après son aide : une question qu'elle
   * fait apparaître. Hors du libellé, elle garde son propre groupe.
   */
  below?: ReactNode;
  /** Ce que la case ou le bouton reçoit : son état, et ce qu'un clic fait. */
  input: ComponentProps<"input">;
};

/**
 * Ce qui s'affiche sous le groupe : des erreurs, ou une simple explication.
 * Une ligne par texte.
 */
export type Message = {
  state: "error" | "info";
  texts: readonly string[];
};

type Props = {
  id: string;
  type: "radio" | "checkbox";
  legend: string;
  hint?: string;
  choices: readonly Choice[];
  message?: Message;
  /** Met la légende en avant, quand le champ est la question de la page. */
  lead?: boolean;
  /** Les libellés des options en gras ; leur description reste grise, dessous. */
  boldLabels?: boolean;
};

export function ChoiceFieldset(props: Props) {
  const { id, message } = props;
  const error = message?.state === "error";
  return (
    <fieldset
      id={id}
      className={`fr-fieldset${error ? " fr-fieldset--error" : ""}`}
      aria-labelledby={`${id}-legend ${id}-messages`}
      style={{ marginBottom: "1.5rem" }}
    >
      <Legend {...props} />
      <div className="fr-fieldset__content">
        {props.choices.map((choice) => (
          <ChoiceInput key={choice.value} {...props} choice={choice} />
        ))}
      </div>
      <div
        className="fr-messages-group"
        id={`${id}-messages`}
        aria-live={error ? "assertive" : "polite"}
      >
        {message?.texts.map((text) => (
          <p key={text} className={`fr-message fr-message--${message.state}`}>
            {text}
          </p>
        ))}
      </div>
    </fieldset>
  );
}

// ---- implémentation ----

function Legend({ id, legend, hint, lead }: Props) {
  return (
    <legend
      id={`${id}-legend`}
      className={`fr-fieldset__legend fr-text--regular${lead ? " fr-text--lead" : ""}`}
    >
      {legend}
      {hint && <span className="fr-hint-text">{hint}</span>}
    </legend>
  );
}

// Une option, son aide, puis ce qui s'affiche dessous. L'aide est sœur de l'option, pas son enfant : le
// DSFR espace les options d'après leur rang dans le groupe.
function ChoiceInput({
  id,
  type,
  choice,
  boldLabels,
}: Props & { choice: Choice }) {
  const inputId = `${id}-${choice.value}`;
  return (
    <>
      <div className={`fr-${type}-group ${CARD[type]}`}>
        <input type={type} id={inputId} {...choice.input} />
        <label className="fr-label" htmlFor={inputId}>
          {boldLabels ? (
            <span className="fr-text--bold">{choice.label}</span>
          ) : (
            choice.label
          )}
          {choice.description && (
            <span className="fr-hint-text">{choice.description}</span>
          )}
        </label>
      </div>
      {choice.help && <OptionHelp help={choice.help} />}
      {choice.below}
    </>
  );
}

const CARD = { radio: "fr-radio-rich", checkbox: "socle-checkbox-card" };
