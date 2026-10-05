// Étape 4 — marts : applique les règles de calcul et produit les livrables. Le calcul ne
// connaît que des rôles ; chaque mart n'est qu'un choix de **grain** sur les trajets
// réconciliés (build/reconcile/trajets.csv), habillé par une dimension d'identité.
//
// `pnpm marts --cible <nom>` recalcule les mêmes livrables pour une cible, restreints à
// ses plateformes et aux entités qu'elles couvrent, dans `build/cibles/<nom>/marts/`.
//
// Dix-sept livrables (cf. spec/points-attention-metier.md pour les spécificités) :
//   - mart_geographique    — grain finess géographique (le plus fin ; beaucoup de part NULL) ;
//   - mart_juridique       — grain finess juridique (autorité référentiel) ;
//   - mart_ght             — grain GHT (le plus propre ; établissements publics only) ;
//   - mart_hors_ght        — grain finess juridique, restreint aux établissements sans GHT ;
//   - mart_article80       — volumes + part par plateforme (pas de dénominateur national) ;
//   - mart_ght_<année>        — rollup du mart GHT : ratio annuel plateforme/CNAM par GHT ;
//   - mart_juridique_<année>  — le même rollup par établissement, tous transports confondus.
// Les deux rollups sortent pour chaque année de `ANNEES_ROLLUP`.
//   - mart_juridique_plateforme, mart_ght_plateforme — le détail **par plateforme** des
//     marts juridique et GHT, une ligne par plateforme ; suffixés de l'année, le même
//     détail pour les rollups ;
//   - mart_taux_plateforme — une ligne par plateforme et par année : ses deux taux et la
//     distribution du ratio chez ses établissements ;
//   - mart_synthese — par année, grain et classe de taille : combien d'entités, combien
//     de couvertes, et ce qu'elles pèsent.

import { join } from "node:path";
import { lireArguments } from "../cible.ts";
import type { TrajetReconcilieRow } from "../contrats.ts";
import { Csv } from "../csv.ts";
import { Mapping } from "../mapping.ts";
import { Paths } from "../paths.ts";
import { Dimensions, utilisable } from "./dimensions.ts";
import { MartArticle80 } from "./mart-article80.ts";
import { MartPlateforme } from "./mart-plateforme.ts";
import { MartRatio, type MartRatioConfig } from "./mart-ratio.ts";
import { ANNEES_ROLLUP, MartRollupAnnuel } from "./mart-rollup-annuel.ts";
import { MartSynthese } from "./mart-synthese.ts";
import { MartTauxPlateforme } from "./mart-taux-plateforme.ts";
import { restreindre, restriction } from "./perimetre.ts";

export class Marts {
  readonly #cible: string; // "" pour le périmètre complet (cf. cible.ts)
  #dimensions!: Dimensions; // chargées à l'exécution, après `reconcile`

  #restriction: Set<string> | undefined; // les plateformes d'une cible restreinte

  constructor(cible = "") {
    this.#cible = cible;
  }

