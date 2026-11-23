// Mart « synthèse » : la couverture en un coup d'œil. Pour chaque année, chaque grain
// (établissement ou GHT) et chaque classe de taille, combien d'entités existent, combien
// ont des trajets remboursés, combien ont des trajets plateforme, et ce qu'elles pèsent.
//
// Dérivé des rollups annuels, dont il ne lit que la ligne « Tous transports » : il compte
// donc exactement les entités que les rollups listent, et ses volumes sont les leurs.
//
// Deux dénominateurs coexistent, et le mart les donne côte à côte :
//   nb_entites            — toutes les entités connues ;
//   nb_avec_remboursement — celles qui ont au moins un trajet remboursé dans l'année.
// De même pour le ratio : `ratio` rapporte les trajets plateforme à tout le remboursement
// de la ligne, `ratio_couvert` au remboursement des seules entités couvertes.

import { join } from "node:path";
import { Csv } from "../csv.ts";
import { Paths } from "../paths.ts";
import { TOUS_TRANSPORTS } from "./vehicules.ts";

export class MartSynthese {
  readonly #annees: string[];

  constructor(annees: string[]) {
    this.#annees = annees;
  }

  execute(): void {
    const rows = this.#annees.flatMap((annee) =>
      GRAINS.flatMap((grain) =>
        this.calculer(
          annee,
          grain,
          Csv.read(join(Paths.MARTS, `mart_${grain}_${annee}.csv`)),
        ),
      ),
    );
    Csv.write(join(Paths.MARTS, "mart_synthese.csv"), rows);
    console.log(
      `marts synthese       : ${rows.length} lignes (par année, grain et classe de taille)`,
    );
  }

  /** Le calcul pur (sans I/O), pour le test comme pour `execute`. */
  calculer(annee: string, grain: string, rollup: Ligne[]): Row[] {
    const groupes = new Map(
      [
        ...TAILLES.map((t) => t.libelle),
        SANS_REMBOURSEMENT,
        TOUTES_TAILLES,
      ].map((taille) => [taille, groupeVide()]),
    );
    for (const r of rollup) {
      if (r.vehicule !== TOUS_TRANSPORTS) continue;
      const nbCnam = Number(r.nb_cnam) || 0;
      const nbPlateforme = Number(r.nb_plateforme) || 0;
      for (const taille of [classe(nbCnam), TOUTES_TAILLES])
        compter(groupes.get(taille) ?? groupeVide(), nbCnam, nbPlateforme);
    }
    return [...groupes.entries()].map(([taille, g]) =>
      toRow(annee, grain, taille, g),
    );
  }
}

// ---- implémentation ----

type Row = Record<string, string | number>;

/** Ligne d'un rollup relue depuis son CSV : toutes les valeurs y sont des chaînes. */
type Ligne = Record<string, string>;

const GRAINS = ["juridique", "ght"];

// Classes de taille, par nombre de trajets remboursés dans l'année. Le numéro en tête de
// libellé les garde dans l'ordre quand un tableur les trie. Les seuils sont ronds et
// suivent la distribution : la dernière classe réunit environ 4 % des établissements et
// 70 % du remboursement.
const TAILLES = [
  { plancher: 50_000, libelle: "4. 50 000 trajets et plus" },
  { plancher: 10_000, libelle: "3. 10 000 à 49 999 trajets" },
  { plancher: 1_000, libelle: "2. 1 000 à 9 999 trajets" },
  { plancher: 1, libelle: "1. Moins de 1 000 trajets" },
].reverse();
const SANS_REMBOURSEMENT = "0. Sans remboursement";
const TOUTES_TAILLES = "Toutes tailles";

function classe(nbCnam: number): string {
  const taille = TAILLES.findLast((t) => nbCnam >= t.plancher);
  return taille?.libelle ?? SANS_REMBOURSEMENT;
}

interface Groupe {
  nb_entites: number;
  nb_avec_remboursement: number;
  nb_avec_plateforme: number;
  nb_cnam: number;
  nb_cnam_couvert: number; // remboursement des entités qui ont des trajets plateforme
  nb_plateforme: number;
}

function groupeVide(): Groupe {
  return {
    nb_entites: 0,
    nb_avec_remboursement: 0,
    nb_avec_plateforme: 0,
    nb_cnam: 0,
    nb_cnam_couvert: 0,
    nb_plateforme: 0,
  };
}

function compter(g: Groupe, nbCnam: number, nbPlateforme: number): void {
  g.nb_entites += 1;
  if (nbCnam > 0) g.nb_avec_remboursement += 1;
  if (nbPlateforme > 0) g.nb_avec_plateforme += 1;
  g.nb_cnam += nbCnam;
  if (nbPlateforme > 0) g.nb_cnam_couvert += nbCnam;
  g.nb_plateforme += nbPlateforme;
}

function toRow(annee: string, grain: string, taille: string, g: Groupe): Row {
  return {
    annee,
    grain,
    taille,
    nb_entites: g.nb_entites,
    nb_avec_remboursement: g.nb_avec_remboursement,
    nb_avec_plateforme: g.nb_avec_plateforme,
    part_entites_couvertes: part(g.nb_avec_plateforme, g.nb_entites),
    nb_cnam: g.nb_cnam,
    nb_cnam_couvert: g.nb_cnam_couvert,
    part_cnam_couvert: part(g.nb_cnam_couvert, g.nb_cnam),
    nb_plateforme: g.nb_plateforme,
    ratio: part(g.nb_plateforme, g.nb_cnam),
    ratio_couvert: part(g.nb_plateforme, g.nb_cnam_couvert),
  };
}

function part(numerateur: number, denominateur: number): number | "" {
  return denominateur > 0 ? Number((numerateur / denominateur).toFixed(4)) : "";
}
