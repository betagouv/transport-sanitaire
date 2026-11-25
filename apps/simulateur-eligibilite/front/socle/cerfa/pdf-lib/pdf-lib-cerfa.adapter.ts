// Le PDF du cerfa par `pdf-lib`. Ce fichier est le point d'entrée du module :
// il répond au port (`../cerfa-pdf.port.ts`) et charge ses pièces à la demande.
// Rien hors du module n'importe `pdf-lib` ni une pièce, et le chunk d'entrée
// n'en porte rien : `tooling/verifier-bundle.ts` le vérifie.

import type { StrictEntry } from "../cerfa.types";
import type { CerfaPdf } from "../cerfa-pdf.port";
import type {
  Drawn,
  FieldEntry,
  Filled,
  FillOptions,
  Flattened,
  MeasureStrictText,
  PdfBytes,
  StrictLineMeasure,
} from "../cerfa-pdf.types";

export class PdfLibCerfaAdapter implements CerfaPdf {
  #pieces: Promise<Pieces> | undefined;

  async fill(
    template: PdfBytes,
    entries: readonly FieldEntry[],
    options?: FillOptions,
  ): Promise<Filled> {
    const { FillTheFormService } = await this.#loaded();
    return FillTheFormService.fill(template, entries, options);
  }

  async flatten(pdf: Uint8Array, drawn?: Drawn): Promise<Flattened> {
    const { FlattenTheFormService } = await this.#loaded();
    return FlattenTheFormService.flatten(pdf, drawn);
  }

  async lineMeasurers(
    entries: readonly StrictEntry[],
  ): Promise<ReadonlyMap<string, StrictLineMeasure>> {
    const { MeasureStrictTextsService } = await this.#loaded();
    return MeasureStrictTextsService.lineMeasurersOf(entries);
  }

  async measureStrictTexts(
    template: PdfBytes,
    entries: readonly StrictEntry[],
  ): Promise<MeasureStrictText> {
    const { MeasureStrictTextsService } = await this.#loaded();
    return MeasureStrictTextsService.of(template, entries);
  }

  // Les pièces se chargent ensemble, une fois, au premier appel.
  #loaded(): Promise<Pieces> {
    this.#pieces ??= loadPieces();
    return this.#pieces;
  }
}

// ---- implémentation ----

type Pieces = Awaited<ReturnType<typeof loadPieces>>;

async function loadPieces() {
  const [{ FillTheFormService }, { FlattenTheFormService }, measure] =
    await Promise.all([
      import("./fill-the-form.service"),
      import("./flatten-the-form.service"),
      import("./measure-strict-texts.service"),
    ]);
  return {
    FillTheFormService,
    FlattenTheFormService,
    MeasureStrictTextsService: measure.MeasureStrictTextsService,
  };
}