  execute(): void {
    Paths.viserCible(this.#cible);
    this.#restriction = restriction(Mapping.load(), this.#cible);
    this.#dimensions = new Dimensions();
    const trajets = this.#loadTrajets();
    this.#martsRatio().forEach((mart) => {
      mart.execute(trajets);
    });
    this.#martsPlateforme().forEach((mart) => {
      mart.execute(trajets);
    });
    new MartTauxPlateforme(ANNEES_ROLLUP).execute(trajets);
    new MartArticle80(
      (cle) => this.#dimensions.juridique.get(cle)?.nom ?? "",
      (cle) => this.#dimensions.ght.get(cle)?.ght_libelle ?? "",
    ).execute(trajets);
    // Rollups dérivés des marts de ratio écrits ci-dessus, donc après eux.
    ANNEES_ROLLUP.flatMap((annee) => this.#rollups(annee)).forEach((rollup) => {
      rollup.execute();
    });
    // La synthèse compte les entités des rollups, donc après eux.
    new MartSynthese(ANNEES_ROLLUP).execute();
  }

  #rollups(annee: string): MartRollupAnnuel[] {
    const d = this.#dimensions;
    return [
      new MartRollupAnnuel({
        annee,
        source: "mart_ght.csv",
        fichier: `mart_ght_${annee}.csv`,
        log: `ght_${annee}`,
        cle: (r) => r.ght_code ?? "",
        identite: (r) => ({
          ght_code: r.ght_code ?? "",
          region: r.region ?? "",
          ght_libelle: r.ght_libelle ?? "",
        }),
        univers: () => this.#univers(d.ght, (c) => d.identiteGht(c)),
      }),
      new MartRollupAnnuel({
        annee,
        source: "mart_juridique.csv",
        fichier: `mart_juridique_${annee}.csv`,
        log: `juridique_${annee}`,
        cle: (r) => r.finess_juridique ?? "",
        identite: (r) => ({
          finess_juridique: r.finess_juridique ?? "",
          nom: r.nom ?? "",
          ville: r.ville ?? "",
          departement: r.departement ?? "",
        }),
        univers: () =>
          this.#univers(d.juridique, (c) => d.identiteJuridique(c)),
      }),
    ];
  }

  // Une cible restreinte ne liste que les entités que ses plateformes couvrent : son
  // univers est vide, et le rollup s'en tient aux clés de son mart de ratio.
  #univers(
    dimension: Map<string, unknown>,
    identite: (cle: string) => Row,
  ): Map<string, Row> {
    if (this.#restriction) return new Map();
    return new Map([...dimension.keys()].map((cle) => [cle, identite(cle)]));
  }

  // Le détail par plateforme, aux grains établissement et GHT : par véhicule d'abord, puis
  // en forme annuelle pour chaque année des rollups.
  #martsPlateforme(): MartPlateforme[] {
    return [undefined, ...ANNEES_ROLLUP].flatMap((annee) => {
      const suffixe = annee ? `_${annee}` : "";
      return [
        new MartPlateforme({
          annee,
          fichier: `mart_juridique_plateforme${suffixe}.csv`,
          log: `juridique_plateforme${suffixe}`,
          grain: (t) => t.finess_juridique,
          identite: (cle) => this.#dimensions.identiteJuridique(cle),
        }),
        new MartPlateforme({
          annee,
          fichier: `mart_ght_plateforme${suffixe}.csv`,
          log: `ght_plateforme${suffixe}`,
          grain: (t) => t.ght_code,
          identite: (cle) => this.#dimensions.identiteGht(cle),
        }),
      ];
    });
  }

  #martsRatio(): MartRatio[] {
    const configs: MartRatioConfig[] = [
      {
        fichier: "mart_geographique.csv",
        log: "geographique",
        grain: (t) =>
          utilisable(t.finess_geographique) ? t.finess_geographique : "",
        identite: (cle) => this.#dimensions.identiteGeo(cle),
      },
      {
        fichier: "mart_juridique.csv",
        log: "juridique",
        grain: (t) => t.finess_juridique,
        identite: (cle) => this.#dimensions.identiteJuridique(cle),
      },
      {
        fichier: "mart_ght.csv",
        log: "ght",
        grain: (t) => t.ght_code,
        identite: (cle) => this.#dimensions.identiteGht(cle),
      },
      {
        fichier: "mart_hors_ght.csv",
        log: "hors_ght",
        grain: (t) => (t.ght_code ? "" : t.finess_juridique),
        identite: (cle) => this.#dimensions.identiteJuridique(cle),
      },
    ];
    return configs.map(
      (c) =>
        new MartRatio({ ...c, seulementCouvertes: Boolean(this.#restriction) }),
    );
  }

  #loadTrajets(): TrajetReconcilieRow[] {
    const trajets = this.#readTrajets();
    return this.#restriction
      ? restreindre(trajets, this.#restriction)
      : trajets;
  }

  #readTrajets(): TrajetReconcilieRow[] {
    return Csv.read(join(Paths.RECONCILE, "trajets.csv")).map(
      (raw) =>
        ({
          ...raw,
          nb_trajets: Number(raw.nb_trajets),
        }) as unknown as TrajetReconcilieRow,
    );
  }
}

if (import.meta.url === `file://${process.argv[1]}`)
  new Marts(lireArguments(process.argv.slice(2)).cible).execute();

// ---- implémentation ----

type Row = Record<string, string | number>;
