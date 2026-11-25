// Le modèle de l'éditeur : son métier (`core/models/eligibilite/`, qui dit ce
// que lisent ses deux résultats, le document et le besoin du prescripteur),
// puis ce qui les montre, R2 et R3, l'invitation à donner son avis,
// l'indicateur de parcours ALD et les codes que R2 donne au journal.

import { model as core } from "../../../core/models/eligibilite";
import VERSION from "../../../core/models/eligibilite/rules/VERSION?raw";
import { ModelFactory } from "../../socle";
import { AVIS } from "./avis";
import { CODES_DU_RESULTAT } from "./codes-du-resultat";
import { INDICATEUR_ALD } from "./indicateur-ald";
import { pageDeR2 } from "./r2/r2";
import { R3 } from "./r3/r3";

export const model = ModelFactory.define({
  core,
  // Celle que l'intégration d'une livraison écrit : rien d'autre à monter.
  version: VERSION.trim(),
  result: { title: "Résultat de l’éligibilité", content: pageDeR2 },
  cerfa: {
    places: R3.endroits,
    Resultat: R3.Page,
    // `printLabel` et `downloadLabel` de `CONTRAT_RENDU_DOCUMENTAIRE.json`.
    printLabel: "Imprimer",
    downloadLabel: "Télécharger",
  },
  feedback: AVIS,
  aldIndicator: INDICATEUR_ALD,
  resultCodes: CODES_DU_RESULTAT,
});
