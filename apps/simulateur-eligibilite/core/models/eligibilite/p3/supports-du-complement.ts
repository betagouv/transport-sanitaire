// Les supports que P3 complète : ce que chacun réclame décide de ce qui se pose.
// Le support est celui de l'issue, figé au verrou.

import { given } from "../question.ts";

const support = given.cible("cible_support_id");

/** La PMT (S3138g) et la DAP (S3139h) : un sens, une rubrique médicale. */
export const pmtOuDap = support.is("S3138g").or(support.is("S3139h"));

/** La DAP (S3139h). */
export const uneDap = support.is("S3139h");

/** Le S3141 de la permission. */
export const unS3141 = support.is("S3141");

/** Les trois supports de P3, S3141 compris, ont un départ et une arrivée. */
export const avecUnDocument = support.is("AUCUN").not();
