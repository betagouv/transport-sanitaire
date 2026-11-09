// Le sens du trajet avant R2 (#365, QST-LIEUX-CONFLIT-CERTAIN-20261106, Q2.13
// détail 8) : quand les lieux de P2 ne se contredisent que dans un sens, et
// qu'aucune réponse ne l'établit, Q2.13.sens se pose sur la page de branche.
// Un sens qui crée le conflit s'arrête en P2, comme un conflit certain (#353).

import { describe, expect, it } from "vitest";
import { LIEUX_INCOMPATIBLES } from "../../../../core/models/eligibilite/questions/p2/conditions/conflit-de-lieux";
import { Simulation } from "../../../../core/socle/simulation";
import { model } from "../../../../front/models/eligibilite";
import {
  MINEUR,
  PLUSIEURS_PERMISSIONS,
  posee,
  type Reponses,
  SANS_SITUATION,
} from "./reponses-de-la-permission";

const BRANCHE = "P2/branche";

const HOSPITALISATION = (sousType: Reponses["Q2.1.g"]): Reponses => ({
  ...SANS_SITUATION,
  "Q2.1": "8_HOSPITALISATION",
  "Q2.1.g": sousType,
});
const PERMISSION: Reponses = {
  "Q2.2.1": ["1_HOSPITALISATION"],
  "Q2.2.1.cadre": "1_ETABLISSEMENT",
  "Q2.2.1.a": "1_OUI",
  "Q2.7": "3_ADULTE_AUTORISEE",
};
const DIALYSE: Reponses = {
  "Q1.3": ["5_DIALYSE"],
  "Q1.3.a": "2_AUTRE_DIALYSE",
};

type Cas = readonly [string, Reponses, Reponses["Q2.13.sens"]];

// Les cinq conflits que seul le filtre de Q3.1.2 rendait certains (D-132),
// et le sens qui les crée.
const CINQ_CAS: readonly Cas[] = [
  [
    "entrée et hébergement",
    { ...HOSPITALISATION("1_ENTREE"), "Q2.2.1": ["5_HTNM"] },
    "1_ALLER",
  ],
  [
    "sortie et hébergement",
    { ...HOSPITALISATION("2_SORTIE"), "Q2.2.1": ["5_HTNM"] },
    "2_RETOUR",
  ],
  [
    "sortie et permission",
    { ...HOSPITALISATION("2_SORTIE"), ...PERMISSION },
    "2_RETOUR",
  ],
  [
    "admission en HAD et permission",
    {
      ...HOSPITALISATION("3_ADMISSION_HAD"),
      ...PERMISSION,
      "Q2.6": ["11_AUCUNE"],
    },
    "2_RETOUR",
  ],
  [
    "séjour en HAD et retour pénitentiaire",
    {
      ...SANS_SITUATION,
      "Q2.1": "1_CONSULTATION",
      "Q2.2.1": ["1_HOSPITALISATION", "10_RETOUR_PENITENTIAIRE"],
      "Q2.2.1.cadre": "2_HAD",
      "Q2.2.1.indication": "1_OUI",
      "Q2.6": ["11_AUCUNE"],
    },
    "2_RETOUR",
  ],
];

const autreSens = (sens: Cas[2]): Cas[2] =>
  sens === "1_ALLER" ? "2_RETOUR" : "1_ALLER";

const sensPose = (reponses: Reponses) => posee(BRANCHE, "Q2.13.sens", reponses);
const alertes = (reponses: Reponses) =>
  sensPose(reponses)?.inconsistencies ?? [];

