// Le modèle de l'éditeur : son métier (`core/models/eligibilite/`), puis ses
// deux résultats, R2 et R3.

import { model as core } from "../../../core/models/eligibilite";
import type { Cibles } from "../../../core/models/eligibilite/declarations/cibles";
import type { Faits } from "../../../core/models/eligibilite/declarations/faits";
import type { Questions } from "../../../core/models/eligibilite/declarations/questions";
import { defineModel } from "../../socle";
import { libelleDeCompletion } from "./r2/boutons-du-resultat";
import { eligibilite } from "./r2/resultat";
import { documentDuComplement } from "./r3/documents-du-resultat";
import {
  aLaPlaceDeLApercu,
  PrescriptionPreremplie,
} from "./r3/PrescriptionPreremplie";
import { titreDuResultat } from "./r3/titre-du-resultat";

export const model = defineModel<Questions, Faits, Cibles>({
  core,
  result: { title: "Résultat de l’éligibilité", content: eligibilite },
  cerfa: {
    form: documentDuComplement,
    title: titreDuResultat,
    Resultat: PrescriptionPreremplie,
    standIn: aLaPlaceDeLApercu,
    startLabel: libelleDeCompletion,
    // `printLabel` et `downloadLabel` de `CONTRAT_RENDU_DOCUMENTAIRE.json`.
    printLabel: "Imprimer",
    downloadLabel: "Télécharger",
  },
});
