// @vitest-environment node
//
// Les règles croisées du contrat v10.2.2 : les 26 conditions (`allOf`) du
// schéma de l'éditeur, numérotées comme lui. Chacune se lit sur un événement
// qui la respecte, et sur le même qui l'enfreint. Les règles 4 et 6 visent
// `question_hidden` et `page_validated`, que l'app n'envoie pas : elles se
// lisent sur les questions qu'elle envoie. Un envoi refusé laisse sa raison
// dans les traces du serveur, sans rien de son contenu.

import { describe, expect, it } from "vitest";
import {
  explainARefusal,
  parseAnAnalyticsEvent,
} from "../../../shared/analytics/event-schema.ts";
import { simulationStarted } from "./evenements.ts";

type Event = Record<string, unknown>;

const un = (champs: Event): Event => ({
  ...simulationStarted,
  event_id: "s-1:2",
  sequence: 2,
  screen: undefined,
  ...champs,
});

const sans = (evenement: Event, ...champs: string[]): Event =>
  Object.fromEntries(
    Object.entries(evenement).filter(([cle]) => !champs.includes(cle)),
  );

const R2 = {
  type: "result_displayed",
  screen: "R2",
  revision: "r1",
  can_complete: true,
  issue: "ISSUE_PMT",
  support: "S3138g",
  transport_composition: "terrestrial_only",
  mode: "TAP",
} as const;
const DOCUMENT = {
  type: "document_displayed",
  screen: "R3",
  revision: "r1",
  document_revision: "dr1",
  document_id: "d1",
  support: "S3138g",
  transport_composition: "regular_line_only",
} as const;
const BOUTON = {
  type: "button_exposed",
  activity_origin: "background",
  button_id: "document_print",
  exposure_id: "s-1:b1",
  screen: "R3",
  revision: "r1",
  artifact_id: "d1",
  document_revision: "dr1",
  document_id: "d1",
} as const;
const FICHE = {
  ...BOUTON,
  button_id: "patient_sheet_print",
  screen: "R2",
  artifact_id: "f1",
  document_revision: undefined,
  document_id: undefined,
} as const;
const MESURE = {
  type: "document_typography_measured",
  activity_origin: "background",
  screen: "R3",
  revision: "r1",
  document_revision: "dr1",
  document_id: "d1",
  support: "S3138g",
  expected_field_ids: ["S3138g.nombre"],
  field_measurements: [{ field_id: "S3138g.nombre", font_size_pt: 9 }],
} as const;
const QUESTION = {
  type: "question_validated",
  screen: "P1",
  question_id: "Q1.1",
  page_id: "P1/intention",
  exposure_id: "s-1:q1",
} as const;

