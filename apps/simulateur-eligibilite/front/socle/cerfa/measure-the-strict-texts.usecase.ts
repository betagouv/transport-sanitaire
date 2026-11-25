// Mesure les textes stricts d'un cerfa : ce qu'un texte saisi y tient, et le
// maximum de son compteur. Le PDF et le gabarit se chargent avec elle.

import type { CerfaDto } from "../../../core/socle/cerfa";
import type { Cerfa } from "./cerfa.types";
import type { CerfaPdf } from "./cerfa-pdf.port";
import type { MeasureStrictText } from "./cerfa-pdf.types";
import { StrictEntriesService } from "./strict-entries.service";

export class MeasureTheStrictTexts {
  readonly #pdf: CerfaPdf;

  constructor(pdf: CerfaPdf) {
    this.#pdf = pdf;
  }

  /** La mesure des textes stricts de `cerfa`, par entrée du DTO. */
  async execute(cerfa: Cerfa<CerfaDto>): Promise<MeasureStrictText> {
    const template = await cerfa.template();
    return this.#pdf.measureStrictTexts(
      template,
      StrictEntriesService.of(cerfa),
    );
  }
}
