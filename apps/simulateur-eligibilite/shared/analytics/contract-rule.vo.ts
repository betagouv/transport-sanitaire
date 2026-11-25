// Les règles croisées du contrat v10.2.2 : les 26 conditions (`allOf`) du
// schéma de l'éditeur (`analytics/schema-evenement.json`), dans son ordre et
// sous son numéro. La collecte refuse un événement qui en enfreint une. Les
// règles 4 et 6 visent aussi `question_hidden` et `page_validated`, que l'app
// n'envoie pas : elles ne lisent ici que les types qu'elle connaît.

import type { AnalyticsEvent } from "./analytics-event.types.ts";

export class ContractRule {
  /** Le numéro de la condition dans le schéma, à partir de 1 : `3`, `19 à 21`. */
  readonly number: string;
  readonly #applies: Test;
  readonly #holds: Test;

  private constructor(number: string, applies: Test, holds: Test) {
    this.number = number;
    this.#applies = applies;
    this.#holds = holds;
  }

  /** La règle `number` : si l'événement est ainsi, alors il doit être ainsi. */
  static of(number: string, applies: Test, holds: Test): ContractRule {
    return new ContractRule(number, applies, holds);
  }

  /** L'événement est de ceux qu'elle vise, et ne la respecte pas. */
  brokenBy(event: AnalyticsEvent): boolean {
    return this.#applies(event) && !this.#holds(event);
  }
}

/** Ce qu'une règle demande d'un événement. */
type Test = (event: AnalyticsEvent) => boolean;

/** Les règles du schéma, dans son ordre. */
export const CONTRACT_RULES: readonly ContractRule[] = [
  ContractRule.of("1", ofType("intent_selected"), has("intent")),
  ContractRule.of(
    "2",
    ofType("phase_entered", "phase_completed"),
    has("screen"),
  ),
  ContractRule.of(
    "3",
    ofType("phase_boundary_displayed"),
    every(has("boundary", "page_id"), screenIn("P1", "P2", "P3")),
  ),
  ContractRule.of(
    "4",
    ofType("question_exposed", "question_interacted", "question_validated"),
    has("question_id", "page_id", "exposure_id"),
  ),
  ContractRule.of(
    "5",
    ofType("feedback_exposed", "feedback_clicked"),
    has("exposure_id", "screen", "revision"),
  ),
  ContractRule.of(
    "7",
    ofType("result_displayed"),
    has("revision", "can_complete"),
  ),
  ContractRule.of("8", ofType("result_invalidated"), has("revision")),
  ContractRule.of(
    "9",
    ofType("document_invalidated"),
    has("revision", "document_revision"),
  ),
  ContractRule.of(
    "10",
    ofType(
      "document_displayed",
      "document_print_requested",
      "document_download_requested",
      "document_download_succeeded",
    ),
    has("revision", "document_revision", "document_id"),
  ),
  ContractRule.of("11", ofType("simulation_closed"), has("closure_reason")),
  ContractRule.of(
    "12",
    ofType("button_exposed", "button_clicked"),
    every(
      has("button_id", "exposure_id", "revision", "artifact_id"),
      screenIn("R2", "R3"),
    ),
  ),
  ContractRule.of(
    "13",
    ofType("button_clicked"),
    (event) => event.activity_origin === "user",
  ),
  ContractRule.of("14", isButton("patient_sheet_print"), screenIn("R2")),
  ContractRule.of("15", isButton("patient_sheet_download"), screenIn("R2")),
  ContractRule.of(
    "16",
    isButton("document_print"),
    every(has("document_revision", "document_id"), screenIn("R3")),
  ),
  ContractRule.of(
    "17",
    isButton("document_download"),
    every(has("document_revision", "document_id"), screenIn("R3")),
  ),
  ContractRule.of(
    "18",
    ofType("document_typography_measured"),
    every(
      has(
        "revision",
        "document_revision",
        "document_id",
        "expected_field_ids",
        "field_measurements",
      ),
      supportOfADocument,
    ),
  ),
  ContractRule.of(
    "19 à 21",
    ofType("document_typography_measured"),
    namesOnlyItsSupportFields,
  ),
  ContractRule.of("22", has("service_id"), has("establishment_id")),
  ContractRule.of(
    "23",
    ofType("result_displayed"),
    has("issue", "support", "transport_composition"),
  ),
  ContractRule.of(
    "24",
    ofType("document_displayed"),
    every(has("transport_composition"), supportOfADocument),
  ),
  ContractRule.of("25", composedOf("mixed", "terrestrial_only"), has("mode")),
  ContractRule.of(
    "26",
    composedOf("regular_line_only", "not_applicable"),
    (event) => event.mode === undefined,
  ),
];

// ---- implémentation ----

const DOCUMENT_SUPPORTS: readonly string[] = ["S3138g", "S3139h", "S3141"];

function ofType(...types: AnalyticsEvent["type"][]): Test {
  return (event) => types.includes(event.type);
}

function has(...fields: (keyof AnalyticsEvent)[]): Test {
  return (event) => fields.every((field) => event[field] !== undefined);
}

function every(...tests: Test[]): Test {
  return (event) => tests.every((test) => test(event));
}

function screenIn(...screens: NonNullable<AnalyticsEvent["screen"]>[]): Test {
  return ({ screen }) => screen !== undefined && screens.includes(screen);
}

function isButton(button: NonNullable<AnalyticsEvent["button_id"]>): Test {
  return (event) => event.button_id === button;
}

function composedOf(
  ...compositions: NonNullable<AnalyticsEvent["transport_composition"]>[]
): Test {
  return ({ transport_composition: composition }) =>
    composition !== undefined && compositions.includes(composition);
}

function supportOfADocument({ support }: AnalyticsEvent): boolean {
  return support !== undefined && DOCUMENT_SUPPORTS.includes(support);
}

// Les champs attendus et mesurés sont tous du support de la mesure.
function namesOnlyItsSupportFields(event: AnalyticsEvent): boolean {
  const { support, expected_field_ids = [], field_measurements = [] } = event;
  const measured = field_measurements.map(({ field_id }) => field_id);
  return [...expected_field_ids, ...measured].every((id) =>
    id.startsWith(`${support}.`),
  );
}
