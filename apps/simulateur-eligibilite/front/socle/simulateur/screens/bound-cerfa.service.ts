// Le document de la préconisation, tel que l'écran le remplit : ce que le
// métier choisit (`core.cerfa`), et l'endroit de chaque entrée que l'écran
// fournit pour la même clé (`cerfa.places`).

import type { Context } from "../../../../core/socle/questionnaire-engine";
import type { BoundCerfa } from "../../cerfa";
import type { Model } from "../../model.types";

export class BoundCerfaService {
  /**
   * Le document que la préconisation complète, avec ses valeurs et ses
   * endroits. `null` : aucun.
   */
  static of(model: Model, context: Context): BoundCerfa | null {
    const key = model.core.cerfa.document.in(context);
    if (key === null) return null;
    const cerfa = model.cerfa.places[key];
    const mapping = model.core.cerfa.values[key];
    // Le compilateur l'interdit à un modèle typé ; le socle, lui, ne lit aucune
    // clé, et un modèle effacé peut mentir.
    if (!cerfa || !mapping)
      throw new Error(
        `Le modèle choisit le document « ${key} » sans en donner les endroits et les valeurs.`,
      );
    return { cerfa, mapping };
  }
}
