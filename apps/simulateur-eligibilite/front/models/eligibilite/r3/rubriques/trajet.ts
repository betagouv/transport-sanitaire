// Le trajet : ses deux lieux et l'aller-retour.
//
// Chaque lieu se reporte dans l'une des trois rubriques du cerfa, selon sa
// projection (`CONTRAT_LIEUX_CERFA.json`). Le domicile est une case. La
// structure de soins et l'autre lieu sont des zones : le lieu s'y écrit en un
// seul texte, sa mention, son nom puis son adresse, et la zone de l'autre
// projection reste vide.
//
// L'aller-retour ne se coche que si le retour est le même trajet, adresses
// inversées. Plusieurs permissions du S3141 en sont chacune un (D-120).

import type { Address, Unanswered } from "../../../../socle";
import {
  type Extremite,
  type Nature,
  natureDu,
  projectionCerfa,
  QUESTIONS_DU_LIEU,
} from "../../p3/lieux-du-trajet";
import { sensDuDocument } from "../../p3/sens-du-trajet";
import type { Donnees, Rubrique } from "./rubrique";

export type Trajet = {
  readonly depart_domicile: boolean;
  readonly depart_structure?: string;
  readonly depart_autre?: string;
  readonly arrivee_domicile: boolean;
  readonly arrivee_structure?: string;
  readonly arrivee_autre?: string;
  readonly aller_retour: boolean;
};

export const TRAJET: Rubrique<Trajet> = {
  depart_domicile: (donnees) => projection("depart", donnees) === "DOMICILE",
  depart_structure: zone("depart", "STRUCTURE_DE_SOINS"),
  depart_autre: zone("depart", "AUTRE_LIEU"),
  arrivee_domicile: (donnees) => projection("arrivee", donnees) === "DOMICILE",
  arrivee_structure: zone("arrivee", "STRUCTURE_DE_SOINS"),
  arrivee_autre: zone("arrivee", "AUTRE_LIEU"),
  aller_retour: ({ validated }) =>
    sensDuDocument(validated) === "3_ALLER_RETOUR_EQUIVALENT",
};

// ---- implémentation ----

type Projection = ReturnType<typeof projectionCerfa>;

/** La zone reste vide : le lieu ne s'y reporte pas, ou on n'en sait rien. */
type ZoneVide = undefined;

/** Le lieu ne se reporte dans aucune rubrique : sa nature n'est pas connue. */
type SansRubrique = undefined;

/** Le lieu ne dit rien de sa nature. */
type SansMention = undefined;

// Le lieu en un seul texte : sa mention, son nom, puis son adresse, pays
// compris à l'étranger. Les parties vides ne s'écrivent pas.
function lieuEnUnTexte(
  extremite: Extremite,
  donnees: Donnees,
): string | ZoneVide {
  const questions = QUESTIONS_DU_LIEU[extremite];
  const { validated } = donnees;
  const parties = [
    mention(extremite, donnees),
    validated.question(questions.nom).value,
    ...adresseEnParties(validated.question(questions.adresse).value),
  ].filter((partie): partie is string => Boolean(partie?.trim()));
  return parties.length > 0 ? parties.join(", ") : undefined;
}

// La rubrique du cerfa où se reporte ce lieu. Sans nature, aucune.
function projection(
  extremite: Extremite,
  { validated }: Donnees,
): Projection | SansRubrique {
  const nature = natureDu(extremite, validated, validated);
  return nature && projectionCerfa(nature);
}

// Le lieu écrit dans la zone `cible`, s'il s'y reporte.
function zone(extremite: Extremite, cible: Projection) {
  return (donnees: Donnees): string | ZoneVide =>
    projection(extremite, donnees) === cible
      ? lieuEnUnTexte(extremite, donnees)
      : undefined;
}

// Ce que le lieu dit de sa nature : la précision saisie en P3, sinon la
// mention que le contrat des lieux demande pour un EHPAD ou un HTNM.
function mention(extremite: Extremite, donnees: Donnees): string | SansMention {
  const { validated } = donnees;
  const precision = validated.question(QUESTIONS_DU_LIEU[extremite].precision);
  if (precision.hasAnswer()) return precision.value;
  const nature = natureDu(extremite, validated, validated);
  return nature && MENTIONS[nature];
}

const MENTIONS: Partial<Record<Nature, string>> = {
  "3_EHPAD": "EHPAD",
  "5_HEBERGEMENT_NON_MEDICALISE": "Hébergement temporaire non médicalisé",
};

// Les parties saisies de l'adresse. Le code postal et la commune vont
// ensemble, comme sur une enveloppe.
function adresseEnParties(adresse: Address | Unanswered): string[] {
  if (adresse === undefined) return [];
  const ville = [adresse.postalCode, adresse.city].filter(Boolean).join(" ");
  return [
    adresse.placeName,
    adresse.street,
    adresse.complement,
    ville,
    adresse.country,
  ].filter((partie): partie is string => Boolean(partie));
}
