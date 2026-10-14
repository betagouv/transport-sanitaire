// Le trajet évalué : les faits que la page du trajet de P2 établit (Q2.3).
//
// Chaque fait suit `CONTRAT_REPONSES_FAITS.json` du paquet de l'éditeur : ce
// qui le met à « oui », ce qui le met à « non », et ce qui le laisse absent.
// Il ne lit que les questions validées.

import type { Validated } from "../../socle";
import type { Fait } from "../../socle/decision-engine/publicodes";
import type { Faits } from "./declarations/faits";
import type { Questions } from "./declarations/questions";

type Valides = Validated<Questions>;

/** Les faits que Q2.3.1 et Q2.3.3 établissent, ou laissent absents. */
export function faitsDuTrajet(validated: Valides) {
  return {
    ...faitsDeLaDistance(validated),
    fait_serie_qualifiante: serieQualifiante(validated),
  } satisfies Partial<Faits>;
}

// ---- implémentation ----

const CINQUANTE_KM_OU_MOINS = "1_CINQUANTE_KM_OU_MOINS";

function oui(provenance: string): Fait {
  return { value: true, provenance };
}

function non(provenance: string): Fait {
  return { value: false, provenance };
}

function absent(provenance: string): Fait {
  return { provenance };
}

// Q2.3.1 range le trajet dans une tranche. 50 km et 150 km exactement ne
// dépassent pas leur seuil.
function faitsDeLaDistance(validated: Valides) {
  const tranche = validated["Q2.3.1"]?.answer;
  if (tranche === undefined) {
    const attente = absent("Q2.3.1 n'est pas encore validée.");
    return { fait_distance_plus_50: attente, fait_distance_plus_150: attente };
  }
  const source = `Q2.3.1 : « ${tranche} ».`;
  return {
    fait_distance_plus_50:
      tranche === CINQUANTE_KM_OU_MOINS ? non(source) : oui(source),
    fait_distance_plus_150:
      tranche === "3_PLUS_DE_CENT_CINQUANTE_KM" ? oui(source) : non(source),
  };
}

// Q2.3.3 porte sur la conjonction entière : « Non » ne dit pas quelle
// condition manque. Elle ne se pose pas sous 50 km : la série reste alors
// absente, et les règles l'écartent par la distance.
function serieQualifiante(validated: Valides): Fait {
  const reponse = validated["Q2.3.3"]?.answer;
  if (reponse !== undefined) {
    const source = `Q2.3.3 : « ${reponse} ».`;
    return reponse === "1_OUI" ? oui(source) : non(source);
  }
  if (validated["Q2.3.1"]?.answer === CINQUANTE_KM_OU_MOINS)
    return absent("Q2.3.3 ne se pose pas : le trajet ne dépasse pas 50 km.");
  return absent("Q2.3.3 n'est pas encore validée.");
}
