// Les codes que R2 donne au journal des parcours (ADR-9 de
// docs/knowledge/adr/analytics.md) : l'issue, le mode, le code de raison, le
// support et le financeur, tels que les règles les calculent. Une cible sans
// objet ou inconnue ne part pas. Le code de raison part en liste : vide quand
// les règles n'en donnent aucun, absente quand il leur manque un fait.

import { given } from "../../../core/models/eligibilite/questions/reponses";
import type { Cible } from "../../../core/socle";
import type { ResultCodes } from "../../socle";

export const CODES_DU_RESULTAT = given
  .all({
    issue: given.cible("cible_issue_id"),
    mode: given.cible("cible_mode_id"),
    raison: given.cible("cible_reason_code"),
    support: given.cible("cible_support_id"),
    financeur: given.cible("cible_financeur"),
  })
  .compute(
    ({ issue, mode, raison, support, financeur }): ResultCodes => ({
      issue: valeurDe(issue),
      mode: valeurDe(mode),
      reasonCodes: codesDe(raison),
      support: valeurDe(support),
      financeur: valeurDe(financeur),
    }),
  );

// ---- implémentation ----

function valeurDe(cible: Cible<string>): string | null {
  return cible.value ?? null;
}

function codesDe(raison: Cible<string>): readonly string[] | null {
  if (raison.value === undefined) return null;
  return raison.value === null ? [] : [raison.value];
}
