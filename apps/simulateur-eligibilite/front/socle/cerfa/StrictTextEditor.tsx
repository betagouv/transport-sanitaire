// L'éditeur d'un texte strict qui ne tient pas sur le cerfa (D-302, D-304) :
// toute la cellule, au-dessus de l'aperçu, avec son compteur « caractères
// saisis / maximum ». Trop long, le compteur passe en rouge, l'erreur
// s'affiche et « Valider » attend. Rien ne tronque la saisie, pas même un
// collage (spec médicale § 8).
//
// Chaque frappe remonte le brouillon : qui affiche l'éditeur le garde. La
// mesure est celle du PDF ; tant qu'elle se charge, le maximum est celui de la
// génération. Le passage de « déborde » à « tient », et retour, s'annonce une
// fois, pas à chaque frappe. Rien de la saisie ne part au journal.

import { useId } from "react";
import type { StrictMeasure } from "./generate-the-cerfa/strict-text";

type Props = {
  readonly label: string;
  readonly text: string;
  /** La mesure du texte saisi. */
  readonly measured: StrictMeasure;
  readonly onEdit: (text: string) => void;
  readonly onValidate: () => void;
};

export function StrictTextEditor({ onValidate, ...cell }: Props) {
  return (
    <div className="fr-mb-3w">
      <Cell {...cell} />
      <button
        type="button"
        className="fr-btn"
        disabled={!cell.measured.fits}
        onClick={onValidate}
      >
        Valider
      </button>
    </div>
  );
}

/** Le message d'un texte strict qui déborde (spec médicale § 8). */
export function overflowMessage(label: string): string {
  return `Raccourcissez le texte présent dans '${label}' pour pouvoir imprimer ou télécharger le document.`;
}

// ---- implémentation ----

// Le champ, son libellé, et ce qu'en dit la mesure, qui le décrit.
function Cell({ label, text, measured, onEdit }: Omit<Props, "onValidate">) {
  const id = useId();
  const [counter, error] = [`${id}-compteur`, `${id}-erreur`];
  const { fits } = measured;
  return (
    <div className={`fr-input-group${fits ? "" : " fr-input-group--error"}`}>
      <label className="fr-label" htmlFor={id}>
        {label}
      </label>
      <textarea
        id={id}
        className={`fr-input${fits ? "" : " fr-input--error"}`}
        rows={4}
        value={text}
        aria-invalid={!fits}
        aria-describedby={fits ? counter : `${error} ${counter}`}
        onChange={(event) => onEdit(event.target.value)}
      />
      <MeasureOf {...{ label, text, measured }} ids={{ counter, error }} />
    </div>
  );
}

// Ce que dit la mesure sous le champ : le compteur, rouge quand le texte
// déborde, l'erreur, et l'annonce du passage d'un état à l'autre.
function MeasureOf({
  label,
  text,
  measured: { fits, maximum },
  ids: { counter, error },
}: Pick<Props, "label" | "text" | "measured"> & {
  ids: { counter: string; error: string };
}) {
  return (
    <>
      <p
        id={counter}
        className={`fr-message ${fits ? "fr-message--info" : "fr-message--error"}`}
      >
        {Array.from(text).length} / {maximum} caractères
      </p>
      <p id={error} className="fr-error-text" hidden={fits}>
        {overflowMessage(label)}
      </p>
      <p className="fr-sr-only" role="status">
        {fits ? "Le texte tient sur le document." : overflowMessage(label)}
      </p>
    </>
  );
}
