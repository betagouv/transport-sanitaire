// La variante du texte d'une raison de la fiche négative (#301) : le
// catalogue la donne, la trace dit si sa situation est prouvée.

import { describe, expect, it } from "vitest";
import type { Faits } from "../../../core/models/eligibilite/declarations/faits";
import { catalogueResultats } from "../../../front/models/eligibilite/r2/catalogue-resultats";
import {
  raisonNonEligible,
  texteDeLaRaison,
} from "../../../front/models/eligibilite/r2/fiche-negative/raison-non-eligible";
import { faux, trace } from "./traces-du-prescripteur";

const { issues } = await catalogueResultats();
const issue = issues.ISSUE_NON_ELIGIBLE;

const AUCUN_MOTIF = {
  cible_issue_id: "ISSUE_NON_ELIGIBLE",
  cible_reason_code: "AUCUN_MOTIF_TRANSPORT",
} as const;

describe("la variante d'une série à 50 km ou moins (TXT-SERIE-COURTE-001)", () => {
  const texteDeLaSerie = (faits: Partial<Faits>) => {
    const serie = trace(AUCUN_MOTIF, faits, { repeatedTripsPlanned: true });
    return texteDeLaRaison(raisonNonEligible(issue, serie), serie);
  };
  const NON_QUALIFIANTE = { fait_serie_qualifiante: faux };

  it("dit le seuil de 50 km quand la distance est prouvée en deçà", () => {
    expect(
      texteDeLaSerie({ ...NON_QUALIFIANTE, fait_distance_plus_50: faux }),
    ).toBe(
      "Le trajet évalué ne dépasse pas 50 km. Pour une prise en charge au titre d’une série, chacun des transports doit dépasser 50 km.",
    );
  });

  it("garde le texte générique quand la distance n'est pas connue", () => {
    expect(texteDeLaSerie(NON_QUALIFIANTE)).toBe(
      "La prise en charge au titre d’une série nécessite au moins 4 transports de plus de 50 km chacun, sur une période de 2 mois, pour le même traitement. Les déplacements prévus ne remplissent pas ces conditions.",
    );
  });

  it("ne crée pas la raison de la série : la distance seule ne suffit pas", () => {
    const courte = trace(AUCUN_MOTIF, { fait_distance_plus_50: faux }, {});
    expect(raisonNonEligible(issue, courte).id).toBe("AUCUN_GENERIQUE");
  });
});
