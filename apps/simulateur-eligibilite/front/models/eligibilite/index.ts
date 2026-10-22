// Le modèle de l'éditeur : son métier (`core/models/eligibilite/`), puis ses
// deux résultats, R2 et R3.

import { model as core } from "../../../core/models/eligibilite";
import type { Cibles } from "../../../core/models/eligibilite/declarations/cibles";
import type { Faits } from "../../../core/models/eligibilite/declarations/faits";
import type { Questions } from "../../../core/models/eligibilite/declarations/questions";
import { defineModel } from "../../socle";
import { libelleDeCompletion } from "./r2/boutons-du-resultat";
import { eligibilite } from "./r2/resultat";
import { PrescriptionPreremplie } from "./r3/PrescriptionPreremplie";

export const model = defineModel<Questions, Faits, Cibles>({
  core,
  result: { title: "Résultat de l’éligibilité", content: eligibilite },
  cerfa: {
    // Aucun cerfa n'est encore rempli : après P3, le résultat n'offre pas de
    // PDF à télécharger (#157). Il récapitule les réponses, sous un titre
    // d'attente.
    form: () => null,
    title: "Informations recueillies",
    Resultat: PrescriptionPreremplie,
    startLabel: libelleDeCompletion,
    downloadLabel: "Télécharger et imprimer la prescription pré-remplie",
  },
});
