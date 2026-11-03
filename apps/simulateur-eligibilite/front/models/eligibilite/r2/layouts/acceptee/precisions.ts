// Les précisions de la fiche positive (D-111) : le séjour ou les séances,
// l'AT-MP. Elles ne se lisent que sous les issues acceptées (D-224).

import type { Value } from "../../../../../../core/socle";
import {
  cle,
  type Entrees,
  lues,
  type NonProuve,
  type Precisions,
} from "../../components/precisions";

/** Les précisions de la fiche positive : le séjour ou les séances, l'AT-MP. */
export const PRECISIONS_DE_LA_FICHE_POSITIVE: Value<Precisions> = lues(
  "soins",
  "dialyse",
  "memeDeplacement",
  "sejourReel",
  "autreCadre",
).compute((entrees) => ({
  ...cle("hospitalisation", hospitalisation(entrees)),
  ...cle("atmp", atmp(entrees)),
}));

// ---- implémentation ----

// La famille de séances retenues, dans l'ordre du lexique : CH, RA, HE. Une
// hémodialyse demande Q1.3.a. Plusieurs séances demandent que Q2.1.f les dise
// vers le même lieu de soins.
function seancesRetenues({
  soins,
  dialyse,
  memeDeplacement,
}: Pick<Entrees, "soins" | "dialyse" | "memeDeplacement">): readonly string[] {
  const seances = [
    soins.checked("3_CHIMIOTHERAPIE") && "CH",
    soins.checked("4_RADIOTHERAPIE") && "RA",
    soins.checked("5_DIALYSE") && dialyse.is("1_OUI") && "HE",
  ].filter((seance) => seance !== false);
  return seances.length >= 2 && !memeDeplacement.is("1_OUI") ? [] : seances;
}

// L'identifiant du lexique : le séjour ou les séances, puis leurs familles.
function hospitalisation(
  entrees: Pick<
    Entrees,
    "soins" | "dialyse" | "memeDeplacement" | "sejourReel"
  >,
): string | NonProuve {
  const seances = seancesRetenues(entrees);
  if (!entrees.sejourReel && seances.length === 0) return undefined;
  return [entrees.sejourReel ? "H-SEJOUR" : "H-SEANCE", ...seances].join("-");
}

// « Accident du travail ou maladie professionnelle » : Q2.2.1.b ne les
// sépare pas, seul l'identifiant commun est prouvé.
function atmp({ autreCadre }: Pick<Entrees, "autreCadre">): "ATMP" | NonProuve {
  return autreCadre.checked("1_ATMP") ? "ATMP" : undefined;
}
