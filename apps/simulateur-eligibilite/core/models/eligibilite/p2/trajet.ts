// Le trajet évalué : quand Q2.3.4, la question de l'urgence, s'affiche (Q2.3).
// Ses faits vivent sous `faits/`, et ce qu'en lisent plusieurs dans
// `DistanceDuTrajet` et `Urgence`.

import type { Faits } from "../declarations/faits.ts";
import { cible } from "../evaluation-des-regles.ts";

/**
 * Q2.3.4 s'affiche-t-elle ? C'est la garde de l'éditeur,
 * `cible_question_urgence_a_afficher`, lue sur les faits des questions posées
 * avant elle. Les faits des pages suivantes restent absents : la garde ne les
 * lit jamais comme un « non ». Elle vaut « oui » même si des faits manquent
 * encore.
 */
export function urgenceAAfficher(faits: Faits): boolean {
  return cible(faits, "cible_question_urgence_a_afficher").isOui();
}
