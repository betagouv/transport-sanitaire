// Le modèle de l'éditeur : son métier (`core/models/eligibilite/`), puis ses
// deux résultats, R2 et R3, et l'invitation à donner son avis.

import { model as core } from "../../../core/models/eligibilite";
import type { Cibles } from "../../../core/models/eligibilite/declarations/cibles";
import type { Faits } from "../../../core/models/eligibilite/declarations/faits";
import type { Questions } from "../../../core/models/eligibilite/declarations/questions";
import { defineModel } from "../../socle";
import { AVIS } from "./avis";
import { libelleDeCompletion } from "./r2/boutons-du-resultat";
import { eligibilite } from "./r2/resultat";
import { LU_PAR_R2, type LuParR2 } from "./r2/trace-du-resultat";
import { documentDuComplement } from "./r3/documents-du-resultat";
import {
  PrescriptionPreremplie,
  RIEN_DES_REPONSES,
} from "./r3/PrescriptionPreremplie";
import { titreDuResultat } from "./r3/titre-du-resultat";

export const model = defineModel<Questions, Faits, Cibles, LuParR2, object>({
  core,
  result: {
    title: "Résultat de l’éligibilité",
    reading: LU_PAR_R2,
    content: eligibilite,
  },
  cerfa: {
    form: documentDuComplement,
    reading: RIEN_DES_REPONSES,
    title: titreDuResultat,
    Resultat: PrescriptionPreremplie,
    startLabel: libelleDeCompletion,
    // `printLabel` et `downloadLabel` de `CONTRAT_RENDU_DOCUMENTAIRE.json`.
    printLabel: "Imprimer",
    downloadLabel: "Télécharger",
  },
  feedback: AVIS,
});
