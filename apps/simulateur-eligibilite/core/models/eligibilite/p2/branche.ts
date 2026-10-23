// La page de branche, dernière de P2 : quand ses questions se posent (Q2.12,
// Q2.13, Q2.14). Ses faits vivent sous `faits/`.
//
// Une question de branche ne se pose que si sa réponse peut changer l'issue.
// L'éditeur ne donne pas de variable de décisivité pour Q2.13 ni pour Q2.14 :
// la condition est la plus étroite que ses règles permettent. Elle lit les faits
// des questions posées avant elle. Le motif de Q2.14 lit aussi l'éloignement,
// sur la même page.

import type { GivenAnswers, ValidatedAnswers } from "../../../socle/index.ts";
import type { Faits } from "../declarations/faits.ts";
import type { Questions } from "../declarations/questions.ts";
import { cible } from "../evaluation-des-regles.ts";

type Valides = ValidatedAnswers<Questions>;

/** Ce que lit une garde de la branche : les réponses validées, et leurs faits. */
type Lecture = { readonly validated: Valides; readonly faits: Faits };

/**
 * Q2.13 (le départ) se pose-t-elle ? Une entrée en établissement de santé qui
 * laisse `fait_transfert_article80` absent envoie à la caisse : la nature du
 * départ dit si l'entrée est simple.
 */
export function departAPoser({ validated, faits }: Lecture): boolean {
  return (
    validated.question("Q2.1.g").is("1_ENTREE") &&
    faits.fait_hospitalisation.isOui() &&
    faits.fait_transfert_article80.isInconnu() &&
    brancheDecisive(faits)
  );
}

/**
 * Le groupe de l'éloignement (Q2.14) se pose-t-il ? Q2.1 dit la maternité, ou
 * Q2.2.1.b la signale.
 */
export function eloignementAPoser({ validated, faits }: Lecture): boolean {
  const signalee =
    validated.question("Q2.1").is("13_MATERNITE") ||
    validated.question("Q2.2.1.b").checked("4_MATERNITE_ELOIGNEE");
  return signalee && brancheDecisive(faits);
}

/**
 * Le groupe du motif (Q2.14) se pose-t-il ? Comme l'éloignement, sauf quand
 * celui-ci a déjà écarté le dispositif : le motif ne changerait plus rien.
 */
export function motifAPoser(
  lecture: Lecture & { readonly answers: GivenAnswers<Questions> },
): boolean {
  return (
    !lecture.answers.question("Q2.14.eloignement").checked("3_AUCUNE") &&
    eloignementAPoser(lecture)
  );
}

/**
 * Q2.12 se pose-t-elle ? C'est la garde de l'éditeur pour l'urgence,
 * `cible_question_urgence_a_afficher`, lue sur tous les faits de P2, ceux de la
 * branche compris. Une condition que la branche vient d'établir (le dispositif
 * maternité) dévoile alors la question que la page du trajet avait masquée.
 * Sans réponse à Q2.3.4 : l'urgence ne se redemande jamais.
 */
export function urgenceDevoilee({ validated, faits }: Lecture): boolean {
  if (validated.question("Q2.3.4").isValidated()) return false;
  return cible(faits, "cible_question_urgence_a_afficher").isOui();
}

// ---- implémentation ----

// Le trajet a-t-il quelque chose à décider, une fois les questions précédentes
// posées ? Le mode se tient, et aucune orientation prioritaire n'est établie :
// ni l'exclusion du transport, ni un transfert, une permission à charge du
// patient, une pension ou un point à la caisse.
function brancheDecisive(faits: Faits): boolean {
  return (
    cible(faits, "cible_mode_coherent").isOui() &&
    !cible(faits, "cible_orientation_sans_urgence_deja_etablie").isOui()
  );
}
