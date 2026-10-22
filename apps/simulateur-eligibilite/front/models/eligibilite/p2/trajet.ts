// Le trajet évalué : les faits que la page du trajet de P2 établit (Q2.3).
//
// Chaque fait suit `CONTRAT_REPONSES_FAITS.json` du paquet de l'éditeur : ce
// qui le met à « oui », ce qui le met à « non », et ce qui le laisse absent.
// Il ne lit que les questions validées.

import { Fait, type ValidatedAnswers } from "../../../socle";
import { AUCUN_FAIT, type Faits } from "../declarations/faits";
import type { Questions } from "../declarations/questions";
import { cible } from "../evaluation-des-regles";
import { EXCLUSION_DU_TRANSPORT } from "../exclusion-du-transport";
import { faitsDuMode } from "../p1/mode-de-transport";
import { faitsDesContextes } from "./contextes";
import { faitsDeLaPrestation } from "./prestation";

type Valides = ValidatedAnswers<Questions>;

/** Les faits que la page du trajet établit, ou laisse absents. */
export function faitsDuTrajet(validated: Valides) {
  return {
    ...faitsDeLaDistance(validated),
    fait_avion_bateau_ligne: avionOuBateau(validated),
    fait_serie_qualifiante: serieQualifiante(validated),
    ...faitsDeLUrgence(validated),
  } satisfies Partial<Faits>;
}

/**
 * Q2.3.4 s'affiche-t-elle ? C'est la garde de l'éditeur,
 * `cible_question_urgence_a_afficher`, lue sur ce que P1, la prestation, les
 * situations particulières et le trajet ont établi, et sur l'exclusion du
 * transport. Les faits des pages
 * suivantes restent absents : la garde ne les lit jamais comme un « non ». Elle
 * vaut `true` même si des faits manquent encore.
 */
export function urgenceAAfficher(validated: Valides): boolean {
  return (
    cible(
      {
        ...AUCUN_FAIT,
        ...faitsDuMode(validated),
        ...faitsDeLaPrestation(validated),
        ...faitsDesContextes(validated),
        ...faitsDeLaDistance(validated),
        fait_avion_bateau_ligne: avionOuBateau(validated),
        fait_serie_qualifiante: serieQualifiante(validated),
        fait_exclusion_transport_prouvee: EXCLUSION_DU_TRANSPORT,
      },
      "cible_question_urgence_a_afficher",
    ) === true
  );
}

// ---- implémentation ----

const CINQUANTE_KM_OU_MOINS = "1_CINQUANTE_KM_OU_MOINS";

// Q2.3.1 range le trajet dans une tranche. 50 km et 150 km exactement ne
// dépassent pas leur seuil.
function faitsDeLaDistance(validated: Valides) {
  const tranche = validated.question("Q2.3.1");
  if (!tranche.hasAnswer()) {
    const attente = Fait.inconnu("Q2.3.1 n'est pas encore validée.");
    return { fait_distance_plus_50: attente, fait_distance_plus_150: attente };
  }
  const source = `Q2.3.1 : « ${tranche.value} ».`;
  return {
    fait_distance_plus_50: tranche.is(CINQUANTE_KM_OU_MOINS)
      ? Fait.non(source)
      : Fait.oui(source),
    fait_distance_plus_150: tranche.is("3_PLUS_DE_CENT_CINQUANTE_KM")
      ? Fait.oui(source)
      : Fait.non(source),
  };
}

// Q2.3.2 : une case seule. Décochée sur la page validée, elle vaut « non ».
function avionOuBateau(validated: Valides): Fait {
  const caseSeule = validated.question("Q2.3.2");
  if (!caseSeule.hasAnswer())
    return Fait.inconnu("Q2.3.2 n'est pas encore validée.");
  return caseSeule.is(true)
    ? Fait.oui("Q2.3.2 : case cochée.")
    : Fait.non("Q2.3.2 : case décochée.");
}

// Q2.3.3 porte sur la conjonction entière : « Non » ne dit pas quelle
// condition manque. Elle ne se pose pas sous 50 km : la série reste alors
// absente, et les règles l'écartent par la distance.
function serieQualifiante(validated: Valides): Fait {
  const reponse = validated.question("Q2.3.3");
  if (reponse.hasAnswer()) {
    const source = `Q2.3.3 : « ${reponse.value} ».`;
    return reponse.is("1_OUI") ? Fait.oui(source) : Fait.non(source);
  }
  if (validated.question("Q2.3.1").is(CINQUANTE_KM_OU_MOINS))
    return Fait.inconnu(
      "Q2.3.3 ne se pose pas : le trajet ne dépasse pas 50 km.",
    );
  return Fait.inconnu("Q2.3.3 n'est pas encore validée.");
}

// Q2.3.4 : le médecin atteste-t-il l'urgence ? « Oui » comme « Non » disent que
// la question a eu sa réponse. Q2.12 la reprend sur la page de branche, quand
// la branche dévoile ce que le trajet masquait. Non posée, elle laisse les deux
// faits absents.
function faitsDeLUrgence(validated: Valides) {
  const question = validated.question("Q2.3.4").isValidated()
    ? "Q2.3.4"
    : "Q2.12";
  const reponse = validated.question(question);
  if (reponse.hasAnswer()) {
    const source = `${question} : « ${reponse.value} ».`;
    return {
      fait_urgence_attestee: reponse.is("1_OUI")
        ? Fait.oui(source)
        : Fait.non(source),
      fait_urgence_repondue: Fait.oui(source),
    };
  }
  const attente = Fait.inconnu(
    urgenceAAfficher(validated)
      ? "Q2.3.4 n'est pas encore validée."
      : "Q2.3.4 ne s'affiche pas : la garde de l'éditeur l'écarte.",
  );
  return { fait_urgence_attestee: attente, fait_urgence_repondue: attente };
}
