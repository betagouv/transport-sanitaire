// Ce que plusieurs faits lisent : les réponses qui reviennent d'un fait à
// l'autre, et les règles qu'ils partagent mot pour mot. Chaque fait écrit ses règles
// dans son fichier : seul ce qui s'y lirait à l'identique se nomme ici.
//
// Un fait lit les questions validées et les autres faits. Il ne lit ni cible
// ni jour : `given` ne les offre pas au typage, et le catalogue s'y arrête net.

import { givenOf, uneRegle } from "../../../socle/index.ts";
import type { Questions } from "../questions/reponses.ts";
import type { Faits } from "./noms.ts";

/** Les entrées d'un fait : `given.question("Q2.5").answer()`, `given.fait(nom)`. */
export const given = givenOf<Questions, Faits>();

/**
 * Un séjour en établissement de santé : « déjà hospitalisé » coché, et le
 * cadre le dit, ou une sortie d'établissement (Q2.1.g) le donne (TS1014-B01).
 */
export const UN_SEJOUR_EN_ETABLISSEMENT = given
  .question("Q2.2.1")
  .answer()
  .checked("1_HOSPITALISATION")
  .and(
    given
      .question("Q2.2.1.cadre")
      .answer()
      .is("1_ETABLISSEMENT")
      .or(given.question("Q2.1.g").answer().is("2_SORTIE")),
  );

/** « Déjà hospitalisé » coché, en Hospitalisation à Domicile (TS1014-B01). */
export const UN_SEJOUR_EN_HAD = given
  .question("Q2.2.1")
  .answer()
  .checked("1_HOSPITALISATION")
  .and(given.question("Q2.2.1.cadre").answer().is("2_HAD"));

/**
 * Le départ d'une entrée en établissement (Q2.13) : le domicile, un
 * hébergement non médicalisé ou un établissement pénitentiaire. Elle est hors
 * du champ du I de D.162-17 : ni transfert, ni Centre 15.
 */
export const UNE_ENTREE_SIMPLE = given
  .question("Q2.13.depart")
  .answer()
  .isOneOf(
    "1_DOMICILE",
    "5_HEBERGEMENT_NON_MEDICALISE",
    "6_ETABLISSEMENT_PENITENTIAIRE",
  );

/**
 * Q1.3 est validée sans séance qualifiante : ni chimiothérapie, ni
 * radiothérapie, ni hémodialyse confirmée par Q1.3.a.
 */
const SANS_SEANCE = given
  .question("Q1.3")
  .answer()
  .isPresent()
  .and(given.question("Q1.3").answer().checked("3_CHIMIOTHERAPIE").not())
  .and(given.question("Q1.3").answer().checked("4_RADIOTHERAPIE").not())
  .and(given.question("Q1.3.a").answer().is("1_OUI").not());

/**
 * Ni séance qualifiante en P1, ni séjour en Q2.1 : Q2.1 dit un autre motif
 * qu'une hospitalisation, ou une admission en HAD, qui n'est pas un séjour
 * (`negation_precise_v1002` de `fait_situation_soins_qualifiante`).
 */
export const SANS_SEANCE_NI_SEJOUR = given
  .question("Q2.1")
  .answer()
  .isPresent()
  .and(SANS_SEANCE)
  .and(
    given
      .question("Q2.1")
      .answer()
      .is("8_HOSPITALISATION")
      .not()
      .or(given.question("Q2.1.g").answer().is("3_ADMISSION_HAD")),
  );

/**
 * Une sortie d'hospitalisation (Q2.1.g), hors permission, vers la prison
 * (TS1012-04) : elle est définitive. Elle exclut le transfert, le Centre 15 et
 * la permission.
 */
export const UNE_SORTIE_VERS_LA_PRISON = uneRegle().nonSi(
  given
    .question("Q2.2.1")
    .answer()
    .checked("10_RETOUR_PENITENTIAIRE")
    .and(given.question("Q2.1.g").answer().is("2_SORTIE"))
    .and(given.question("Q2.2.1.a").answer().is("1_OUI").not()),
  "Sortie définitive vers la prison.",
);

/**
 * La question qui pose une permission a écarté l'option 9 de Q2.1 (choix
 * unique), ou l'option 2 de Q2.2.1.a. Q2.5 ne se pose pas alors ; si elle est
 * validée, elle décide.
 */
export const UNE_PERMISSION_ECARTE_LE_TRANSFERT = uneRegle().nonSi(
  given
    .question("Q2.5")
    .answer()
    .isValidated()
    .not()
    .and(
      given
        .question("Q2.1")
        .answer()
        .is("11_PERMISSION")
        .or(given.question("Q2.2.1.a").answer().is("1_OUI")),
    ),
  "Une permission n'est ni un transfert ni un déplacement pour soins.",
);

/**
 * « Déjà hospitalisé » s'est proposé, et n'est pas coché : il exclut le
 * transfert, le Centre 15 et la permission.
 */
export const UN_SEJOUR_ECARTE = uneRegle().nonSiEcartee(
  given.question("Q2.2.1").answer(),
  "1_HOSPITALISATION",
  "« déjà hospitalisé » proposé, non coché.",
);

/** Ni Q2.3.4 ni Q2.12 n'ont de réponse. */
export const URGENCE_EN_ATTENTE =
  "Ni Q2.3.4 ni Q2.12 n'ont de réponse : elles attendent, ou leur garde les écarte.";
