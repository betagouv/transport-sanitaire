// Le trajet évalué : les faits que la page du trajet de P2 établit (Q2.3).
//
// Chaque fait suit `CONTRAT_REPONSES_FAITS.json` du paquet de l'éditeur : ce
// qui le met à « oui », ce qui le met à « non », et ce qui le laisse absent.

import { regles, type ValidatedAnswers } from "../../../socle/index.ts";
import type { DeclarationsDeFaits, Faits } from "../declarations/faits.ts";
import type { Questions } from "../declarations/questions.ts";
import { cible } from "../evaluation-des-regles.ts";

type Valides = ValidatedAnswers<Questions>;

/** Les faits que la page du trajet établit, ou laisse absents. */
export const FAITS_DU_TRAJET: DeclarationsDeFaits = {
  // Q2.3.1 range le trajet dans une tranche. 50 km et 150 km exactement ne
  // dépassent pas leur seuil.
  fait_distance_plus_50: ({ validated }) =>
    regles()
      .selon(validated.question("Q2.3.1"), {
        [CINQUANTE_KM_OU_MOINS]: "non",
        "2_PLUS_DE_CINQUANTE_KM": "oui",
        "3_PLUS_DE_CENT_CINQUANTE_KM": "oui",
      })
      .sinon(DISTANCE_EN_ATTENTE),
  fait_distance_plus_150: ({ validated }) =>
    regles()
      .selon(validated.question("Q2.3.1"), {
        [CINQUANTE_KM_OU_MOINS]: "non",
        "2_PLUS_DE_CINQUANTE_KM": "non",
        "3_PLUS_DE_CENT_CINQUANTE_KM": "oui",
      })
      .sinon(DISTANCE_EN_ATTENTE),
  // Q2.3.2 : une case seule. Décochée sur la page validée, elle vaut « non ».
  fait_avion_bateau_ligne: ({ validated }) => {
    const caseSeule = validated.question("Q2.3.2");
    return regles()
      .ouiSi(caseSeule.is(true), "Q2.3.2 : case cochée.")
      .nonSi(caseSeule.is(false), "Q2.3.2 : case décochée.")
      .sinon("Q2.3.2 n'est pas encore validée.");
  },
  // Q2.3.3 porte sur la conjonction entière : « Non » ne dit pas quelle
  // condition manque. Elle ne se pose pas sous 50 km : la série reste alors
  // absente, et les règles l'écartent par la distance.
  fait_serie_qualifiante: ({ validated }) =>
    regles()
      .selon(validated.question("Q2.3.3"), { "1_OUI": "oui", "2_NON": "non" })
      .sinon(
        validated.question("Q2.3.1").is(CINQUANTE_KM_OU_MOINS)
          ? "Q2.3.3 ne se pose pas : le trajet ne dépasse pas 50 km."
          : "Q2.3.3 n'est pas encore validée.",
      ),
  fait_urgence_attestee: ({ validated }) => {
    const reponse = urgence(validated);
    return regles()
      .selon(reponse, { "1_OUI": "oui", "2_NON": "non" })
      .sinon(URGENCE_EN_ATTENTE);
  },
  // « Oui » comme « Non » disent que la question a eu sa réponse.
  fait_urgence_repondue: ({ validated }) => {
    const reponse = urgence(validated);
    return regles()
      .selon(reponse, { "1_OUI": "oui", "2_NON": "oui" })
      .sinon(URGENCE_EN_ATTENTE);
  },
};

/**
 * Q2.3.4 s'affiche-t-elle ? C'est la garde de l'éditeur,
 * `cible_question_urgence_a_afficher`, lue sur les faits des questions posées
 * avant elle. Les faits des pages suivantes restent absents : la garde ne les
 * lit jamais comme un « non ». Elle vaut `true` même si des faits manquent
 * encore.
 */
export function urgenceAAfficher(faits: Faits): boolean {
  return cible(faits, "cible_question_urgence_a_afficher") === true;
}

// ---- implémentation ----

const CINQUANTE_KM_OU_MOINS = "1_CINQUANTE_KM_OU_MOINS";
const DISTANCE_EN_ATTENTE = "Q2.3.1 n'est pas encore validée.";

// Ni Q2.3.4 ni Q2.12 n'ont de réponse. Le fait ne lit pas la garde qui les
// pose : elle le lit.
const URGENCE_EN_ATTENTE =
  "Ni Q2.3.4 ni Q2.12 n'ont de réponse : elles attendent, ou leur garde les écarte.";

// Q2.3.4 : le médecin atteste-t-il l'urgence ? Q2.12 la reprend sur la page de
// branche, quand la branche dévoile ce que le trajet masquait.
function urgence(validated: Valides) {
  return validated.question(
    validated.question("Q2.3.4").isValidated() ? "Q2.3.4" : "Q2.12",
  );
}
