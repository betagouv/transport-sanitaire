// La page de la maternité (Q3.8), dernière de P3 : ce que la DAP d'un
// Engagement maternité reporte dans ses éléments médicaux, et que le trajet ne
// dit pas (`CONTRAT_Q38_MATERNITE_DOCUMENT.json`, D-251).
//
// Aucune situation de P2 ne fait de la maternité le départ ou l'arrivée : son
// nom et son adresse se demandent toujours. Un hébergement du dispositif qui
// est déjà l'un des deux lieux garde ceux de Q3.2 ou Q3.3.

import { page } from "../../../socle/index.ts";
import { given, question } from "../question.ts";
import { natureDu } from "./lieux-du-trajet.ts";
import { uneDap } from "./supports-du-complement.ts";

/** La DAP coche le motif Engagement maternité. */
const unEngagementMaternite = uneDap.and(
  given.cible("cible_dap_motif_engagement_maternite").isOui(),
);

const unLieuHeberge = natureDu("depart").computeWith(
  natureDu("arrivee"),
  (depart, arrivee) =>
    [depart, arrivee].includes("5_HEBERGEMENT_NON_MEDICALISE"),
);

// Q2.14 dit le déplacement lié à l'hébergement du dispositif, que ni le
// départ ni l'arrivée ne sont.
const unHebergementDistinct = unEngagementMaternite
  .and(
    given.question("Q2.14.motif").answer().checked("2_HEBERGEMENT_ENGAGEMENT"),
  )
  .and(unLieuHeberge.not());

export const PAGE_DE_LA_MATERNITE = page(
  "P3/maternite",
  question
    .text("Q3.8.maternite.nom", "Nom de la maternité")
    .mattersWhile(unEngagementMaternite),
  question
    .address("Q3.8.maternite.adresse", "Adresse de la maternité")
    .mattersWhile(unEngagementMaternite),
  question
    .singleChoice(
      "Q3.8.niveau",
      "Quel niveau de maternité est requis pour cette patiente ?",
    )
    .mattersWhile(unEngagementMaternite),
  question
    .text("Q3.8.hebergement.nom", "Nom de l’hébergement")
    .mattersWhile(unHebergementDistinct),
  question
    .address("Q3.8.hebergement.adresse", "Adresse de l’hébergement")
    .mattersWhile(unHebergementDistinct),
);
