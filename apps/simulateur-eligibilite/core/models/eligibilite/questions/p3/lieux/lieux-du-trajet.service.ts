// Les deux lieux du trajet de P3 (Q3.2, Q3.3) : ce que P2 en établit, et la
// catégorie où chacun se reporte (QST-LIEUX-TROIS-CATEGORIES-20261105).
//
// P2 fixe la nature précise d'un lieu par le motif du trajet, ses contextes ou
// Q2.13 (`roles-dans-le-sens.service.ts`). Elle ne se redemande pas : le lieu se
// rappelle, et sa catégorie avec elle. Sinon, P3 ne propose que les catégories
// que P2 et l'autre lieu laissent, et une seule possible se fixe.

import type {
  GivenAnswers,
  ReadByObject,
  Reading,
} from "../../../../../socle/index.ts";
import { RolesDesLieux } from "../../p2/lieux/roles-des-lieux.service.ts";
import { Q2_2_5 } from "../../p2/questions/q2-2-5.question.ts";
import { CATEGORIES, type Categorie } from "./categories-du-lieu.constants.ts";
import { CategoriesDuLieu } from "./categories-du-lieu.service.ts";
import { CotesDeQ26 } from "./cotes-de-q26.service.ts";
import type { Choix, Lieu } from "./lieux-du-trajet.types.ts";
import { RolesDansLeSens } from "./roles-dans-le-sens.service.ts";
import type {
  Entrees,
  Etablie,
  Extremite,
  Nature,
} from "./roles-dans-le-sens.types.ts";

/** P2 ne fixe pas la nature du lieu. */
type NonEtablie = undefined;

/** Rien ne prouve la nature précise du lieu. */
type NonProuvee = undefined;

export class LieuxDuTrajet {
  /**
   * Ce qu'on sait d'un lieu avant d'en choisir la catégorie. L'arrivée lit
   * celle du départ : deux domiciles ne font pas un trajet, et l'USLD ou l'EHPAD
   * de Q2.6 va là où le départ ne l'a pas mise.
   */
  static lieuDu(
    extremite: Extremite,
    entrees: Entrees,
    depart?: Categorie,
  ): Lieu {
    const etablie = natureEtablie(extremite, entrees);
    const nature =
      etablie?.nature ??
      CotesDeQ26.natureDeQ26Au(extremite, entrees, { categories: { depart } });
    if (nature !== undefined) {
      const categorie = CategoriesDuLieu.categorieDe(nature);
      return { etablie, nature, categories: [categorie], fixee: categorie };
    }
    const categories = categoriesPossibles(extremite, entrees, depart);
    const [seule] = categories;
    return {
      etablie,
      categories,
      fixee: categories.length === 1 ? seule : undefined,
    };
  }

  /** Cette nature précise, telle que l'endroit la lit. */
  static natureDuLieuChoisi(
    extremite: Extremite,
    choix: Reading<Choix>,
  ): Reading<Nature | undefined> {
    return RolesDansLeSens.ENTREES_DES_LIEUX.computeWith(choix, (entrees, lu) =>
      natureDuLieu(extremite, entrees, lu),
    );
  }

  /**
   * Q2.6 cite une USLD ou un EHPAD que les lieux ne peuvent pas être : le trajet
   * se corrige (`contraintes-lieux.mjs`).
   */
  static lieuxContrairesAQ26(entrees: Entrees): boolean {
    return (
      RolesDesLieux.naturesDeQ26(entrees).length > 0 &&
      CotesDeQ26.repartitions(entrees, {}).length === 0
    );
  }

  /** Q2.2.5 situe-t-elle ce lieu à l'étranger ? Q3.2 et Q3.3 ne le découvrent pas. */
  static aLEtranger(
    extremite: Extremite,
    reponses: GivenAnswers<ReadByObject>,
  ): boolean {
    const lieu = extremite === "depart" ? "1_DEPART" : "2_ARRIVEE";
    return reponses.question(Q2_2_5).checked(lieu);
  }
}

// ---- implémentation ----

/** La nature que P2 établit pour ce lieu. */
function natureEtablie(
  extremite: Extremite,
  entrees: Entrees,
): Etablie | NonEtablie {
  return RolesDansLeSens.lieuxEtablis(entrees)[extremite];
}

/**
 * La nature précise du lieu, une fois les catégories choisies et le côté de
 * Q2.6 répondu. Une catégorie seule n'en prouve aucune.
 */
function natureDuLieu(
  extremite: Extremite,
  entrees: Entrees,
  choix: Choix,
): Nature | NonProuvee {
  return (
    natureEtablie(extremite, entrees)?.nature ??
    CotesDeQ26.natureDeQ26Au(extremite, entrees, choix)
  );
}

// Les catégories que P2 permet, sauf un second domicile, et sauf celles où
// l'USLD ou l'EHPAD de Q2.6 n'aurait plus de place.
function categoriesPossibles(
  extremite: Extremite,
  entrees: Entrees,
  depart: Categorie | undefined,
): Categorie[] {
  const autre =
    extremite === "arrivee"
      ? depart
      : LieuxDuTrajet.lieuDu("arrivee", entrees).fixee;
  const permises = RolesDansLeSens.naturesPermises(extremite, entrees).map(
    CategoriesDuLieu.categorieDe,
  );
  return (Object.keys(CATEGORIES) as Categorie[]).filter(
    (categorie) =>
      permises.includes(categorie) &&
      !(categorie === "1_DOMICILE" && autre === "1_DOMICILE") &&
      CotesDeQ26.repartitions(entrees, {
        categories: { depart, [extremite]: categorie },
      }).length > 0,
  );
}
