// Ce qui entoure tout résultat qui lit les textes de l'éditeur (D-112) : le
// catalogue se charge à la demande (900 ko, hors du chunk d'entrée). Le
// chargement en échec donne un titre et une phrase, sans rien inventer.

import type { FirstResult } from "../../../socle";
import type { CatalogueResultats } from "../declarations/catalogue-resultats";
import { catalogueDeLaSession } from "./catalogue-resultats";

export async function avecLeCatalogue(
  compose: (catalogue: CatalogueResultats) => FirstResult,
): Promise<FirstResult> {
  const chargement = await catalogueDeLaSession();
  if ("echec" in chargement) return CHARGEMENT_EN_ECHEC;
  return compose(chargement.catalogue);
}

// ---- implémentation ----

const CHARGEMENT_EN_ECHEC: FirstResult = {
  title: "Le résultat n’a pas pu être affiché",
  body: (
    <p role="alert">
      Les textes du résultat n’ont pas pu être chargés. Rechargez la page.
    </p>
  ),
};
