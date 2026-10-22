// La page de branche, dernière de P2 : quand ses questions se posent, et les
// faits qu'elle établit (Q2.12, Q2.13, Q2.14).
//
// Une question de branche ne se pose que si sa réponse peut changer l'issue.
// L'éditeur ne donne pas de variable de décisivité pour Q2.13 ni pour Q2.14 :
// la condition est la plus étroite que ses règles permettent. Elle lit les faits
// des questions posées avant elle. Le motif de Q2.14 lit aussi l'éloignement,
// sur la même page.

import {
  type GivenAnswers,
  regles,
  type ValidatedAnswers,
} from "../../../socle/index.ts";
import {
  type DeclarationsDeFaits,
  type Faits,
  PAS_ENCORE_ETABLI,
} from "../declarations/faits.ts";
import type { Questions } from "../declarations/questions.ts";
import { cible } from "../evaluation-des-regles.ts";
import { situationDuCadre } from "./contextes.ts";

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
  return cible(faits, "cible_question_urgence_a_afficher") === true;
}

/**
 * Le départ de Q2.13, s'il est celui d'une entrée simple : hors du champ du I
 * de D.162-17, ni transfert ni Centre 15. Les trois autres (établissement,
 * EHPAD, USLD) ouvrent le transfert ; un autre lieu ne se qualifie pas sur une
 * description libre.
 */
export function departDUneEntreeSimple(
  validated: Valides,
): Questions["Q2.13.depart"] | undefined {
  const depart = validated.question("Q2.13.depart");
  return depart.isOneOf(...DEPARTS_D_UNE_ENTREE_SIMPLE)
    ? depart.value
    : undefined;
}

/** Les faits que la page de branche établit, hors l'urgence de Q2.12. */
export const FAITS_DE_LA_BRANCHE: DeclarationsDeFaits = {
  // Les deux groupes de Q2.14 (`CONTRAT_Q214_GROUPES.json`) : une condition
  // cochée dans chacun établit le dispositif, « Aucune » dans l'un l'écarte. Un
  // groupe sans réponse le laisse à la maternité signalée en Q2.2.1.b.
  fait_dap_maternite: ({ validated }) => {
    const eloignement = validated.question("Q2.14.eloignement");
    const motif = validated.question("Q2.14.motif");
    const conditions = [
      ...eloignement.checkedBoxes(),
      ...motif.checkedBoxes(),
    ].join(" », « ");
    return regles()
      .nonSi(
        eloignement.checked("3_AUCUNE"),
        "Q2.14 : aucun éloignement éligible.",
      )
      .nonSi(motif.checked("3_AUCUNE"), "Q2.14 : aucun motif éligible.")
      .ouiSi(
        eloignement.hasAnswer() && motif.hasAnswer(),
        `Q2.14 : « ${conditions} ».`,
      )
      .retient(situationDuCadre(validated, "4_MATERNITE_ELOIGNEE"))
      .sinon(PAS_ENCORE_ETABLI);
  },
};

// ---- implémentation ----

const DEPARTS_D_UNE_ENTREE_SIMPLE: readonly Questions["Q2.13.depart"][] = [
  "1_DOMICILE",
  "5_HEBERGEMENT_NON_MEDICALISE",
  "6_ETABLISSEMENT_PENITENTIAIRE",
];

// Le trajet a-t-il quelque chose à décider, une fois les questions précédentes
// posées ? Le mode se tient, et aucune orientation prioritaire n'est établie :
// ni l'exclusion du transport, ni un transfert, une permission à charge du
// patient, une pension ou un point à la caisse.
function brancheDecisive(faits: Faits): boolean {
  return (
    cible(faits, "cible_mode_coherent") === true &&
    cible(faits, "cible_orientation_sans_urgence_deja_etablie") !== true
  );
}
