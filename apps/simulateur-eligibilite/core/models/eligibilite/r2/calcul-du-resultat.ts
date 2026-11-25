// Le résultat de R2 en donnée, d'après ce que le socle lit pour lui : un
// serveur le renverrait tel quel. Les textes de l'éditeur se chargent à la
// demande, et seulement quand une issue les demande.

import { catalogueResultats } from "./catalogue.ts";
import { type Lecture, R2, type ResultatR2 } from "./r2.ts";

/** Le résultat de R2 pour cette lecture. Rejette si les textes manquent. */
export async function resultatDeR2(
  reading: Lecture["reading"],
): Promise<ResultatR2> {
  const r2 = R2.of({ reading });
  return r2.sansCatalogue ?? r2.resultat(await catalogueResultats());
}
