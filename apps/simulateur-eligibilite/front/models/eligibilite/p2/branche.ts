// La page de branche, dernière de P2 : quand ses questions se posent, et les
// faits qu'elle établit (Q2.12, Q2.13, Q2.14).
//
// Une question de branche ne se pose que si sa réponse peut changer l'issue.
// L'éditeur ne donne pas de variable de décisivité pour Q2.13 ni pour Q2.14 :
// la condition est la plus étroite que ses règles permettent. Elle lit les faits
// des pages précédentes, jamais ceux de la branche. Ces fonctions ne lisent que
// les questions validées, sauf le motif de Q2.14, qui lit l'éloignement sur la
// même page.

import {
  Fait,
  type GivenAnswer,
  type ValidatedAnswers,
} from "../../../../core/socle";
import { AUCUN_FAIT, type Faits } from "../declarations/faits";
import type { Questions } from "../declarations/questions";
import { cible } from "../evaluation-des-regles";
import { faitsAvantLaBranche } from "./faits-avant-la-branche";

type Valides = ValidatedAnswers<Questions>;

/**
 * Q2.13 (le départ) se pose-t-elle ? Une entrée en établissement de santé qui
 * laisse `fait_transfert_article80` absent envoie à la caisse : la nature du
 * départ dit si l'entrée est simple.
 */
export function departAPoser(validated: Valides): boolean {
  if (validated.question("Q2.1.g").isNot("1_ENTREE")) return false;
  const faits = faitsAvantLaBranche(validated);
  return (
    faits.fait_hospitalisation.value === true &&
    faits.fait_transfert_article80.value === undefined &&
    brancheDecisive(faits)
  );
}

/**
 * Le groupe de l'éloignement (Q2.14) se pose-t-il ? Q2.1 dit la maternité, ou
 * Q2.2.1.b la signale.
 */
export function eloignementAPoser(validated: Valides): boolean {
  const signalee =
    validated.question("Q2.1").is("13_MATERNITE") ||
    validated.question("Q2.2.1.b").checked("4_MATERNITE_ELOIGNEE");
  return signalee && brancheDecisive(faitsAvantLaBranche(validated));
}

/**
 * Le groupe du motif (Q2.14) se pose-t-il ? Comme l'éloignement, sauf quand
 * celui-ci a déjà écarté le dispositif : le motif ne changerait plus rien.
 */
export function motifAPoser(
  eloignement: GivenAnswer<Questions["Q2.14.eloignement"]>,
  validated: Valides,
): boolean {
  return !eloignement.checked("3_AUCUNE") && eloignementAPoser(validated);
}

/**
 * Q2.12 se pose-t-elle ? C'est la garde de l'éditeur pour l'urgence,
 * `cible_question_urgence_a_afficher`, lue sur tous les faits de P2, ceux de la
 * branche compris. Une condition que la branche vient d'établir (le dispositif
 * maternité) dévoile alors la question que la page du trajet avait masquée.
 * Sans réponse à Q2.3.4 : l'urgence ne se redemande jamais.
 */
export function urgenceDevoilee(validated: Valides): boolean {
  if (validated.question("Q2.3.4").isValidated()) return false;
  const faits = {
    ...faitsAvantLaBranche(validated),
    ...faitsDeLaBranche(validated),
    // La garde ne lit pas l'urgence : sa propre réponse ne doit pas la retirer.
    fait_urgence_attestee: AUCUN_FAIT.fait_urgence_attestee,
    fait_urgence_repondue: AUCUN_FAIT.fait_urgence_repondue,
  };
  return cible(faits, "cible_question_urgence_a_afficher") === true;
}

/** Les faits que la page de branche établit, hors l'urgence de Q2.12. */
export function faitsDeLaBranche(validated: Valides): Partial<Faits> {
  return {
    ...faitsDuDepart(validated),
    ...faitsDeLaMaternite(validated),
  };
}

// ---- implémentation ----

// Les départs d'une entrée simple : hors du champ du I de D.162-17. Les trois
// autres (établissement, EHPAD, USLD) ouvrent le transfert ; un autre lieu ne
// se qualifie pas sur une description libre. Le fait reste alors absent.
const DEPARTS_D_UNE_ENTREE_SIMPLE: readonly Questions["Q2.13.depart"][] = [
  "1_DOMICILE",
  "5_HEBERGEMENT_NON_MEDICALISE",
  "6_ETABLISSEMENT_PENITENTIAIRE",
];

// Le trajet a-t-il quelque chose à décider, une fois les pages précédentes
// posées ? Le mode se tient, et aucune orientation prioritaire n'est établie :
// ni l'exclusion du transport, ni un transfert, une permission à charge du
// patient, une pension ou un point à la caisse.
function brancheDecisive(faits: Faits): boolean {
  return (
    cible(faits, "cible_mode_coherent") === true &&
    cible(faits, "cible_orientation_sans_urgence_deja_etablie") !== true
  );
}

function faitsDuDepart(validated: Valides): Partial<Faits> {
  const depart = validated.question("Q2.13.depart");
  if (!depart.isOneOf(...DEPARTS_D_UNE_ENTREE_SIMPLE)) return {};
  return {
    fait_transfert_article80: Fait.non(
      `Q2.13 : « ${depart.value} » ; une entrée simple est hors du champ du I de D.162-17.`,
    ),
    fait_centre15_interetablissements: Fait.non(
      `Q2.13 : « ${depart.value} » ; aucun transfert entre établissements.`,
    ),
  };
}

// Les deux groupes de Q2.14 (`CONTRAT_Q214_GROUPES.json`) : une condition
// cochée dans chacun établit le dispositif, « Aucune » dans l'un l'écarte. Un
// groupe sans réponse le laisse absent, jamais « non ».
function faitsDeLaMaternite(validated: Valides): Partial<Faits> {
  const eloignement = validated.question("Q2.14.eloignement");
  const motif = validated.question("Q2.14.motif");
  if (eloignement.checked("3_AUCUNE"))
    return {
      fait_dap_maternite: Fait.non("Q2.14 : aucun éloignement éligible."),
    };
  if (motif.checked("3_AUCUNE"))
    return { fait_dap_maternite: Fait.non("Q2.14 : aucun motif éligible.") };
  if (!eloignement.hasAnswer() || !motif.hasAnswer()) return {};
  const conditions = [
    ...eloignement.checkedBoxes(),
    ...motif.checkedBoxes(),
  ].join(" », « ");
  return { fait_dap_maternite: Fait.oui(`Q2.14 : « ${conditions} ».`) };
}
