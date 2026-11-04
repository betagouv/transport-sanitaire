// La page de branche, dernière de P2 : ce que Q2.13 et Q2.14 lisent toutes
// deux. Leurs faits vivent sous `faits/`.
//
// Une question de branche ne se pose que si sa réponse peut changer l'issue.
// L'éditeur ne donne pas de variable de décisivité pour Q2.13 ni pour Q2.14 :
// la condition est la plus étroite que ses règles permettent. Elle lit les faits
// des questions posées avant elle.

import { given } from "../../question.ts";

/**
 * Le trajet a quelque chose à décider, une fois les questions précédentes
 * posées : le mode se tient, et aucune orientation prioritaire n'est établie,
 * ni l'exclusion du transport, ni un transfert, une permission à charge du
 * patient, une pension ou un point à la caisse.
 */
export const brancheDecisive = given
  .cible("cible_mode_coherent")
  .isOui()
  .and(
    given.cible("cible_orientation_sans_urgence_deja_etablie").isOui().not(),
  );
