// Q2.3.4 : l'urgence, quand la garde de l'éditeur le dit
// (`cible_question_urgence_a_afficher`), sur les faits des questions posées
// avant elle. Elle a deux places : la page du trajet, puis celle de la branche.
// Une condition que la branche établit (le dispositif maternité)
// la pose là, si le trajet ne l'a pas posée. L'éditeur nomme Q2.12 cette
// reprise de Q2.3 sur la page de branche (`CONTRAT_SAISIES_ET_PAGES.md`).
//
// Elle s'affiche dans le panneau du premier de ses déclencheurs devenu
// effectif (NAV-PANNEAUX-20261116) : une réponse qui contribue à sa garde,
// tant que le motif d'accord préalable qu'elle ouvre tient. La tranche de
// distance porte la longue distance et la série, la case de la ligne régulière
// l'avion ou le bateau, l'éloignement et le motif de Q2.14 le dispositif
// maternité. Le CAMSP ou le CMPP vient de Q2.2.1, sur une autre page : seul ce
// motif, l'urgence se pose à son rang.

import { given, question } from "../../question.ts";
import { Q2_3_1 } from "./q2-3-1.ts";
import { Q2_3_2 } from "./q2-3-2.ts";
import { Q2_14_ELOIGNEMENT, Q2_14_MOTIF } from "./q2-14.ts";

const serie = motif("cible_dap_motif_serie");
const maternite = motif("cible_dap_motif_engagement_maternite");

export const Q2_3_4 = question
  .singleChoice("Q2.3.4", "Attestez-vous que ce transport est urgent ?")
  .possibleAnswers({
    "1_OUI": "Oui.",
    "2_NON": "Non.",
  })
  .mattersWhile(given.cible("cible_question_urgence_a_afficher").isOui())
  .shownUnder(Q2_3_1, "2_PLUS_DE_CINQUANTE_KM", serie)
  .shownUnder(Q2_3_1, "3_PLUS_DE_CENT_CINQUANTE_KM", {
    while: given
      .cible("cible_dap_motif_longue_distance")
      .isOui()
      .or(serie.while),
  })
  .shownUnder(Q2_3_2, motif("cible_dap_motif_avion_bateau"))
  .shownUnder(Q2_14_ELOIGNEMENT, "1_PLUS_DE_QUARANTE_CINQ_MINUTES", maternite)
  .shownUnder(Q2_14_ELOIGNEMENT, "2_COMMUNE_DESIGNEE_PAR_L_ARS", maternite)
  .shownUnder(Q2_14_MOTIF, "2_HEBERGEMENT_ENGAGEMENT", maternite);

// ---- implémentation ----

// Une place qui ne vaut que tant que ce motif d'accord préalable tient.
function motif(cible: Parameters<typeof given.cible>[0]) {
  return { while: given.cible(cible).isOui() };
}