describe("Q2.13.sens, le sens qui change la cohérence des lieux", () => {
  it.each(CINQ_CAS)("%s : se pose avant R2", (_, reponses) => {
    const simulation = Simulation.resume(model.core, reponses);

    expect(simulation.stage.name).toBe("questionnaire");
    expect(simulation.page.id).toBe(BRANCHE);
    expect(
      simulation.questionsOn(simulation.page).map(({ id }) => id),
    ).toContain("Q2.13.sens");
  });

  it("a le libellé et les options de l'éditeur", () => {
    const [[, reponses]] = CINQ_CAS as [Cas];
    const question = sensPose(reponses);

    expect(question?.label).toBe(
      "Quel trajet évaluez-vous dans cette simulation ?",
    );
    expect(
      question?.kind === "single choice"
        ? question.options.map(({ label }) => label)
        : [],
    ).toEqual([
      "L’aller vers le lieu de soins, de séjour ou de permission.",
      "Le retour depuis ce lieu.",
      "L’aller et le retour avec les mêmes besoins et les mêmes règles.",
      "L’aller et le retour avec des besoins ou des règles différents.",
    ]);
  });

  it.each(CINQ_CAS)(
    "%s : le sens qui crée le conflit l'arrête en P2",
    (_, reponses, conflit) => {
      const avecLeSens = { ...reponses, "Q2.13.sens": conflit };
      const simulation = Simulation.resume(model.core, avecLeSens);

      expect(alertes(avecLeSens)).toEqual([LIEUX_INCOMPATIBLES]);
      expect(simulation.stage.name).toBe("questionnaire");
      expect(simulation.page.id).toBe(BRANCHE);
    },
  );

  it.each(CINQ_CAS)(
    "%s : l'autre sens n'alerte pas, et mène à R2",
    (_, reponses, conflit) => {
      const avecLeSens = { ...reponses, "Q2.13.sens": autreSens(conflit) };

      expect(alertes(avecLeSens)).toEqual([]);
      expect(Simulation.resume(model.core, avecLeSens).stage.name).toBe(
        "resultat",
      );
    },
  );

  it("mène aux réponses à revoir, pas au sens", () => {
    const [, sortie, retour] = CINQ_CAS[1] as Cas;
    expect(sensPose({ ...sortie, "Q2.13.sens": retour })?.revisits).toEqual([
      { label: "Revoir la nature du déplacement", question: "Q2.1.g" },
    ]);
  });

  it("un aller-retour différent bloque : deux simulations", () => {
    const [[, reponses]] = CINQ_CAS as [Cas];
    const question = sensPose({
      ...reponses,
      "Q2.13.sens": "4_ALLER_RETOUR_DIFFERENT",
    });
    expect(
      question?.kind === "single choice"
        ? question.options.find(
            ({ value }) => value === "4_ALLER_RETOUR_DIFFERENT",
          )?.blocks
        : undefined,
    ).toBe("Ces deux trajets nécessitent deux simulations distinctes.");
  });

  // Les conflits qu'un sens lève, que #353 laissait à P3 : le sens les change
  // aussi (TS1017-05, l'admission en HAD d'une dialyse).
  it("se pose aussi pour une dialyse et une admission en HAD", () => {
    const reponses = { ...HOSPITALISATION("3_ADMISSION_HAD"), ...DIALYSE };
    expect(sensPose(reponses)).toBeDefined();
    expect(alertes({ ...reponses, "Q2.13.sens": "1_ALLER" })).toEqual([
      LIEUX_INCOMPATIBLES,
    ]);
  });
});

describe("Q2.13.sens ne se pose pas", () => {
  it("quand le sens est seulement documentaire", () => {
    expect(sensPose(HOSPITALISATION("2_SORTIE"))).toBeUndefined();
    expect(sensPose(SANS_SITUATION)).toBeUndefined();
  });

  // Plusieurs permissions sont chacune un aller-retour (D-120) : le sens est
  // acquis, et l'aller-retour se lit comme l'aller.
  it("sur une sortie, plusieurs permissions donnent un aller-retour : pas de conflit", () => {
    const sortie: Reponses = {
      ...PLUSIEURS_PERMISSIONS,
      "Q2.1": "8_HOSPITALISATION",
      "Q2.1.g": "2_SORTIE",
    };
    const simulation = Simulation.resume(model.core, sortie);

    expect(sensPose(sortie)).toBeUndefined();
    expect(simulation.stage.name).toBe("resultat");
  });

  it("sur une sortie, une seule permission laisse le sens à poser", () => {
    expect(
      sensPose({
        ...MINEUR,
        "Q2.1": "8_HOSPITALISATION",
        "Q2.1.g": "2_SORTIE",
      }),
    ).toBeDefined();
  });
});
