// Le modèle sur lequel les tests du socle tournent : le questionnaire factice,
// écrit pour eux dans `fixtures/modele-factice/`. Les tests le prennent tous
// ici : changer de modèle de test ne touche que ce fichier.

import type { Models } from "../../front/socle/app/model-choice";
import type { ModelSource } from "../../front/socle/app/model-loading";

export { model as modeleDeTest } from "./fixtures/modele-factice";

/** Ce que `App` attend quand elle n'a qu'un modèle à dérouler. */
export function seulModele(source: ModelSource): Models {
  return [{ label: "Modèle de test", load: () => source }];
}
