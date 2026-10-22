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
import { PrescriptionPreremplie } from "./r3/PrescriptionPreremplie";

export const model = defineModel<Questions, Faits, Cibles>({
  preconisation: { faits, cibles },
  transportAndEligibility: {
    parts: PARTS,
    title: "Résultat de l’éligibilité",
    result: eligibilite,
  },
  cerfa: {
    part: COMPLEMENT,
    // Aucun cerfa n'est encore rempli : après P3, le résultat n'offre pas de
    // PDF à télécharger (#157). Il récapitule les réponses, sous un titre
    // d'attente.
    form: () => null,
    title: "Informations recueillies",
    Resultat: PrescriptionPreremplie,
    startLabel: libelleDeCompletion,
    downloadLabel: "Télécharger et imprimer la prescription pré-remplie",
  },
  seeds: () => import("./seeds-catalogue").then((m) => m.SEEDS),
});
