// Q3.8 : la maternité, dernière de P3. Ce que la DAP d'un Engagement
// maternité reporte dans ses éléments médicaux, et que le trajet ne dit pas
// (`CONTRAT_Q38_MATERNITE_DOCUMENT.json`, D-251).
//
// Aucune situation de P2 ne fait de la maternité le départ ou l'arrivée : son
// nom et son adresse se demandent toujours. Un hébergement du dispositif qui
// est déjà l'un des deux lieux garde ceux de Q3.2 ou Q3.3, où son nom devient
// obligatoire (`lieu.ts`, TS1016-05).

import { question } from "../../question.ts";
import {
  unEngagementMaternite,
  unHebergementDuDispositif,
} from "../conditions/engagement-maternite.ts";
import { natureDu } from "../conditions/lieux-du-trajet.ts";
import { Q3_2 } from "./q3-2.ts";
import { Q3_3 } from "./q3-3.ts";

const unLieuHeberge = natureDu("depart", Q3_2.nature).computeWith(
  natureDu("arrivee", Q3_3.nature),
  (depart, arrivee) =>
    [depart, arrivee].includes("5_HEBERGEMENT_NON_MEDICALISE"),
);

// Q2.14 dit le déplacement lié à l'hébergement du dispositif, que ni le
// départ ni l'arrivée ne sont.
const unHebergementDistinct = unHebergementDuDispositif.and(
  unLieuHeberge.not(),
);

export const Q3_8_MATERNITE_NOM = question
  .text("Q3.8.maternite.nom", "Nom de la maternité")
  .mattersWhile(unEngagementMaternite);

export const Q3_8_MATERNITE_ADRESSE = question
  .address("Q3.8.maternite.adresse", "Adresse de la maternité")
  .mattersWhile(unEngagementMaternite);

export const Q3_8_NIVEAU = question
  .singleChoice(
    "Q3.8.niveau",
    "Quel niveau de maternité est requis pour cette patiente ?",
  )
  // Le niveau de `CONTRAT_Q38_MATERNITE_DOCUMENT.json`.
  .options({
    "1_TYPE_I":
      "Type I — soins obstétricaux et accueil du nouveau-né sans unité de néonatologie.",
    "2_TYPE_IIA": "Type IIA — unité de néonatologie.",
    "3_TYPE_IIB": "Type IIB — néonatologie avec soins intensifs.",
    "4_TYPE_III": "Type III — réanimation néonatale.",
  })
  .mattersWhile(unEngagementMaternite);

export const Q3_8_HEBERGEMENT_NOM = question
  .text("Q3.8.hebergement.nom", "Nom de l’hébergement")
  .mattersWhile(unHebergementDistinct);

export const Q3_8_HEBERGEMENT_ADRESSE = question
  .address("Q3.8.hebergement.adresse", "Adresse de l’hébergement")
  .mattersWhile(unHebergementDistinct);
