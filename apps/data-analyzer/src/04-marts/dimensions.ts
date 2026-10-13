// Les dimensions qui habillent les marts : à une clé (finess géographique, finess juridique,
// code GHT), ses colonnes d'identité. Lues une fois, dans les artefacts d'`extract` et de
// `reconcile` et dans les mappings manuels de `ref/`.

import { existsSync } from "node:fs";
import { join } from "node:path";
import type {
  EtablissementDimensionRow,
  EtablissementRow,
  GhtRattachementRow,
} from "../contrats.ts";
import { Csv } from "../csv.ts";
import { Paths } from "../paths.ts";

export class Dimensions {
  readonly juridique: Map<string, EtablissementDimensionRow>;
  readonly geo: Map<string, EtablissementRow>;
  readonly ght: Map<string, GhtRattachementRow>;

  constructor() {
    this.juridique = new Map(
      this.#readDimension().map((r) => [r.finess_juridique, r]),
    );
    this.geo = this.#geoDimension();
    this.ght = this.#ghtDimension();
  }

  identiteGeo(cle: string): Row {
    const e = this.geo.get(cle);
    return {
      finess_geographique: cle,
      finess_juridique: e?.finess_juridique ?? "",
      nom: e?.nom ?? "",
      ville: e?.ville ?? "",
      departement: e?.departement ?? "",
    };
  }

  identiteJuridique(cle: string): Row {
    const e = this.juridique.get(cle);
    return {
      finess_juridique: cle,
      nom: e?.nom ?? "",
      ville: e?.ville ?? "",
      departement: e?.departement ?? "",
    };
  }

  identiteGht(cle: string): Row {
    const g = this.ght.get(cle);
    return {
      ght_code: cle,
      region: g?.region ?? "",
      ght_libelle: g?.ght_libelle ?? "",
    };
  }

  #readDimension(): EtablissementDimensionRow[] {
    return Csv.read(
      join(Paths.RECONCILE, "etablissements.csv"),
    ) as unknown as EtablissementDimensionRow[];
  }

  // Un site (finess géographique) peut apparaître plusieurs fois : on garde le plus gros volume.
  #geoDimension(): Map<string, EtablissementRow> {
    const map = new Map<string, EtablissementRow>();
    for (const raw of Csv.read(join(Paths.EXTRACT, "etablissements.csv"))) {
      const e = {
        ...raw,
        score: Number(raw.score),
      } as unknown as EtablissementRow;
      const courant = map.get(e.finess_geographique);
      if (
        utilisable(e.finess_geographique) &&
        (!courant || e.score > courant.score)
      )
        map.set(e.finess_geographique, e);
    }
    return map;
  }

  #ghtDimension(): Map<string, GhtRattachementRow> {
    const map = new Map<string, GhtRattachementRow>();
    const path = join(Paths.EXTRACT, "ght.csv");
    if (existsSync(path))
      for (const raw of Csv.read(path)) {
        const g = raw as unknown as GhtRattachementRow;
        if (!map.has(g.ght_code)) map.set(g.ght_code, g);
      }
    this.#completerAvecMappingManuel(map);
    return map;
  }

  // Les mappings manuels peuvent introduire des codes hors référentiel (ex. « AP-HP ») : on
  // les habille avec leur libellé (colonne ght_officiel) pour qu'ils s'affichent proprement.
  #completerAvecMappingManuel(map: Map<string, GhtRattachementRow>): void {
    for (const fichier of [
      "plateforme-ght-mapping.csv",
      "finess-ght-manuel.csv",
    ]) {
      const path = join(Paths.REF, fichier);
      if (!existsSync(path)) continue;
      for (const r of Csv.read(path))
        if (r.ght_code && !map.has(r.ght_code))
          map.set(r.ght_code, {
            ght_code: r.ght_code,
            ght_libelle: r.ght_officiel ?? r.ght_code,
            region: "",
            finess_juridique: "",
            raison_sociale: "",
          });
    }
  }
}

/** Un finess géographique vide ou à zéro ne désigne aucun site. */
export function utilisable(finess: string): boolean {
  return Boolean(finess) && finess !== "0";
}

// ---- implémentation ----

type Row = Record<string, string | number>;
