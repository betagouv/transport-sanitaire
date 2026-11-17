// L'éditeur d'un texte strict qui ne tient pas sur le cerfa (D-302, D-304) :
// tout le texte, au-dessus de l'aperçu, avec son compteur « caractères saisis
// / maximum ». Trop long, ou vide quand il est requis, le compteur passe en
// rouge, l'erreur s'affiche et « Valider » attend. Rien ne tronque la saisie,
// pas même un collage (spec médicale § 8). Un texte sur une ligne se saisit
// aussi dans une zone de texte, comme chez l'éditeur : son retour à la ligne
// s'y voit, et s'y corrige.
//
// Chaque frappe remonte le brouillon : qui affiche l'éditeur le garde. La
// mesure est celle du PDF ; tant qu'elle se charge, le maximum est celui de la
// génération. Le passage de « déborde » à « tient », et retour, s'annonce une
// fois, pas à chaque frappe. Rien de la saisie ne part au journal.

import { useId } from "react";
import type { Strict } from "./cerfa";
import type { StrictMeasure } from "./generate-the-cerfa/strict-text";
import { verdictOf } from "./strict-verdict";

type Props = {
  readonly strict: Strict;
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
        disabled={!verdictOf(cell.strict, cell.text, cell.measured).valid}
        onClick={onValidate}
      >
        Valider
      </button>
    </div>
  );
}

// ---- implémentation ----

// Le champ, son libellé, et ce qu'en dit la mesure, qui le décrit.
function Cell({ strict, text, measured, onEdit }: Omit<Props, "onValidate">) {
  const id = useId();
  const [counter, error] = [`${id}-compteur`, `${id}-erreur`];
  const { valid } = verdictOf(strict, text, measured);
  return (
    <div className={`fr-input-group${valid ? "" : " fr-input-group--error"}`}>
      <label className="fr-label" htmlFor={id}>
        {strict.label}
      </label>
      <textarea
        id={id}
        className={`fr-input${valid ? "" : " fr-input--error"}`}
        rows={strict.oneLine ? 2 : 4}
        value={text}
        aria-invalid={!valid}
        aria-describedby={valid ? counter : `${error} ${counter}`}
        onChange={(event) => onEdit(event.target.value)}
      />
      <MeasureOf {...{ strict, text, measured }} ids={{ counter, error }} />
    </div>
  );
}

// Ce que dit la mesure sous le champ : le compteur, rouge quand le texte ne
// se valide pas, l'erreur, et l'annonce du passage d'un état à l'autre.
function MeasureOf({
  strict,
  text,
  measured,
  ids: { counter, error },
}: Pick<Props, "strict" | "text" | "measured"> & {
  ids: { counter: string; error: string };
}) {
  const { valid, message } = verdictOf(strict, text, measured);
  return (
    <>
      <p
        id={counter}
        className={`fr-message ${valid ? "fr-message--info" : "fr-message--error"}`}
      >
        {Array.from(text).length} / {measured.maximum} caractères
      </p>
      {message && (
        <p id={error} className="fr-error-text">
          {message}
        </p>
      )}
      <p className="fr-sr-only" role="status">
        {message ?? "Le texte tient sur le document."}
      </p>
    </>
  );
}
