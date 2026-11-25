// Le modèle de l'éditeur : son métier (`core/models/eligibilite/`), puis ses
// deux résultats, R2 et R3, le besoin du prescripteur, l'invitation à donner
// son avis, l'indicateur de parcours ALD et les codes que R2 donne au journal.

import { model as core } from "../../../core/models/eligibilite";
import { BESOIN } from "../../../core/models/eligibilite/besoin";
import type { Cibles } from "../../../core/models/eligibilite/cibles/noms";
import type { Faits } from "../../../core/models/eligibilite/faits/noms";
import type { Questions } from "../../../core/models/eligibilite/questions/reponses";
import { type Lecture, R2 } from "../../../core/models/eligibilite/r2/r2";
import VERSION from "../../../core/models/eligibilite/rules/VERSION?raw";
import { ModelFactory } from "../../socle";
import { AVIS } from "./avis";
import { CODES_DU_RESULTAT } from "./codes-du-resultat";
import { INDICATEUR_ALD } from "./indicateur-ald";
import { pageDeR2 } from "./r2/r2";
import { R3 } from "./r3/r3";

export const model = ModelFactory.define<
  Questions,
  Faits,
  Cibles,
  Lecture["reading"],
  object
>({
  core,
  // Celle que l'intégration d'une livraison écrit : rien d'autre à monter.
  version: VERSION.trim(),
  result: {
    title: "Résultat de l’éligibilité",
    reading: R2.lit,
    content: pageDeR2,
  },
  cerfa: {
    form: R3.document,
    reading: R3.lit,
    title: R3.titre,
    Resultat: R3.Page,
    startLabel: R3.boutonDeDepart,
    measured: R3.mesurees,
    // `printLabel` et `downloadLabel` de `CONTRAT_RENDU_DOCUMENTAIRE.json`.
    printLabel: "Imprimer",
    downloadLabel: "Télécharger",
  },
  intent: BESOIN,
  feedback: AVIS,
  aldIndicator: INDICATEUR_ALD,
  resultCodes: CODES_DU_RESULTAT,
});
