// Rollup annuel générique : réduit un **mart de ratio** à une seule année. Chaque clé du
// mart source y sort une ligne par véhicule, plus une ligne « Tous transports » qui les
// somme (cf. `vehicules.ts`) :
//   nb_plateforme = Σ trajets remontés par les plateformes (numérateur),
//   nb_cnam       = Σ trajets remboursés par la CNAM / référentiel national (dénominateur),
//   ratio         = nb_plateforme / nb_cnam, jamais plafonné.
// But : révéler d'un coup d'œil le **taux réel de recours aux plateformes**, par GHT ou par
// établissement selon la configuration. Toute entité connue y figure, avec ou sans trajet
// plateforme, avec ou sans remboursement : celles de l'`univers` fourni par l'appelant, et
// celles que le mart de ratio porte sur une autre année.
//
// Dérivé du mart de ratio écrit juste avant (pas des trajets réconciliés) : c'est une simple
// agrégation du livrable existant, ce qui garantit que les deux racontent la même chose.
//
// La clé et les colonnes d'identité sont fournies par l'appelant, comme pour `MartRatio` :
// la règle du ratio, celle du NULL et celle de l'alerte ne s'écrivent ainsi qu'une fois.

import { join } from "node:path";
import { Csv } from "../csv.ts";
import { Paths } from "../paths.ts";
import { joindrePlateformes, separerPlateformes } from "./plateformes.ts";
import { TOUS_TRANSPORTS, VEHICULES } from "./vehicules.ts";

// Les années du référentiel national : hors de cette fenêtre le ratio serait vide partout
// (cf. spec/points-attention-metier.md, point 4). Un rollup sort par grain et par année.
export const ANNEES_ROLLUP = ["2024", "2025"];

export interface MartRollupAnnuelConfig {
  annee: string; // seule année retenue
  source: string; // mart de ratio lu dans build/marts/
  fichier: string; // nom du CSV produit dans build/marts/
  log: string; // libellé affiché
  cle: (r: Ligne) => string; // valeur de clé, "" pour ignorer la ligne
  identite: (r: Ligne) => Row; // colonnes d'identité, reprises de la 1re ligne rencontrée
  univers: () => Map<string, Row>; // toutes les entités connues : clé → colonnes d'identité
}

export class MartRollupAnnuel {
  readonly #config: MartRollupAnnuelConfig;

  constructor(config: MartRollupAnnuelConfig) {
    this.#config = config;
  }

  execute(): void {
    const rows = this.calculer(
      Csv.read(join(Paths.MARTS, this.#config.source)),
      this.#config.univers(),
    );
    Csv.write(join(Paths.MARTS, this.#config.fichier), rows);
    this.#report(rows);
  }

  /** Le calcul pur (sans I/O), pour le test comme pour `execute`. */
  calculer(martRatio: Ligne[], univers = new Map<string, Row>()): Row[] {
    const parCle = new Map<string, Accu>();
    for (const [cle, identite] of univers) parCle.set(cle, accuVide(identite));
    for (const r of martRatio) this.#accumuler(parCle, r);
    return [...parCle.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .flatMap(([, accu]) => this.#toRows(accu));
  }

  #accumuler(parCle: Map<string, Accu>, r: Ligne): void {
    const cle = this.#config.cle(r);
    if (!cle) return;
    const accu = this.#accu(parCle, cle, r);
    if (r.annee !== this.#config.annee) return;
    for (const vehicule of [r.vehicule ?? "", TOUS_TRANSPORTS]) {
      const mesure = this.#mesure(accu, vehicule);
      mesure.nb_plateforme += Number(r.nb_plateforme) || 0;
      mesure.nb_cnam += Number(r.nb_reference) || 0;
      for (const nom of separerPlateformes(r.plateforme ?? ""))
        mesure.plateformes.add(nom);
    }
  }

  #accu(parCle: Map<string, Accu>, cle: string, r: Ligne): Accu {
    const connu = parCle.get(cle);
    if (connu) return connu;
    const accu = accuVide(this.#config.identite(r));
    parCle.set(cle, accu);
    return accu;
  }

  #mesure(accu: Accu, vehicule: string): Mesure {
    const connue = accu.parVehicule.get(vehicule);
    if (connue) return connue;
    const mesure = mesureVide();
    accu.parVehicule.set(vehicule, mesure);
    return mesure;
  }

  #toRows(accu: Accu): Row[] {
    return [...accu.parVehicule.entries()].map(([vehicule, mesure]) => {
      const ratio =
        mesure.nb_cnam > 0
          ? Number((mesure.nb_plateforme / mesure.nb_cnam).toFixed(4))
          : "";
      return {
        ...accu.identite,
        annee: this.#config.annee,
        vehicule,
        plateforme: joindrePlateformes(mesure.plateformes),
        nb_plateforme: mesure.nb_plateforme,
        nb_cnam: mesure.nb_cnam,
        ratio,
        alerte_qualite: typeof ratio === "number" && ratio > 1 ? "ratio>1" : "",
      };
    });
  }

  #report(rows: Row[]): void {
    const anomalies = rows.filter((r) => r.alerte_qualite === "ratio>1").length;
    const entites = rows.filter((r) => r.vehicule === TOUS_TRANSPORTS);
    const couvertes = entites.filter((r) => Number(r.nb_plateforme) > 0).length;
    console.log(
      `marts ${this.#config.log.padEnd(15)}: ${rows.length} lignes (année ${this.#config.annee}, ${entites.length} entités dont ${couvertes} avec trajets plateforme, ${anomalies} ratio>1)`,
    );
  }
}

// ---- implémentation ----

type Row = Record<string, string | number>;

/** Ligne d'un mart de ratio relue depuis son CSV : toutes les valeurs y sont des chaînes. */
type Ligne = Record<string, string>;

interface Accu {
  identite: Row;
  parVehicule: Map<string, Mesure>; // véhicule, ou « Tous transports » → ses volumes
}

interface Mesure {
  nb_plateforme: number;
  nb_cnam: number;
  plateformes: Set<string>;
}

// Le rollup liste toute entité connue, qu'elle ait ou non un volume dans l'année, et lui
// donne toujours les mêmes lignes véhicule : un tableau croisé n'a ainsi aucun trou. Sans
// trajet plateforme le ratio vaut 0, sans remboursement il reste vide.
function accuVide(identite: Row): Accu {
  const vehicules = [...VEHICULES, TOUS_TRANSPORTS];
  return {
    identite,
    parVehicule: new Map(vehicules.map((v) => [v, mesureVide()])),
  };
}

function mesureVide(): Mesure {
  return { nb_plateforme: 0, nb_cnam: 0, plateformes: new Set() };
}
