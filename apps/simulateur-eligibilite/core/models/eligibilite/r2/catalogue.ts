// Les textes de R2, que l'éditeur livre à côté de ses règles
// (`rules/catalogue-resultats.json`). Ils ne se chargent qu'à la demande :
// 900 ko de textes n'ont rien à faire sur les pages du questionnaire.

import type { CatalogueResultats } from "./blocs/forme-du-catalogue.ts";

/** Le catalogue des textes de R2. L'affectation vérifie sa forme. */
export async function catalogueResultats(): Promise<CatalogueResultats> {
  const { default: catalogue } = await import(
    "../rules/catalogue-resultats.json",
    { with: { type: "json" } }
  );
  return catalogue;
}
