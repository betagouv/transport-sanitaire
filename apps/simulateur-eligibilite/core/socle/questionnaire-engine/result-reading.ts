// La lecture d'un résultat, R2 ou R3 : les réponses validées, les faits et les
// cibles de la préconisation, et le jour du résultat. Une condition s'y lit
// comme dans un fait (`given.ts`).

import { validatedReading } from "./answer-readings.ts";
import type { Reading } from "./condition.ts";
import { LocalDateTime } from "./local-date-time.ts";
import type { ValidatedAnswers } from "./validated-answers.ts";

/** Ce qu'un résultat sait : ses réponses, sa préconisation, son jour. */
export type ResultSources = {
  readonly validated: ValidatedAnswers;
  readonly faits: unknown;
  readonly cibles: unknown;
  /** L'instant du résultat : sa date de complétion, ou maintenant. */
  readonly on: Date;
};

/**
 * La lecture de ce résultat. Il lit ses cibles telles qu'elles sont : rien ne
 * s'y suppose.
 */
export function resultReading({
  validated,
  faits,
  cibles,
  on,
}: ResultSources): Reading {
  return {
    answer: validatedReading(validated),
    fait: (nom) => named(faits, nom),
    cible: (nom) => named(cibles, nom),
    cibleAssuming: (nom) => {
      throw new Error(
        `Un résultat ne suppose rien : il lit ${nom} telle quelle.`,
      );
    },
    today: () => LocalDateTime.dayInParis(on),
  };
}

// ---- implémentation ----

function named(values: unknown, nom: string): unknown {
  return (values as Readonly<Record<string, unknown>>)[nom];
}
