// Les codes que R2 donne au journal des parcours (`journal-des-parcours.md`) :
// l'issue, le mode, le code de raison et le support, tels que les règles les
// calculent, et la composition du transport (ANA22-04). Sans issue ou sans
// support, le R2 ne part pas. Le code de raison part en liste : vide quand les
// règles n'en donnent aucun, absente quand il leur manque un fait. Le mode ne
// part que quand la composition en demande un.

import {
  type Composition,
  CompositionDuTransport,
} from "../../../core/models/eligibilite/cibles/composition-du-transport.vo";
import type { ModeId } from "../../../core/models/eligibilite/cibles/noms";
import { given } from "../../../core/models/eligibilite/questions/reponses";
import type { Cible } from "../../../core/socle";
import type { Mode, ResultCodes, TransportComposition } from "../../socle";

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
      .compute(CompositionDuTransport.partieTerrestreDe),
  })
  .compute(({ issue, raison, ...preuves }): ResultCodes => {
    const composition = CompositionDuTransport.of(preuves);
    return {
      issue: valeurDe(issue),
      mode: modeDuJournal(composition.modeTerrestre),
      transportComposition: COMPOSITION_AU_JOURNAL[composition.composition],
      reasonCodes: codesDe(raison),
      support: valeurDe(preuves.support),
    };
  });

// ---- implémentation ----

// Ce que le contrat du journal appelle chaque composition du cœur : un cas
// ajouté au cœur sans son code ne compile pas.
const COMPOSITION_AU_JOURNAL = {
  "sans objet": "not_applicable",
  inconnue: "unknown",
  "ligne régulière seule": "regular_line_only",
  "terrestre seule": "terrestrial_only",
  mixte: "mixed",
} as const satisfies Record<Composition, TransportComposition>;

// Les modes des règles sont ceux du journal, mot pour mot : le paramètre ne
// reçoit un mode que tant que les deux listes coïncident, dans les deux sens.
type Identiques<Regles, Journal> = [Regles] extends [Journal]
  ? [Journal] extends [Regles]
    ? Regles
    : never
  : never;

function modeDuJournal(mode: Identiques<ModeId, Mode> | null): Mode | null {
  return mode;
}

function valeurDe<Value extends string>(cible: Cible<Value>): Value | null {
  return cible.value ?? null;
}

function codesDe(raison: Cible<string>): readonly string[] | null {
  if (raison.isInconnue()) return null;
  const code = raison.value ?? null;
  return code === null ? [] : [code];
}
