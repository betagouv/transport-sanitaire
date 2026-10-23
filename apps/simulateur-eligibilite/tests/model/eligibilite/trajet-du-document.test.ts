// La page du trajet de P3 (Q3.1, #144) : les transports de ce document, posés
// selon le support figé au verrou. `CATALOGUE_COMPLET_QUESTIONS.md` Q3.1 et
// TS1001-03 du paquet de l'éditeur.

import { describe, expect, it } from "vitest";
import { model } from "../../../core/models/eligibilite";
import type { Cibles } from "../../../core/models/eligibilite/declarations/cibles";
import type { Questions } from "../../../core/models/eligibilite/declarations/questions";
import { SEEDS } from "../../../core/models/eligibilite/seeds-catalogue";
import { preconisationOf } from "../../../core/socle/model";
import type { Answers } from "../../../core/socle/questionnaire-engine/question";
import { Questionnaire } from "../../../core/socle/questionnaire-engine/questionnaire";
import { errorsOf } from "../../../front/socle/questionnaire-engine/screen-texts";
import { MINEUR, PLUSIEURS_PERMISSIONS } from "./reponses-de-la-permission";
import { ciblesValant } from "./traces-du-praticien";

type Reponses = Answers<Questions>;

const pages = model.complement.pages;
const [PAGE] = pages;
// Les pages des lieux suivent : seule celle du trajet se juge ici.
const DU_TRAJET = pages.slice(0, 1);

const avecLeSupport = (support: Cibles["cible_support_id"]["value"]) =>
  ciblesValant({ cible_support_id: support });
const posees = (
  support: Cibles["cible_support_id"]["value"],
  reponses: Reponses = {},
) =>
  PAGE
    ? new Questionnaire(pages)
        .readWith(reponses, avecLeSupport(support))
        .questionsOn(PAGE)
    : [];
const question = (
  id: keyof Questions,
  support: Cibles["cible_support_id"]["value"],
  reponses: Reponses = {},
) => {
  const trouvee = posees(support, reponses).find(
    (candidate) => candidate.id === id,
  );
  if (!trouvee) throw new Error(`${id} ne se pose pas`);
  return trouvee;
};

const PRESCRIPTION: Reponses = { "Q3.1.1": 2, "Q3.1.2": "1_ALLER" };

describe("ce que la page du trajet pose (Q3.1)", () => {
  it.each(["S3138g", "S3139h"] as const)(
    "pour %s, le nombre de transports et leur sens",
    (support) => {
      expect(posees(support).map(({ id }) => id)).toEqual(["Q3.1.1", "Q3.1.2"]);
    },
  );

  it("pour le S3141 de plusieurs permissions, le seul nombre mensuel : chacune est un aller-retour", () => {
    expect(posees("S3141", PLUSIEURS_PERMISSIONS).map(({ id }) => id)).toEqual([
      "Q3.1.3",
    ]);
  });

  it("pour le S3141 d'une seule permission, son sens, sans nombre mensuel", () => {
    expect(posees("S3141", MINEUR).map(({ id }) => id)).toEqual(["Q3.1.2"]);
  });

  it("sans support, rien", () => {
    expect(posees("AUCUN")).toEqual([]);
  });
});

describe("les réponses de Q3.1", () => {
  it("« Aller-retour différent » bloque, avec le message des deux simulations", () => {
    const reponses: Reponses = {
      "Q3.1.1": 2,
      "Q3.1.2": "4_ALLER_RETOUR_DIFFERENT",
    };

    expect(
      errorsOf(question("Q3.1.2", "S3138g"), "4_ALLER_RETOUR_DIFFERENT"),
    ).toEqual([
      "Ces deux trajets nécessitent deux simulations distinctes. Choisissez ici le sens déjà évalué, puis faites une autre simulation pour l’autre sens.",
    ]);
    expect(
      new Questionnaire(DU_TRAJET)
        .readWith(reponses, avecLeSupport("S3138g"))
        .isComplete(),
    ).toBe(false);
  });

  it("« Aller-retour équivalent » se valide", () => {
    const reponses: Reponses = {
      "Q3.1.1": 2,
      "Q3.1.2": "3_ALLER_RETOUR_EQUIVALENT",
    };

    expect(
      new Questionnaire(DU_TRAJET)
        .readWith(reponses, avecLeSupport("S3138g"))
        .isComplete(),
    ).toBe(true);
  });

  it("un aller-retour d'un seul transport bloque", () => {
    const reponses: Reponses = {
      "Q3.1.1": 1,
      "Q3.1.2": "3_ALLER_RETOUR_EQUIVALENT",
    };

    expect(question("Q3.1.2", "S3138g", reponses).inconsistencies).toEqual([
      "Un aller-retour compte deux transports. Indiquez-en au moins deux, ou choisissez « Aller simple » ou « Retour simple ».",
    ]);
    expect(
      new Questionnaire(DU_TRAJET)
        .readWith(reponses, avecLeSupport("S3138g"))
        .isComplete(),
    ).toBe(false);
  });

  it.each([0, 1.5])("refuse %s transport", (nombre) => {
    expect(errorsOf(question("Q3.1.1", "S3138g"), nombre)).not.toEqual([]);
  });
});

