// Mart « répartition » : combien d'établissements dans chaque tranche de ratio. Il répond à
// « le recours aux plateformes est-il répandu, ou porté par quelques établissements ? ».
// Par année, pour toutes les plateformes réunies puis pour chacune. Hors Article 80, tous
// transports confondus, au grain établissement.
//
// Dérivé du rollup annuel et de son détail par plateforme, dont il ne lit que la ligne
// « Tous transports » : il classe donc exactement leurs ratios.
//
// Un établissement sans aucun trajet plateforme n'est compté que sur la ligne
// « Toutes plateformes ». Le détail d'une plateforme ne liste que ses établissements : pour
// elle, « aucun trajet » n'est pas une tranche.

import { join } from "node:path";
import { Csv } from "../csv.ts";
import { Paths } from "../paths.ts";
import { TOUS_TRANSPORTS } from "./vehicules.ts";

export class MartRepartition {
  readonly #annees: string[];

  constructor(annees: string[]) {
    this.#annees = annees;
  }

  execute(): void {
    const lire = (nom: string) => Csv.read(join(Paths.MARTS, nom));
    const rows = this.#annees.flatMap((annee) =>
      this.calculer(
        annee,
        lire(`mart_juridique_${annee}.csv`),
        lire(`mart_juridique_plateforme_${annee}.csv`),
      ),
    );
    Csv.write(join(Paths.MARTS, "mart_repartition.csv"), rows);
    console.log(
      `marts repartition    : ${rows.length} lignes (par année, plateforme et tranche de ratio)`,
    );
  }

  /** Le calcul pur (sans I/O), pour le test comme pour `execute`. */
  calculer(annee: string, rollup: Ligne[], parPlateforme: Ligne[]): Row[] {
    const groupes = new Map<string, Map<string, Tranche>>();
    for (const r of tousTransports(rollup))
      compter(groupes, TOUTES_PLATEFORMES, r);
    for (const r of tousTransports(parPlateforme))
      compter(groupes, r.plateforme ?? "", r);
    return [...groupes.entries()].flatMap(([plateforme, tranches]) =>
      [...tranches.entries()]
        .filter(
          ([libelle]) => plateforme === TOUTES_PLATEFORMES || libelle !== AUCUN,
        )
        .map(([tranche, t]) => ({ annee, plateforme, tranche, ...t })),
    );
  }
}

// ---- implémentation ----

type Row = Record<string, string | number>;

/** Ligne d'un rollup relue depuis son CSV : toutes les valeurs y sont des chaînes. */
type Ligne = Record<string, string>;

interface Tranche {
  nb_etablissements: number;
  nb_plateforme: number;
  nb_cnam: number;
}

const TOUTES_PLATEFORMES = "Toutes plateformes";

// Tranches de ratio, par plafond exclu. Le numéro en tête de libellé les garde dans l'ordre
// quand un tableur les trie.
const AUCUN = "0. Aucun trajet plateforme";
const PLAFONDS = [
  { plafond: 0.01, libelle: "1. Moins de 1 %" },
  { plafond: 0.05, libelle: "2. 1 à 5 %" },
  { plafond: 0.1, libelle: "3. 5 à 10 %" },
  { plafond: 0.25, libelle: "4. 10 à 25 %" },
  { plafond: 0.5, libelle: "5. 25 à 50 %" },
  { plafond: 1, libelle: "6. 50 à 100 %" },
];
const AU_DELA = "7. Plus de 100 %";
const SANS_REMBOURSEMENT = "8. Sans remboursement";
const LIBELLES = [
  AUCUN,
  ...PLAFONDS.map((p) => p.libelle),
  AU_DELA,
  SANS_REMBOURSEMENT,
];

function tousTransports(lignes: Ligne[]): Ligne[] {
  return lignes.filter((r) => r.vehicule === TOUS_TRANSPORTS);
}

/** `undefined` pour une entité sans aucun volume dans l'année : elle n'a pas de ratio à classer. */
function tranche(nbPlateforme: number, nbCnam: number): string | undefined {
  if (nbPlateforme === 0) return nbCnam > 0 ? AUCUN : undefined;
  if (nbCnam === 0) return SANS_REMBOURSEMENT;
  const ratio = nbPlateforme / nbCnam;
  return PLAFONDS.find((p) => ratio < p.plafond)?.libelle ?? AU_DELA;
}

function compter(
  groupes: Map<string, Map<string, Tranche>>,
  plateforme: string,
  r: Ligne,
): void {
  const nbPlateforme = Number(r.nb_plateforme) || 0;
  const nbCnam = Number(r.nb_cnam) || 0;
  const libelle = tranche(nbPlateforme, nbCnam);
  if (!libelle) return;
  const tranches = groupes.get(plateforme) ?? tranchesVides();
  groupes.set(plateforme, tranches);
  const t = tranches.get(libelle);
  if (!t) return;
  t.nb_etablissements += 1;
  t.nb_plateforme += nbPlateforme;
  t.nb_cnam += nbCnam;
}

// Toutes les tranches sortent, même vides : un graphique garde ainsi le même axe d'une
// plateforme à l'autre.
function tranchesVides(): Map<string, Tranche> {
  return new Map(
    LIBELLES.map((l) => [
      l,
      { nb_etablissements: 0, nb_plateforme: 0, nb_cnam: 0 },
    ]),
  );
}
