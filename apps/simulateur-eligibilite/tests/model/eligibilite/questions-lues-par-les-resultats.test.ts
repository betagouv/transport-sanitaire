// Les questions que R2 et R3 lisent telles quelles, hors des faits et des
// cibles (#254). Une telle question se pose toujours : sa réponse s'affiche,
// même quand aucun fait ne la lit. Rien ne se déclare : R2 ne lit que
// `LU_PAR_R2`, et R3 que les entrées de ses cerfas.

import { describe, expect, it } from "vitest";
import {
  NOTHING,
  type Reads,
  readsOf,
} from "../../../core/socle/questionnaire-engine/condition";
import { model } from "../../../front/models/eligibilite";
import { S3138G } from "../../../front/models/eligibilite/r3/s3138g/s3138g";
import { S3139H } from "../../../front/models/eligibilite/r3/s3139h/s3139h";
import { S3141 } from "../../../front/models/eligibilite/r3/s3141/s3141";
import type { BoundCerfa } from "../../../front/socle/cerfa-mapping";

describe("les questions que les résultats lisent telles quelles", () => {
  // Le circuit (Q2.2.1.indication), les critères de Q1.2, la répétition de
  // Q2.8.5, et ce dont la trace tire ses précisions.
  it("R2 lit le circuit, les critères, la répétition et les précisions", () => {
    expect(trie(model.result.reading.reads)).toEqual([
      "Q1.2",
      "Q1.3",
      "Q1.3.a",
      "Q2.1",
      "Q2.1.f",
      "Q2.1.g",
      "Q2.10",
      "Q2.10.b",
      "Q2.2.1",
      "Q2.2.1.b",
      "Q2.2.1.indication",
      "Q2.3.3",
      "Q2.5",
      "Q2.6.a",
      "Q2.7",
      "Q2.8.5",
    ]);
  });

  it("R3 lit son texte et les entrées de ses trois cerfas", () => {
    const lu = [S3138G, S3139H, S3141]
      .map(entrees)
      .reduce(readsOf, model.cerfa.reading.reads);
    expect(trie(lu)).toEqual([
      "Q1.1",
      "Q1.2",
      "Q1.3",
      "Q2.1",
      "Q2.1.g",
      "Q2.13.depart",
      "Q2.14.motif",
      "Q2.2.1",
      "Q2.2.1.a",
      "Q2.2.1.b",
      "Q2.5",
      "Q2.6",
      "Q2.8.1",
      "Q2.8.5",
      "Q2.8.6",
      "Q3.1.1",
      "Q3.1.2",
      "Q3.1.3",
      "Q3.2.adresse",
      "Q3.2.nature",
      "Q3.2.nom",
      "Q3.2.precision",
      "Q3.3.adresse",
      "Q3.3.nature",
      "Q3.3.nom",
      "Q3.3.precision",
      "Q3.4",
      "Q3.4.distance",
      "Q3.5",
      "Q3.6.1",
      "Q3.6.2",
      "Q3.6.3",
      "Q3.7",
    ]);
  });
});

// ---- implémentation ----

function entrees({ mapping }: BoundCerfa): Reads {
  return [...Object.values(mapping.fields), ...Object.values(mapping.drawings)]
    .map((value) => value.reads)
    .reduce(readsOf, NOTHING);
}

function trie(lu: Reads): string[] {
  return [...lu.questions].sort();
}
