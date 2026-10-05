// Mart « taux par plateforme » : une ligne par plateforme et par année, pour comparer les
// plateformes entre elles. Hors Article 80, au grain établissement (finess juridique).
//
// Deux taux, qui ne répondent pas à la même question :
//   taux_national       = trajets de la plateforme / tout le remboursement national
//                         → ce que pèse la plateforme ;
//   taux_etablissements = trajets de la plateforme / remboursement des seuls
//                         établissements où elle déclare des trajets
//                         → le recours là où elle est présente.
// La distribution (`ratio_q1`, `ratio_mediane`, `ratio_q3`) est celle du ratio établissement
// par établissement : elle dit si le taux vient de quelques gros ou d'un usage répandu.
//
// Un trajet sans finess juridique n'est rattachable à aucun établissement : il sort du
// numérateur et se compte à part, dans `nb_plateforme_sans_finess`.

import { join } from "node:path";
import type { TrajetReconcilieRow } from "../contrats.ts";
import { Csv } from "../csv.ts";
import { Paths } from "../paths.ts";

export class MartTauxPlateforme {
  readonly #annees: string[];

  constructor(annees: string[]) {
    this.#annees = annees;
  }

  execute(trajets: TrajetReconcilieRow[]): void {
    const rows = this.calculer(trajets);
    Csv.write(join(Paths.MARTS, "mart_taux_plateforme.csv"), rows);
    console.log(
      `marts taux_plateforme : ${rows.length} lignes (une par plateforme et par année)`,
    );
  }

  /** Le calcul pur (sans écriture), pour le test comme pour `execute`. */
  calculer(trajets: TrajetReconcilieRow[]): Row[] {
    return this.#annees.flatMap((annee) => {
      const accu = this.#agreger(trajets, annee);
      return [...accu.plateformes.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([nom, p]) => this.#toRow(nom, annee, p, accu));
    });
  }

  #agreger(trajets: TrajetReconcilieRow[], annee: string): Accu {
    const accu: Accu = {
      national: 0,
      reference: new Map(),
      plateformes: new Map(),
    };
    for (const t of trajets) {
      if (t.enveloppe !== "Hors Article 80" || t.annee !== annee) continue;
      const nb = Number(t.nb_trajets);
      if (t.role === "referentiel-national") {
        accu.national += nb;
        ajouter(accu.reference, t.finess_juridique, nb);
      } else if (t.role === "plateforme" && nb > 0)
        this.#ajouterPlateforme(accu, t, nb);
    }
    return accu;
  }

  #ajouterPlateforme(accu: Accu, t: TrajetReconcilieRow, nb: number): void {
    const nom = t.plateforme || t.source;
    const p = accu.plateformes.get(nom) ?? {
      sansFiness: 0,
      parFiness: new Map(),
    };
    accu.plateformes.set(nom, p);
    if (t.finess_juridique) ajouter(p.parFiness, t.finess_juridique, nb);
    else p.sansFiness += nb;
  }

  #toRow(plateforme: string, annee: string, p: Plateforme, accu: Accu): Row {
    const etablissements = [...p.parFiness.entries()].map(([finess, nb]) => ({
      nb,
      reference: accu.reference.get(finess) ?? 0,
    }));
    const nb = somme(etablissements.map((e) => e.nb));
    const reference = somme(etablissements.map((e) => e.reference));
    const ratios = etablissements
      .filter((e) => e.reference > 0)
      .map((e) => e.nb / e.reference);
    return {
      plateforme,
      annee,
      nb_etablissements: etablissements.length,
      nb_plateforme: nb,
      nb_plateforme_sans_finess: p.sansFiness,
      nb_cnam_etablissements: reference,
      taux_etablissements: taux(nb, reference),
      nb_cnam_national: accu.national,
      taux_national: taux(nb, accu.national),
      ratio_q1: quantile(ratios, 0.25),
      ratio_mediane: quantile(ratios, 0.5),
      ratio_q3: quantile(ratios, 0.75),
    };
  }
}

// ---- implémentation ----

type Row = Record<string, string | number>;

interface Plateforme {
  sansFiness: number; // trajets sans finess juridique, hors du numérateur
  parFiness: Map<string, number>; // finess juridique → trajets de la plateforme
}

interface Accu {
  national: number; // tout le remboursement de l'année
  reference: Map<string, number>; // finess juridique → remboursement
  plateformes: Map<string, Plateforme>;
}

function ajouter(map: Map<string, number>, cle: string, nb: number): void {
  map.set(cle, (map.get(cle) ?? 0) + nb);
}

function somme(valeurs: number[]): number {
  return valeurs.reduce((total, v) => total + v, 0);
}

function taux(numerateur: number, denominateur: number): number | "" {
  return denominateur > 0 ? arrondir(numerateur / denominateur) : "";
}

function arrondir(valeur: number): number {
  return Number(valeur.toFixed(4));
}

// Quantile par interpolation linéaire entre les deux rangs voisins, la définition usuelle
// des tableurs. Vide s'il n'y a aucune valeur.
function quantile(valeurs: number[], p: number): number | "" {
  if (valeurs.length === 0) return "";
  const tri = [...valeurs].sort((a, b) => a - b);
  const rang = (tri.length - 1) * p;
  const bas = Math.floor(rang);
  const haut = Math.ceil(rang);
  return arrondir(tri[bas]! + (tri[haut]! - tri[bas]!) * (rang - bas));
}
