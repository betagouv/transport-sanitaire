// fait_source_officielle_active : source de prestation officielle active.
//
// Aucune question ne le pose : les sous-questions a à e et i à l de Q2.1, et
// le régime, ne changent aucune sortie. Elles restent masquées (D-102).
//
// Il suit `CORRECTIF_FAITS_SANS_REPONSE.md`, qui prime sur
// `CONTRAT_REPONSES_FAITS.json`.

import { Fait } from "../../../socle/index.ts";
import {
  type DeclarationDeFait,
  SOUS_QUESTIONS_MASQUEES,
} from "../declarations/faits.ts";

export const sourceOfficielleActive: DeclarationDeFait = () =>
  Fait.inconnu(SOUS_QUESTIONS_MASQUEES);
