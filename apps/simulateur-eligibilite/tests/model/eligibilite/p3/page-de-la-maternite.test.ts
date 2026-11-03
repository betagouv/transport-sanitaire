// La page de la maternité (Q3.8, #289), dernière de P3 : ce que la DAP d'un
// Engagement maternité reporte et que le trajet ne dit pas.
// `CONTRAT_Q38_MATERNITE_DOCUMENT.json`, D-251.

import { describe, expect, it } from "vitest";
import { Questionnaire } from "../../../../core/socle/questionnaire-engine/questionnaire";
import { Simulation } from "../../../../core/socle/simulation/simulation";
import { model } from "../../../../front/models/eligibilite";
import { S3139H } from "../../../../front/models/eligibilite/r3/s3139h/s3139h";
import { dtoFrom } from "../../../../front/socle/cerfa/generate-the-cerfa/compute-the-dto";
import { textsOn } from "../../../socle/cerfa/pdf-aplati";
import {
  donnees,
  EXAMEN_DE_MATERNITE,
  genere,
  HEBERGEMENT_DE_MATERNITE,
  PMT,
  Q38,
  type Reponses,
} from "../r3/reponses-du-cerfa";

const MATERNITE = [
  "Q3.8.maternite.nom",
  "Q3.8.maternite.adresse",
  "Q3.8.niveau",
];

describe("la page de la maternité (Q3.8)", () => {
  it("demande la maternité et son niveau, sur la dernière page de P3", () => {
    expect(apresLeVerrou(EXAMEN_DE_MATERNITE)).toEqual({
      derniere: "P3/maternite",
      posees: MATERNITE,
    });
  });

  it("demande aussi l'hébergement du dispositif, s'il n'est pas un lieu du trajet", () => {
    expect(apresLeVerrou(HEBERGEMENT_DE_MATERNITE).posees).toEqual([
      ...MATERNITE,
      "Q3.8.hebergement.nom",
      "Q3.8.hebergement.adresse",
    ]);
  });

  it("ne redemande pas l'hébergement qui est l'arrivée", () => {
    const reponses: Reponses = {
      ...HEBERGEMENT_DE_MATERNITE,
      "Q3.3.nature": "5_HEBERGEMENT_NON_MEDICALISE",
      "Q3.3.precision": "Maison des familles",
    };

    expect(apresLeVerrou(reponses).posees).toEqual(MATERNITE);
  });

  it("ne se pose pas hors Engagement maternité", () => {
    expect(apresLeVerrou(PMT).derniere).not.toBe("P3/maternite");
  });

  it("s'écrit sur la DAP, dont le texte médical cite le 8ᵉ mois", async () => {
    const reponses = { ...EXAMEN_DE_MATERNITE, ...Q38 };
    const dto = dtoFrom(S3139H.mapping, donnees(reponses));

    const textes = await textsOn(await genere(S3139H.cerfa, "S3139h", dto), 2);

    expect(textes.join(" ")).toMatch(/8e .*maternité : Maternité du Parc/);
  });
});

// ---- implémentation ----

// La dernière page de P3, et ce qu'elle pose.
function apresLeVerrou(reponses: Reponses) {
  const { cibles } = Simulation.of(model.core, reponses).lock().preconisation;
  const complement = new Questionnaire(
    model.core.complement.pages,
    model.core.relevance,
  );
  const read = complement.readWith(reponses, cibles);
  const derniere = read.askedPages().at(-1);
  return {
    derniere: derniere?.id,
    posees: derniere ? read.questionsOn(derniere).map(({ id }) => id) : [],
  };
}
