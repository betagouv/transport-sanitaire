// Les codes que R2 donne au journal des parcours (ADR-0045) : l'issue, le mode,
// le code de raison et le support, tels que les règles les calculent, et la
// composition du transport (ANA22-04). Sans issue ou sans support, le R2 ne
// part pas. Le code de raison part en liste : vide quand les règles n'en
// donnent aucun, absente quand il leur manque un fait. Le mode ne part que
// quand la composition en demande un.

import { given } from "../../../core/models/eligibilite/questions/reponses";
import type { Cible } from "../../../core/socle";
import type { ResultCodes } from "../../socle";
import {
  CompositionDuTransport,
  type PartieTerrestre,
} from "./composition-du-transport";

export const CODES_DU_RESULTAT = given
  .all({
    issue: given.cible("cible_issue_id"),
    mode: given.cible("cible_mode_id"),
    raison: given.cible("cible_reason_code"),
    support: given.cible("cible_support_id"),
    ligneReguliere: given.fait("fait_avion_bateau_ligne"),
    partieTerrestre: given
      .question("Q2.3.2.terrestre")
      .answer()
      .compute(partieTerrestreDe),
  })
  .compute(({ issue, raison, ...preuves }): ResultCodes => {
    const composition = CompositionDuTransport.of(preuves);
    return {
      issue: valeurDe(issue),
      mode: composition.modeTerrestre,
      transportComposition: composition.code,
      reasonCodes: codesDe(raison),
      support: valeurDe(preuves.support),
    };
  });

// ---- implémentation ----

function valeurDe<Value extends string>(cible: Cible<Value>): Value | null {
  return cible.value ?? null;
}

function codesDe(raison: Cible<string>): readonly string[] | null {
  if (raison.isInconnue()) return null;
  const code = raison.value ?? null;
  return code === null ? [] : [code];
}

// Seul Oui établit la partie terrestre, et seul Non l'écarte : sans réponse,
// elle reste inconnue (R03).
function partieTerrestreDe(reponse: {
  is(possibleAnswer: "1_OUI" | "2_NON"): boolean;
}): PartieTerrestre {
  if (reponse.is("1_OUI")) return "prevue";
  return reponse.is("2_NON") ? "absente" : "inconnue";
}
