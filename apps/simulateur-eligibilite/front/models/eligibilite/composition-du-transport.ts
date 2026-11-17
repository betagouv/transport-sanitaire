// La composition du transport d'un résultat (ANA22-04, v10.2.2) : ce que son
// trajet combine, la ligne régulière et une partie terrestre, et le mode de
// cette partie. Elle ne lit que des preuves validées : le fait de la ligne
// régulière (Q2.3.2), la réponse de Q2.3.2.terrestre, les cibles du support et
// du mode. Jamais un texte affiché, ni une réponse qu'on n'a pas donnée.

import type { Cible, Fait } from "../../../core/socle";
import type { Mode, TransportComposition } from "../../socle";

/** Ce que Q2.3.2.terrestre dit d'une partie terrestre. */
export type PartieTerrestre = "prevue" | "absente" | "inconnue";

/** Ce que lit la composition. */
type Preuves = {
  readonly support: Cible<string>;
  readonly ligneReguliere: Fait;
  readonly partieTerrestre: PartieTerrestre;
  readonly mode: Cible<Mode>;
};

/** Aucun mode terrestre : la composition n'en a pas, ou rien ne le prouve. */
type SansMode = null;

export class CompositionDuTransport {
  /** Le code du contrat. */
  readonly code: TransportComposition;
  /** Le mode de la partie terrestre, quand le code en demande un. */
  readonly modeTerrestre: Mode | SansMode;

  private constructor(code: TransportComposition, mode: Mode | SansMode) {
    this.code = code;
    this.modeTerrestre = AVEC_UN_MODE.includes(code) ? mode : null;
  }

  /** La composition que ces preuves établissent. */
  static of(preuves: Preuves): CompositionDuTransport {
    return new CompositionDuTransport(
      codeDe(preuves),
      preuves.mode.value ?? null,
    );
  }
}

// ---- implémentation ----

// `terrestrial_only` et `mixed` demandent le mode terrestre. `unknown` ne le
// porte pas : sans preuve, il classerait un trajet que rien n'établit.
const AVEC_UN_MODE: readonly TransportComposition[] = [
  "terrestrial_only",
  "mixed",
];

// Sans support, aucun mode ne s'applique : hypothèse, point 23 du retour
// v10.2.2. Un support inconnu laisse la composition inconnue.
function codeDe(preuves: Preuves): TransportComposition {
  const { support, ligneReguliere, partieTerrestre, mode } = preuves;
  if (support.is("AUCUN")) return "not_applicable";
  if (support.value == null) return "unknown";
  if (ligneReguliere.isOui()) return avecLaLigne(partieTerrestre, mode);
  const terrestre = ligneReguliere.isNon() && mode.value != null;
  return terrestre ? "terrestrial_only" : "unknown";
}

// La ligne régulière est prouvée : seule une réponse dit sa partie terrestre,
// et une partie terrestre sans mode ne se classe pas.
function avecLaLigne(
  partieTerrestre: PartieTerrestre,
  mode: Cible<Mode>,
): TransportComposition {
  if (partieTerrestre === "absente") return "regular_line_only";
  const mixte = partieTerrestre === "prevue" && mode.value != null;
  return mixte ? "mixed" : "unknown";
}
