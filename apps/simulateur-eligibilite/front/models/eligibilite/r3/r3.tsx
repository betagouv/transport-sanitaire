// Le second résultat (R3) à l'écran : le texte du document que la préconisation
// complète, et les endroits où s'écrivent ses valeurs. Ce que R3 dit (le choix
// du document, ses valeurs, son titre, le bouton qui y mène depuis R2) est du
// métier : `core/models/eligibilite/r3/r3.ts`. Le socle pose les boutons
// d'impression et de téléchargement, puis l'aperçu du document.
//
// Les gabarits sont ceux de `formulaires/` de la v10.1.3, à l'octet près
// (`PROVENANCE_FORMULAIRES.json`). Les trois se remplissent : le S3141
// (`s3141/`), la PMT (`s3138g/`) et la DAP (`s3139h/`).

import { R3 as METIER } from "../../../../core/models/eligibilite/r3/r3";
import { ENDROITS } from "./documents";

export const R3 = {
  /** Où s'écrivent les entrées de chaque document, par support. */
  endroits: ENDROITS,
  /** Le texte du contrat, sous le stepper. */
  Page: () => <p>{METIER.texte}</p>,
};