describe("les sens que les rôles de P2 permettent (Q3.1.2)", () => {
  const sensProposes = (reponses: Reponses) => {
    const sens = question("Q3.1.2", "S3138g", reponses);
    return sens.kind === "single choice"
      ? sens.options.map(({ value }) => value)
      : [];
  };
  const PENITENTIAIRE: Reponses = {
    "Q2.2.1": ["3_AUTRE_CADRE"],
    "Q2.2.1.b": ["10_RETOUR_PENITENTIAIRE"],
  };

  it("sans rôle fixé, les quatre", () => {
    expect(sensProposes({})).toEqual([
      "1_ALLER",
      "2_RETOUR",
      "3_ALLER_RETOUR_EQUIVALENT",
      "4_ALLER_RETOUR_DIFFERENT",
    ]);
  });

  it("une entrée ne fait que l'aller vers l'établissement", () => {
    expect(sensProposes({ "Q2.1.g": "1_ENTREE" })).toEqual([
      "1_ALLER",
      "4_ALLER_RETOUR_DIFFERENT",
    ]);
  });

  it.each<[string, Reponses]>([
    ["une sortie", { "Q2.1.g": "2_SORTIE" }],
    ["une admission en HAD", { "Q2.1.g": "3_ADMISSION_HAD" }],
    [
      "un transfert pour une admission en HAD",
      { "Q2.6": ["10_ADMISSION_HAD"] },
    ],
    ["un retour pénitentiaire", PENITENTIAIRE],
  ])("%s ne fait que le retour", (_cas, reponses) => {
    expect(sensProposes(reponses)).toEqual([
      "2_RETOUR",
      "4_ALLER_RETOUR_DIFFERENT",
    ]);
  });
});

describe("le nombre mensuel du S3141 (Q3.1.3)", () => {
  // Une permission toutes les deux semaines : trois au plus dans un mois.
  const mensuel = (nombre?: number) =>
    question("Q3.1.3", "S3141", {
      ...PLUSIEURS_PERMISSIONS,
      ...(nombre !== undefined && { "Q3.1.3": nombre }),
    });

  it("compte des trajets par mois, un aller-retour pour deux", () => {
    expect(mensuel()).toMatchObject({
      label: "Combien de trajets faut-il prescrire par mois ?",
      hint: "Chaque permission est un aller-retour : elle compte deux trajets.",
      unit: "trajet(s) par mois",
    });
  });

  it("rappelle les dates et la fréquence de Q2.8", () => {
    expect(mensuel().reminder).toEqual([
      {
        label: "Première permission",
        value: "du 14/10/2026 à 09:00 au 15/10/2026 à 09:00",
      },
      { label: "Fin de la période", value: "01/12/2026" },
      {
        label: "Fréquence",
        value: "une permission aller-retour toutes les 2 semaine(s)",
      },
    ]);
  });

  it("refuse plus de trajets que la fréquence n'en permet", () => {
    expect(mensuel(6).inconsistencies).toEqual([]);
    expect(mensuel(7).inconsistencies).toEqual([
      "Avec une permission toutes les 2 semaine(s), un mois compte au plus 6 trajets.",
    ]);
  });
});

describe("Q3.1 ne requalifie pas P2", () => {
  // Une série de dialyses à plus de 50 km, que deux documents se partagent.
  const SERIE: Reponses = {
    ...SEEDS.find(({ id }) => id === "issue-pmt")?.answers,
    "Q2.3.1": "2_PLUS_DE_CINQUANTE_KM",
    "Q2.3.3": "1_OUI",
  } as Reponses;

  it("deux documents de deux transports gardent la série qualifiante de P2", () => {
    const { faits, cibles } = preconisationOf(model, {
      ...SERIE,
      ...PRESCRIPTION,
    });

    expect(faits.fait_serie_qualifiante).toMatchObject({ value: true });
    expect(cibles).toEqual(preconisationOf(model, SERIE).cibles);
  });
});