const CAS: [string, Event, Event][] = [
  [
    "1, une intention choisie la dit",
    un({ type: "intent_selected", intent: "eligibilite_seule" }),
    un({ type: "intent_selected" }),
  ],
  [
    "2, une phase entrée dit son écran",
    un({ type: "phase_entered", screen: "P1" }),
    un({ type: "phase_entered" }),
  ],
  [
    "3, une limite de phase dit sa phase, sa limite et sa page",
    un({
      type: "phase_boundary_displayed",
      screen: "P2",
      boundary: "last",
      page_id: "P2/prestation",
    }),
    un({
      type: "phase_boundary_displayed",
      screen: "R2",
      boundary: "last",
      page_id: "P2/prestation",
    }),
  ],
  [
    "4, une question validée dit sa page et son exposition",
    un(QUESTION),
    un(sans(QUESTION, "exposure_id")),
  ],
  [
    "5, l'avis exposé dit son exposition, son écran et sa révision",
    un({
      type: "feedback_exposed",
      activity_origin: "background",
      exposure_id: "s-1:b2",
      screen: "R2",
      revision: "r1",
    }),
    un({
      type: "feedback_exposed",
      activity_origin: "background",
      exposure_id: "s-1:b2",
      screen: "R2",
    }),
  ],
  ["7, un R2 dit sa complétion", un(R2), un(sans(R2, "can_complete"))],
  [
    "8, un R2 tombé dit sa révision",
    un({ type: "result_invalidated", screen: "P1", revision: "r1" }),
    un({ type: "result_invalidated", screen: "P1" }),
  ],
  [
    "9, un document invalidé dit la révision attendue",
    un({
      type: "document_invalidated",
      screen: "P3",
      revision: "r1",
      document_revision: "dr2",
    }),
    un({ type: "document_invalidated", screen: "P3", revision: "r1" }),
  ],
  [
    "10, un document affiché dit sa révision du document",
    un(DOCUMENT),
    un(sans(DOCUMENT, "document_revision")),
  ],
  [
    "11, une simulation fermée dit pourquoi",
    un({ type: "simulation_closed", closure_reason: "new_simulation" }),
    un({ type: "simulation_closed" }),
  ],
  [
    "12, un bouton exposé est sur un écran de résultat",
    un(BOUTON),
    un({ ...BOUTON, screen: "P3" }),
  ],
  [
    "13, un clic vient du prescripteur",
    un({ ...BOUTON, type: "button_clicked", activity_origin: "user" }),
    un({ ...BOUTON, type: "button_clicked", activity_origin: "background" }),
  ],
  ["14, la fiche s'imprime sur R2", un(FICHE), un({ ...FICHE, screen: "R3" })],
  [
    "15, la fiche se télécharge sur R2",
    un({ ...FICHE, button_id: "patient_sheet_download" }),
    un({ ...FICHE, button_id: "patient_sheet_download", screen: "R3" }),
  ],
  [
    "16, le document s'imprime avec sa révision du document",
    un(BOUTON),
    un(sans(BOUTON, "document_revision")),
  ],
  [
    "17, le document se télécharge sur R3",
    un({ ...BOUTON, button_id: "document_download" }),
    un({ ...BOUTON, button_id: "document_download", screen: "R2" }),
  ],
  [
    "18, une mesure dit le support d'un cerfa",
    un(MESURE),
    un({ ...MESURE, support: "AUCUN" }),
  ],
  [
    "19 à 21, une mesure ne nomme que les champs de son support",
    un(MESURE),
    un({ ...MESURE, expected_field_ids: ["S3139h.nombre"] }),
  ],
  [
    "22, un service dit son établissement",
    un({ type: "intent_selected", intent: "eligibilite_seule" }),
    sans(
      un({ type: "intent_selected", intent: "eligibilite_seule" }),
      "establishment_id",
    ),
  ],
  [
    "23, un R2 dit son issue, son support et sa composition",
    un(R2),
    un(sans(R2, "issue")),
  ],
  [
    "24, un document affiché a le support d'un cerfa",
    un(DOCUMENT),
    un({ ...DOCUMENT, support: "AUCUN" }),
  ],
  ["25, un transport terrestre dit son mode", un(R2), un(sans(R2, "mode"))],
  [
    "26, une ligne régulière seule n'a pas de mode",
    un(DOCUMENT),
    un({ ...DOCUMENT, mode: "TAP" }),
  ],
];

describe("les règles croisées du contrat v10.2.2", () => {
  it.each(CAS)("règle %s", (_regle, respecte, enfreint) => {
    expect(parseAnAnalyticsEvent(respecte)).toEqual(respecte);
    expect(parseAnAnalyticsEvent(enfreint)).toBeUndefined();
  });
});

describe("la raison d'un refus, dans les traces du serveur", () => {
  it.each([
    [
      "un onglet d'avant dit sa version, rien d'autre",
      { ...simulationStarted, version: "10.2.1", commit_sha: "f30aafe" },
      "onglet d'un autre contrat (10.2.1)",
    ],
    [
      "une version mal formée ne sort pas",
      { ...simulationStarted, version: "Q2.1 : domicile" },
      "onglet d'un autre contrat (inconnu)",
    ],
    [
      "un champ inconnu se nomme, sans sa valeur",
      { ...simulationStarted, portions: ["LIGNE_REGULIERE"] },
      "hors contrat (portions)",
    ],
    [
      "une clé qui n'a pas la forme d'un champ ne sort pas",
      { ...simulationStarted, "Domicile du patient": "Lyon" },
      "hors contrat (champ inconnu)",
    ],
    [
      "une règle croisée se nomme par son numéro",
      { ...simulationStarted, type: "simulation_closed" },
      "hors contrat (règle 11)",
    ],
  ])("%s", (_cas, recu, raison) => {
    expect(explainARefusal(recu)).toBe(raison);
  });
});
