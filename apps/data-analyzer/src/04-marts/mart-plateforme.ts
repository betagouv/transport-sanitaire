// Mart « par plateforme » : le même ratio que `MartRatio`, mais **une ligne par plateforme**.
// Là où un mart de ratio joint les plateformes d'une cellule (« A + B ») et somme leurs
// trajets, celui-ci rend à chacune son volume et sa part :
//   nb_plateforme = Σ trajets de cette plateforme sur la cellule,
//   nb_reference  = référentiel national de la cellule, **répété sur chaque ligne**,
//   part          = nb_plateforme / nb_reference.
// Les parts d'une cellule s'additionnent et redonnent celle du mart de ratio. Le
// dénominateur, lui, ne se somme pas d'une ligne à l'autre.
//
// Seules les cellules où une plateforme déclare des trajets y figurent : le fait « aucune
// plateforme » se lit dans le mart de ratio.
//
// Deux formes, selon la configuration :
//   - par véhicule, toutes années (colonnes `nb_reference`, `part`) ;
//   - annuelle, quand `annee` est fournie : une seule année, avec en plus une ligne
//     « Tous transports » qui somme les véhicules, aux colonnes des rollups annuels
//     (`nb_cnam`, `ratio`).

import { join } from "node:path";
import type { TrajetReconcilieRow } from "../contrats.ts";
import { Csv } from "../csv.ts";
import { Paths } from "../paths.ts";
import { TOUS_TRANSPORTS } from "./vehicules.ts";

export interface MartPlateformeConfig {
  fichier: string; // nom du CSV produit dans build/marts/
  log: string; // libellé affiché
  grain: (t: TrajetReconcilieRow) => string; // valeur de clé, "" pour ignorer la ligne
  identite: (cle: string) => Row; // colonnes d'identité (clé + libellés), forme fixe
  annee?: string; // forme annuelle : seule année retenue, plus la somme des véhicules
}

export class MartPlateforme {
  readonly #config: MartPlateformeConfig;

  constructor(config: MartPlateformeConfig) {
    this.#config = config;
  }

  execute(trajets: TrajetReconcilieRow[]): void {
    const rows = this.calculer(trajets);
    Csv.write(join(Paths.MARTS, this.#config.fichier), rows);
    this.#report(rows);
  }

  /** Le calcul pur (sans écriture), pour le test comme pour `execute`. */
  calculer(trajets: TrajetReconcilieRow[]): Row[] {
    const cellules = new Map<string, Cellule>();
    for (const t of trajets) this.#accumuler(cellules, t);
    return [...cellules.entries()]
      .sort(([a], [b]) => a.localeCompare(b)) // grain, puis année, puis véhicule
      .flatMap(([cle, cellule]) => this.#lignes(cle, cellule));
  }

  #accumuler(cellules: Map<string, Cellule>, t: TrajetReconcilieRow): void {
    if (t.enveloppe !== "Hors Article 80") return;
    const { annee } = this.#config;
    if (annee && t.annee !== annee) return;
    const grain = this.#config.grain(t);
    if (!grain) return;
    const vehicules = annee
      ? [t.vehicule_canonique, TOUS_TRANSPORTS]
      : [t.vehicule_canonique];
    for (const vehicule of vehicules)
      this.#ajouter(cellules, `${grain}|${t.annee}|${vehicule}`, t);
  }

  #ajouter(
    cellules: Map<string, Cellule>,
    cle: string,
    t: TrajetReconcilieRow,
  ): void {
    const cellule = this.#cellule(cellules, cle);
    const nb = Number(t.nb_trajets);
    if (t.role === "referentiel-national") cellule.nb_reference += nb;
    else if (t.role === "plateforme") {
      const nom = t.plateforme || t.source;
      cellule.parPlateforme.set(
        nom,
        (cellule.parPlateforme.get(nom) ?? 0) + nb,
      );
    }
  }

  #cellule(cellules: Map<string, Cellule>, cle: string): Cellule {
    const connue = cellules.get(cle);
    if (connue) return connue;
    const cellule: Cellule = { nb_reference: 0, parPlateforme: new Map() };
    cellules.set(cle, cellule);
    return cellule;
  }

  #lignes(cle: string, cellule: Cellule): Row[] {
    const [grain, annee, vehicule] = cle.split("|") as [string, string, string];
    return [...cellule.parPlateforme.entries()]
      .filter(([, nb]) => nb > 0)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([plateforme, nb]) => ({
        ...this.#config.identite(grain),
        annee,
        vehicule,
        plateforme,
        ...this.#mesures(nb, cellule.nb_reference),
      }));
  }

  // Les noms de colonnes suivent la famille du mart : ceux des marts de ratio par
  // véhicule, ceux des rollups en forme annuelle. Une vue Grist se transpose ainsi d'un
  // mart à son détail par plateforme sans renommer de colonne.
  #mesures(nb: number, reference: number): Row {
    const part = reference > 0 ? Number((nb / reference).toFixed(4)) : "";
    const depasse = typeof part === "number" && part > 1;
    if (this.#config.annee)
      return {
        nb_plateforme: nb,
        nb_cnam: reference,
        ratio: part,
        alerte_qualite: depasse ? "ratio>1" : "",
      };
    return {
      nb_plateforme: nb,
      nb_reference: reference,
      part,
      alerte_qualite: depasse ? "part>1" : "",
    };
  }

  #report(rows: Row[]): void {
    const plateformes = new Set(rows.map((r) => r.plateforme)).size;
    console.log(
      `marts ${this.#config.log.padEnd(15)}: ${rows.length} lignes (une par plateforme, ${plateformes} plateformes)`,
    );
  }
}

// ---- implémentation ----

type Row = Record<string, string | number>;

interface Cellule {
  nb_reference: number;
  parPlateforme: Map<string, number>; // nom de la plateforme → ses trajets sur la cellule
}
