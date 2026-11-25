// Ce que le cerfa attend d'un PDF : remplir le gabarit, l'aplatir, et mesurer
// ce qu'un texte strict y tient. Il ne sait pas quelle bibliothèque s'en charge
// (`pdf-lib/pdf-lib-cerfa.adapter.ts`), ni comment elle se charge.

import type { StrictEntry } from "./cerfa.types";
import type {
  Drawn,
  FieldEntry,
  Filled,
  FillOptions,
  Flattened,
  MeasureStrictText,
  PdfBytes,
  StrictLineMeasure,
} from "./cerfa-pdf.types";

export interface CerfaPdf {
  /**
   * Écrit `entries` dans le formulaire `template`. Un texte n'est jamais coupé,
   * et ne bloque jamais le PDF : le texte qui ne tient pas se dessine sous son
   * cadre, et un texte strict s'écrit à sa taille ou en partie.
   */
  fill(
    template: PdfBytes,
    entries: readonly FieldEntry[],
    options?: FillOptions,
  ): Promise<Filled>;

  /**
   * Le PDF rempli `pdf`, sans aucun champ, avec `drawn` dessiné par-dessus :
   * il s'imprime tel quel, et rien ne s'y corrige plus dans un lecteur.
   */
  flatten(pdf: Uint8Array, drawn?: Drawn): Promise<Flattened>;

  /**
   * La mesure des textes stricts dessinés de `entries`, par entrée du DTO :
   * sans champ, aucun gabarit n'est nécessaire.
   */
  lineMeasurers(
    entries: readonly StrictEntry[],
  ): Promise<ReadonlyMap<string, StrictLineMeasure>>;

  /**
   * La mesure des textes stricts de `entries` sur `template`, la même que celle
   * de l'écriture : la génération et l'éditeur de l'écran la partagent.
   */
  measureStrictTexts(
    template: PdfBytes,
    entries: readonly StrictEntry[],
  ): Promise<MeasureStrictText>;
}
