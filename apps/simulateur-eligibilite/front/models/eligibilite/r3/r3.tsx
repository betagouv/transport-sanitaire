// Le second résultat (R3) à l'écran : le texte du document que la préconisation
// complète, et le document lui-même, le cerfa lié à ses valeurs. Ce que R3
// dit (le choix du document, son titre, le bouton qui y mène depuis R2) est du
// métier : `core/models/eligibilite/r3/r3.ts`. Le socle pose les boutons
// d'impression et de téléchargement, puis l'aperçu du document.
//
// Les gabarits sont ceux de `formulaires/` de la v10.1.3, à l'octet près
// (`PROVENANCE_FORMULAIRES.json`). Les trois se remplissent : le S3141
// (`s3141/`), la PMT (`s3138g/`) et la DAP (`s3139h/`).

import { R3 as METIER } from "../../../../core/models/eligibilite/r3/r3";
import { DOCUMENTS } from "./documents";

export const R3 = {
  lit: METIER.lit,
  /** Le document que cette préconisation complète. `null` : aucun. */
  document: METIER.document.compute((support) => support && DOCUMENTS[support]),
  mesurees: METIER.mesurees,
  titre: METIER.titre,
  boutonDeDepart: METIER.boutonDeDepart,
  /** Le texte du contrat, sous le stepper. */
  Page: () => <p>{METIER.texte}</p>,
};
