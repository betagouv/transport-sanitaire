// Génère un cerfa comme le navigateur : par le cas d'usage, sur `pdf-lib`. Les
// tests du cerfa et du modèle s'en servent, avec le gabarit qu'ils fournissent.

import type { CerfaDto } from "../../../core/socle/cerfa";
import {
  type Cerfa,
  type CerfaUseCases,
  cerfaUseCases,
  type GeneratedCerfa,
  GenerateTheCerfa,
  PdfLibCerfaAdapter,
} from "../../../front/socle/cerfa";

/** La marque de chaque page d'un aperçu. */
export const PREVIEW_MARK = GenerateTheCerfa.PREVIEW_MARK;

/** Les cas d'usage du cerfa, sur `pdf-lib`, tels que le conteneur les donne. */
export function casDUsageDuCerfa(): CerfaUseCases {
  return cerfaUseCases(new PdfLibCerfaAdapter());
}

/** Le cerfa généré d'après `dto`, comme à l'écran. */
export function generateCerfa<Dto extends CerfaDto>(
  cerfa: Cerfa<Dto>,
  dto: Dto,
  options?: { preview?: boolean },
): Promise<GeneratedCerfa> {
  return casDUsageDuCerfa().generateTheCerfa.execute(cerfa, dto, options);
}
