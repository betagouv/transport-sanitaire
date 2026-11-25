// Le trajet : ses deux lieux et l'aller-retour.
//
// Chaque lieu se reporte dans la rubrique du cerfa de sa catégorie
// (`CONTRAT_LIEUX_CERFA.json`, `projectPlace`). Le domicile est une case. La
// structure de soins et l'autre lieu sont des zones : le lieu s'y écrit en un
// seul texte, et la zone de l'autre catégorie reste vide. Une structure dit
// l'USLD, son nom puis son service ; un autre lieu, sa nature puis son nom.
// L'adresse suit.
//
// L'aller-retour ne se coche que si le retour est le même trajet, adresses
// inversées. Plusieurs permissions du S3141 en sont chacune un.

import type { Reading } from "../../../../socle/index.ts";
import {
  type Categorie,
  HTNM,
  natureEnLettres,
} from "../../questions/p3/conditions/categories-du-lieu.ts";
import {
  type Extremite,
  natureDuLieuChoisi,
} from "../../questions/p3/conditions/lieux-du-trajet.ts";
import { SENS_CHOISI } from "../../questions/p3/conditions/sens-du-trajet.ts";
import { Q3_3 } from "../../questions/p3/questions/q3-3.question.ts";
import { given } from "../../questions/reponses.ts";
import { LieuxDuCerfa } from "./lieux-du-cerfa.service.ts";
import type { Rubrique } from "./rubrique.types.ts";

export type Trajet = {
  readonly depart_domicile: boolean;
  readonly depart_structure?: string;
  readonly depart_autre?: string;
  readonly arrivee_domicile: boolean;
  readonly arrivee_structure?: string;
  readonly arrivee_autre?: string;
  readonly aller_retour: boolean;
};

export const TRAJET: Rubrique<Trajet> = {
  depart_domicile: LieuxDuCerfa.auDomicile("depart"),
  depart_structure: zone("depart", "2_STRUCTURE_DE_SOINS"),
  depart_autre: zone("depart", "3_AUTRE_LIEU"),
  arrivee_domicile: LieuxDuCerfa.auDomicile("arrivee"),
  arrivee_structure: zone("arrivee", "2_STRUCTURE_DE_SOINS"),
  arrivee_autre: zone("arrivee", "3_AUTRE_LIEU"),
  aller_retour: SENS_CHOISI.compute(
    (sens) => sens === "3_ALLER_RETOUR_EQUIVALENT",
  ),
};

// ---- implémentation ----

/** La zone reste vide : le lieu ne s'y reporte pas, ou on n'en sait rien. */
type ZoneVide = undefined;

/** Ce que P3 sait d'un lieu : sa catégorie, sa nature, ses champs. */
type Lieu = ReturnType<typeof lieu> extends Reading<infer Lu> ? Lu : never;

const USLD = "Unité de Soins de Longue Durée (USLD)";

// La nature tient compte des côtés de l'USLD et de l'EHPAD, répondus sur la
// page d'arrivée.
function lieu(extremite: Extremite) {
  const questions = LieuxDuCerfa.QUESTIONS[extremite];
  return given.all({
    categorie: questions.categorieDuLieu,
    nature: natureDuLieuChoisi(extremite, Q3_3.choix),
    htnm: questions.htnm,
    nom: given.question(questions.nom).answer(),
    service: given.question(questions.service).answer(),
    precision: given.question(questions.precision).answer(),
    adresse: given.question(questions.adresse).answer(),
  });
}

// Le lieu écrit dans la zone `cible`, s'il s'y reporte.
function zone(extremite: Extremite, cible: Categorie) {
  return lieu(extremite).compute((lu): string | ZoneVide =>
    lu.categorie === cible ? lieuEnUnTexte(lu) : undefined,
  );
}

// Le lieu en un seul texte, adresse comprise, pays compris à l'étranger. Les
// parties vides ou répétées ne s'écrivent pas.
function lieuEnUnTexte(lu: Lieu): string | ZoneVide {
  const designation =
    lu.categorie === "2_STRUCTURE_DE_SOINS" ? structure(lu) : autreLieu(lu);
  const parties = [
    ...designation,
    ...LieuxDuCerfa.adresseEnParties(lu.adresse.value),
  ]
    .map((partie) => partie?.trim())
    .filter((partie): partie is string => Boolean(partie))
    .filter((partie, rang, toutes) => toutes.indexOf(partie) === rang);
  return parties.length > 0 ? parties.join(", ") : undefined;
}

// Une structure : l'USLD que Q2.6 y place, son nom, son service.
function structure({ nature, nom, service }: Lieu) {
  const usld = nature === "4_USLD";
  const leService =
    service.value && !(usld && service.value.trim() === USLD)
      ? `Service : ${service.value}`
      : undefined;
  return [usld ? USLD : undefined, nom.value, leService];
}

// Un autre lieu : sa nature, le HTNM d'abord, puis la précision saisie, puis
// celle que P2 prouve ; et son nom.
function autreLieu({ htnm, nature, nom, precision }: Lieu) {
  const enLettres = htnm
    ? HTNM
    : precision.value?.trim() || natureEnLettres(nature);
  return [enLettres, nom.value];
}
