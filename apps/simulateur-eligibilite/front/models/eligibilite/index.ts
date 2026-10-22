// Le modèle de l'éditeur, dont `rules/VERSION` porte le numéro.

import { defineModel } from "../../socle";
import type { Cibles } from "./declarations/cibles";
import type { Faits } from "./declarations/faits";
import type { Questions } from "./declarations/questions";
import { cibles } from "./evaluation-des-regles";
import { COMPLEMENT } from "./p3/partie-3";
import { faits } from "./preconisation";
import { PARTS } from "./questionnaire";
import { libelleDeCompletion } from "./r2/boutons-du-resultat";
import { eligibilite } from "./r2/resultat";
import { documentDuComplement } from "./r3/documents-du-resultat";
import { PrescriptionPreremplie } from "./r3/PrescriptionPreremplie";
import { titreDuResultat } from "./r3/titre-du-resultat";

export const model = defineModel<Questions, Faits, Cibles>({
  preconisation: { faits, cibles },
  transportAndEligibility: {
    parts: PARTS,
    title: "Résultat de l’éligibilité",
    result: eligibilite,
  },
  cerfa: {
    part: COMPLEMENT,
    form: documentDuComplement,
    title: titreDuResultat,
    Resultat: PrescriptionPreremplie,
    startLabel: libelleDeCompletion,
    // `printLabel` et `downloadLabel` de `CONTRAT_RENDU_DOCUMENTAIRE.json`.
    printLabel: "Imprimer",
    downloadLabel: "Télécharger",
  },
  seeds: () => import("./seeds-catalogue").then((m) => m.SEEDS),
});
