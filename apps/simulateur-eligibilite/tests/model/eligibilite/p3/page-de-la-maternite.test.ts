// La page de la maternité (Q3.8, #289), dernière de P3 : ce que la DAP d'un
// Engagement maternité reporte et que le trajet ne dit pas.
// `CONTRAT_Q38_MATERNITE_DOCUMENT.json`, D-251.

import { describe, expect, it } from "vitest";
import { Simulation } from "../../../../core/socle/simulation";
import { model } from "../../../../front/models/eligibilite";
import { S3139H } from "../../../../front/models/eligibilite/r3/s3139h/s3139h";
import { dtoFrom } from "../../../../front/socle/cerfa";
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

// L'hébergement du dispositif qui est l'arrivée garde le nom de Q3.3, qui
// devient obligatoire : la DAP le porte (TS1016-05).
describe("le nom de l'hébergement du dispositif", () => {
  const { "Q3.3.nom": _, ...sansNom } = HEBERGEMENT_DE_MATERNITE;
  const hebergeALArrivee: Reponses = {
    ...sansNom,
    "Q3.3.nature": "5_HEBERGEMENT_NON_MEDICALISE",
    "Q3.3.precision": "Maison des familles",
  };

  it("est obligatoire quand cet hébergement est l'arrivée", () => {
    expect(nomFacultatif(hebergeALArrivee)).toBe(false);
  });

  it("reste facultatif pour un autre lieu", () => {
    expect(nomFacultatif(sansNom)).toBe(true);
  });

  it("reste facultatif quand Q2.14 ne dit pas l'hébergement du dispositif", () => {
    const { "Q2.14.motif": __, ...sansMotif } = hebergeALArrivee;
    const sansLeDispositif: Reponses = {
      ...sansMotif,
      "Q2.2.1": ["14_EXAMEN_MATERNITE"],
    };

    expect(nomFacultatif(sansLeDispositif)).toBe(true);
  });
});

// ---- implémentation ----

// Le nom de l'arrivée peut-il rester vide ?
function nomFacultatif(reponses: Reponses): boolean | undefined {
  const reprise = Simulation.resume(model.core, reponses);
  const simulation = "locked" in reprise.stage ? reprise : reprise.lock();
  const arrivee = simulation.pages().find(({ id }) => id === "P3/arrivee");
  return arrivee
    ? simulation.questionsOn(arrivee).find(({ id }) => id === "Q3.3.nom")
        ?.optional
    : undefined;
}

// La dernière page de P3, et ce qu'elle pose. Les réponses d'après le verrou,
// s'il y en a, passent la simulation derrière lui.
function apresLeVerrou(reponses: Reponses) {
  const reprise = Simulation.resume(model.core, reponses);
  const simulation = "locked" in reprise.stage ? reprise : reprise.lock();
  const derniere = simulation.pages().at(-1);
  return {
    derniere: derniere?.id,
    posees: derniere
      ? simulation.questionsOn(derniere).map(({ id }) => id)
      : [],
  };
}
