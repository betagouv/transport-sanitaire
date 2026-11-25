// La composition du transport d'un résultat (ANA22-04, v10.2.2) : ce que son
// trajet combine, la ligne régulière et une partie terrestre, et le mode de
// cette partie. Elle ne lit que des preuves validées : le fait de la ligne
// régulière (Q2.3.2), la réponse de Q2.3.2.terrestre, les cibles du support et
// du mode. Jamais un texte affiché, ni une réponse qu'on n'a pas donnée.

import type { Cible, Fait } from "../../../socle/index.ts";
import type { Cibles, ModeId } from "./noms.ts";

/** Ce que le trajet combine. */
export type Composition =
  | "sans objet"
  | "inconnue"
  | "ligne régulière seule"
  | "terrestre seule"
  | "mixte";

/** Ce que Q2.3.2.terrestre dit d'une partie terrestre. */
export type PartieTerrestre = "prevue" | "absente" | "inconnue";

/** Ce que lit la composition. */
type Preuves = {
  readonly support: Cibles["cible_support_id"];
  readonly ligneReguliere: Fait;
  readonly partieTerrestre: PartieTerrestre;
  readonly mode: Cibles["cible_mode_id"];
};

/** Aucun mode terrestre : la composition n'en a pas, ou rien ne le prouve. */
type SansMode = null;

export class CompositionDuTransport {
  /** La composition que ces preuves établissent. */
  static of(preuves: Preuves): CompositionDuTransport {
    return new CompositionDuTransport(
      compositionDe(preuves),
      preuves.mode.value ?? null,
    );
  }

  /**
   * Ce que la réponse de Q2.3.2.terrestre dit de la partie terrestre. Seul Oui
   * l'établit, et seul Non l'écarte : sans réponse, elle reste inconnue (R03).
   */
  static partieTerrestreDe(reponse: {
    is(possibleAnswer: "1_OUI" | "2_NON"): boolean;
  }): PartieTerrestre {
    if (reponse.is("1_OUI")) return "prevue";
    return reponse.is("2_NON") ? "absente" : "inconnue";
  }

  readonly composition: Composition;
  /** Le mode de la partie terrestre, quand la composition en demande un. */
  readonly modeTerrestre: ModeId | SansMode;

  private constructor(composition: Composition, mode: ModeId | SansMode) {
    this.composition = composition;
    this.modeTerrestre = AVEC_UN_MODE.includes(composition) ? mode : null;
    Object.freeze(this);
  }
}

// ---- implémentation ----

// `terrestre seule` et `mixte` demandent le mode terrestre. `inconnue` ne le
// porte pas : sans preuve, elle classerait un trajet que rien n'établit.
const AVEC_UN_MODE: readonly Composition[] = ["terrestre seule", "mixte"];

// Inconnue, ou sans objet : les règles n'en tirent aucune valeur.
function sansValeur(cible: Cible<string>): boolean {
  return cible.isInconnue() || cible.isSansObjet();
}

// Sans support, aucun mode ne s'applique : hypothèse, point 23 du retour
// v10.2.2. Un support inconnu laisse la composition inconnue.
function compositionDe(preuves: Preuves): Composition {
  const { support, ligneReguliere, partieTerrestre, mode } = preuves;
  if (support.is("AUCUN")) return "sans objet";
  if (sansValeur(support)) return "inconnue";
  if (ligneReguliere.isOui()) return avecLaLigne(partieTerrestre, mode);
  const terrestre = ligneReguliere.isNon() && !sansValeur(mode);
  return terrestre ? "terrestre seule" : "inconnue";
}

// La ligne régulière est prouvée : seule une réponse dit sa partie terrestre,
// et une partie terrestre sans mode ne se classe pas.
function avecLaLigne(
  partieTerrestre: PartieTerrestre,
  mode: Cibles["cible_mode_id"],
): Composition {
  if (partieTerrestre === "absente") return "ligne régulière seule";
  const mixte = partieTerrestre === "prevue" && !sansValeur(mode);
  return mixte ? "mixte" : "inconnue";
}
