// Ce que les boutons des écrans de résultat envoient au journal, lu depuis le
// simulateur ouvert : leurs expositions, leurs clics, et l'impression ou le
// téléchargement du document lancés.
//
// Le dialogue d'impression, que le navigateur de test n'a pas, et l'onglet que
// l'avis ouvrirait ne s'ouvrent pas ici : `sansDialogue` les retient.

import { Reading } from "../../../core/socle";
import type { Intent, Model } from "../../../front/socle/model";
import type { AnalyticsEvent } from "../../../shared/analytics/analytics-event.types";
import { journalDeTest } from "../analytics/journal-de-test";
import { modeleDeTest } from "../modele-de-test";
import { ouvrirLeSimulateur } from "./questionnaire";

export const LIBELLE_DE_L_AVIS = "Donnez votre avis";

/** Le modèle, venu pour cette intention, qui invite à donner son avis. */
export const venuPour = (intent: Intent, modele = modeleDeTest): Model => ({
  ...modele,
  intent: Reading.constant(intent),
  feedback: { url: "https://exemple.test/avis", label: LIBELLE_DE_L_AVIS },
});

export async function ouvrirAvecUnJournal(
  options: Parameters<typeof ouvrirLeSimulateur>[0] = {},
) {
  const { analytics, envoyes } = journalDeTest();
  const user = await ouvrirLeSimulateur({ analytics, ...options });
  return { user, envoyes };
}

/**
 * Les événements des boutons, en bref : le type, le bouton, l'objet (la fiche,
 * le document, ou la révision de l'avis en R2) et l'écran.
 */
export const boutons = (envoyes: AnalyticsEvent[]) =>
  envoyes
    .filter(({ type }) => DES_BOUTONS.includes(type))
    .map(
      ({ type, button_id, artifact_id, document_id, revision, screen }) =>
        `${type} ${button_id ?? "-"} ${artifact_id ?? document_id ?? revision} ${screen}`,
    );

/** Les événements d'un type, sans ce qui date ou numérote leur envoi. */
export const sansRang = (envoyes: AnalyticsEvent[], type: string) =>
  envoyes
    .filter((event) => event.type === type)
    .map(({ event_id: _id, sequence: _rang, occurred_at: _date, ...e }) => e);

/** Retient le dialogue d'impression et l'onglet de l'avis, jusqu'à `arreter()`. */
export function sansDialogue() {
  window.print = () => {};
  document.addEventListener("click", sansOnglet);
  return {
    arreter() {
      Reflect.deleteProperty(window, "print");
      document.removeEventListener("click", sansOnglet);
    },
  };
}

// ---- implémentation ----

const DES_BOUTONS: readonly string[] = [
  "button_exposed",
  "button_clicked",
  "feedback_exposed",
  "feedback_clicked",
  "document_print_requested",
  "document_download_requested",
  "document_download_succeeded",
];

function sansOnglet(event: Event) {
  if (event.target instanceof HTMLAnchorElement && event.target.target)
    event.preventDefault();
}
