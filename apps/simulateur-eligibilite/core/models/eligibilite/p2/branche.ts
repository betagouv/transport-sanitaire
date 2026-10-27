// La page de branche, dernière de P2 : quand ses questions se posent (Q2.12,
// Q2.13, Q2.14). Ses faits vivent sous `faits/`.
//
// Une question de branche ne se pose que si sa réponse peut changer l'issue.
// L'éditeur ne donne pas de variable de décisivité pour Q2.13 ni pour Q2.14 :
// la condition est la plus étroite que ses règles permettent. Elle lit les faits
// des questions posées avant elle. Le motif de Q2.14 lit aussi l'éloignement,
// sur la même page.

import { given } from "../question.ts";

// Le trajet a quelque chose à décider, une fois les questions précédentes
// posées : le mode se tient, et aucune orientation prioritaire n'est établie,
// ni l'exclusion du transport, ni un transfert, une permission à charge du
// patient, une pension ou un point à la caisse.
const brancheDecisive = given
  .cible("cible_mode_coherent")
  .isOui()
  .and(
    given.cible("cible_orientation_sans_urgence_deja_etablie").isOui().not(),
  );

/**
 * Q2.13 (le départ) se pose : une entrée en établissement de santé qui laisse
 * `fait_transfert_article80` absent envoie à la caisse. La nature du départ dit
 * si l'entrée est simple.
 */
export const unDepartAPoser = given
  .question("Q2.1.g")
  .answer()
  .is("1_ENTREE")
  .and(given.fait("fait_hospitalisation").isOui())
  .and(given.fait("fait_transfert_article80").isInconnu())
  .and(brancheDecisive);

/**
 * Le groupe de l'éloignement (Q2.14) se pose : Q2.1 dit la maternité, ou
 * Q2.2.1.b la signale.
 */
export const unEloignementAPoser = given
  .question("Q2.1")
  .answer()
  .is("13_MATERNITE")
  .or(given.question("Q2.2.1.b").answer().checked("4_MATERNITE_ELOIGNEE"))
  .and(brancheDecisive);

/**
 * Le groupe du motif (Q2.14) se pose comme l'éloignement, sauf quand celui-ci
 * a déjà écarté le dispositif : le motif ne changerait plus rien.
 */
export const unMotifAPoser = unEloignementAPoser.and(
  given.question("Q2.14.eloignement").answer().checked("3_AUCUNE").not(),
);

/**
 * Q2.12 se pose : c'est la garde de l'éditeur pour l'urgence,
 * `cible_question_urgence_a_afficher`, lue sur tous les faits de P2, ceux de la
 * branche compris. Une condition que la branche vient d'établir (le dispositif
 * maternité) dévoile alors la question que la page du trajet avait masquée.
 * Q2.3.4 validée, l'urgence ne se redemande jamais.
 */
export const uneUrgenceDevoilee = given
  .question("Q2.3.4")
  .answer()
  .compute((urgence) => !urgence.isValidated())
  .and(given.cible("cible_question_urgence_a_afficher").isOui());
