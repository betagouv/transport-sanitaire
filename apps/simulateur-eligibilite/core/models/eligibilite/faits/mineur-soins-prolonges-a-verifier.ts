// fait_mineur_soins_prolonges_a_verifier : situation de soins prolongés du
// mineur explicitement signalée mais reconnaissance non vérifiable.
//
// Aucune question ne le pose : Q1.3 n'a pas de réponse « je ne peux pas le
// vérifier », et Q2.2.2 à Q2.2.4, les rattrapages, ne se posent pas (D-109).
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { Fait } from "../../../socle/index.ts";
import type { DeclarationDeFait } from "../declarations/faits.ts";

export const mineurSoinsProlongesAVerifier: DeclarationDeFait = () =>
  Fait.inconnu(
    "Aucune question ne le pose : Q1.3 n'a pas de réponse « je ne peux pas le vérifier » (D-109).",
  );
