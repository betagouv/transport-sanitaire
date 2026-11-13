// Les constructeurs des questions du modèle : `question.singleChoice("Q1.1",
// "Concernant son déplacement, le patient :")`, ses options, puis un réglage
// par ligne. Les gardes lisent les faits des questions validées avant elles,
// et les cibles que les règles en tirent : figées au verrou, sinon calculées
// sur ces faits.
//
// Une option se répond par un slug : son numéro dans le catalogue de l'éditeur,
// puis ce qu'elle veut dire. Le libellé est celui du catalogue, mot pour mot.
// Les options se déclarent dans l'ordre du catalogue : c'est l'ordre de l'écran,
// sauf quand le catalogue en donne un autre (Q1.3).
//
// Une question lit celles d'avant par leur objet : `given.question(Q1_1)`. Le
// type `Questions` se tire des parties (`reponses.ts`) : le lire ici tournerait
// en rond.
//
// Une garde ne lit jamais la complétude de P1 ni de P2 : la constater pose les
// questions, donc lit leurs gardes. Le catalogue la laisse inconnue.

import {
  givenOf,
  type QuestionContext,
  questionsOf,
  type ReadByObject,
} from "../../../socle/index.ts";
import { decisionEngine } from "../cibles/evaluation.ts";
import type { Cibles } from "../cibles/noms.ts";
import { CATALOGUE_DES_FAITS } from "../faits/index.ts";
import type { Faits } from "../faits/noms.ts";

/** La réponse qui le dirait n'est pas donnée : on ne le sait pas encore. */
export type Inconnu = undefined;

/** Ce que lit une condition déclarée hors de son constructeur. */
export type Context = QuestionContext<ReadByObject, Cibles, Faits>;

/**
 * Les entrées des conditions : `given.question(Q1_1).answer()`,
 * `given.fait(nom)`, `given.cible(nom)`, `given.today()`.
 */
export const given = givenOf<ReadByObject, Faits, Cibles>();

/** Les constructeurs des questions de P0 à P3. */
export const question = questionsOf<ReadByObject, Faits, Cibles>({
  faits: CATALOGUE_DES_FAITS,
  cibles: (faits) => decisionEngine.lazyCibles(faits),
});
