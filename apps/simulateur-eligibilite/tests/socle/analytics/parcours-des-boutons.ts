// Un parcours jusqu'aux écrans de résultat, pour lire ce que leurs boutons
// envoient au journal (ADR-0047) : le R2 et sa fiche, le R3 et son document, et
// ce que le tableau de bord de l'éditeur en compte.

import type { Button } from "../../../front/socle/analytics/button-place.vo";
import { Journey } from "../../../front/socle/analytics/journey.entity";
import type { AnalyticsEvent } from "../../../shared/analytics/analytics-event";
import { PROVENANCE } from "./journal-de-test";

// Le R2 affiché : ses codes, sans motif.
const unR2 = {
  canComplete: true,
  codes: {
    issue: "ISSUE_PMT",
    mode: null,
    transportComposition: "unknown",
    reasonCodes: [],
    support: "S3138g",
  },
} as const;

export const unDocument = (quantite: string) => ({
  file: "bon-de-commande-2026-11-13.pdf",
  dto: { fields: { quantite }, drawings: {} },
  typography: { sizes: { quantite: 9 }, unmeasured: [] },
});

export const BOUTONS_DE_LA_FICHE: Button[] = [
  "patient_sheet_print",
  "patient_sheet_download",
];
export const BOUTONS_DU_DOCUMENT: Button[] = [
  "document_print",
  "document_download",
  "feedback",
];

export const unParcours = () =>
  new Journey({ seeded: false, provenance: PROVENANCE });

// Un affichage du R2, le résultat montré, et ses boutons exposés.
export function afficherLeR2(journey: Journey, buttons = BOUTONS_DE_LA_FICHE) {
  journey.openAResultScreen("R2");
  journey.displayResult(unR2);
  return journey.exposeButtons(buttons);
}

// Le R2, puis le R3 et son document prêt : ses boutons exposés.
export function afficherLeR3(journey: Journey, quantite = "2") {
  afficherLeR2(journey);
  journey.openAResultScreen("R3");
  journey.displayDocument(unDocument(quantite));
  return journey.exposeButtons(BOUTONS_DU_DOCUMENT);
}

// La dernière page de P2 validée, ses réponses changées : le R2 tombe.
export function modifierP2(journey: Journey) {
  journey.openAPage({
    id: "P2/prestation",
    part: "P2",
    first: false,
    last: false,
    questions: ["Q2.1"],
  });
  journey.validate({
    questions: ["Q2.1"],
    nextPart: null,
    changed: true,
  });
}

// Les événements des boutons, en bref : le type, le bouton et l'objet.
export const enBref = (events: AnalyticsEvent[]) =>
  events.map(
    ({ type, button_id, artifact_id, revision }) =>
      `${type} ${button_id ?? "-"} ${artifact_id ?? revision}`,
  );

// Ce que comptent les indicateurs ID01 à ID04 et K04 à K07 du tableau de bord
// de l'éditeur (`buttonActions`) : chaque exposition, celles qu'un clic de même
// contexte rattache, et les simulations qui en ont. Un clic sans exposition de
// même contexte est orphelin. Rien d'autre ne compte comme un clic.
export function compter(events: AnalyticsEvent[]) {
  const contexte = (event: AnalyticsEvent) =>
    JSON.stringify([
      event.simulation_id,
      event.button_id,
      event.screen,
      event.revision,
      event.artifact_id,
      event.document_revision,
      event.document_id,
    ]);
  const exposees = new Map<string, AnalyticsEvent>();
  const cliquees = new Map<string, AnalyticsEvent>();
  let orphelins = 0;
  for (const event of events) {
    const cle = `${event.simulation_id}|${event.exposure_id}`;
    const exposee = exposees.get(cle);
    if (event.type === "button_exposed") exposees.set(cle, event);
    if (event.type !== "button_clicked") continue;
    if (exposee && contexte(exposee) === contexte(event))
      cliquees.set(cle, event);
    else orphelins += 1;
  }
  const simulations = (de: Map<string, AnalyticsEvent>) =>
    new Set([...de.values()].map(({ simulation_id }) => simulation_id)).size;
  return {
    expositions: exposees.size,
    cliquees: cliquees.size,
    simulationsExposees: simulations(exposees),
    simulationsCliquees: simulations(cliquees),
    orphelins,
  };
}
