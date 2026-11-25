// Le modèle de l'éditeur, ses cerfas chargeant leur gabarit sur le disque : le
// navigateur de test ne sert pas les assets de l'app. Le PDF se génère, et le
// texte de R3, qui l'attend, s'affiche.

import { model } from "../../../front/models/eligibilite";
import type { Model } from "../../../front/socle/model.types";
import { gabarit } from "./r3/reponses-du-cerfa";

// Le gabarit de chaque cerfa, par le début du nom de son fichier.
const SUPPORTS: Readonly<Record<string, string>> = {
  "prescription-medicale-de-transport": "S3138g",
  "demande-d-accord-prealable": "S3139h",
  "prescription-de-permission-de-sortie": "S3141",
};

function supportDe(fileName: string): string {
  const support = SUPPORTS[fileName];
  if (!support) throw new Error(`Cerfa sans gabarit connu : ${fileName}`);
  return support;
}

export const MODELE_AUX_GABARITS_DU_DISQUE: Model = {
  ...model,
  cerfa: {
    ...model.cerfa,
    places: Object.fromEntries(
      Object.entries(model.cerfa.places).map(([support, cerfa]) => [
        support,
        {
          ...cerfa,
          template: () => gabarit(supportDe(cerfa.fileName)),
        },
      ]),
    ),
  },
};
