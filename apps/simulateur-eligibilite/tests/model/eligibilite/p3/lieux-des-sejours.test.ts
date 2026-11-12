// Les lieux d'un séjour en cours, d'une admission en HAD, d'une permission et
// d'une séance sans séjour en P3 (Q3.2, Q3.3) : les rôles de QST-LIEUX-001
// (`REFERENTIEL/02`). Le lieu de vie d'une permission n'est pas présumé
// domicile, une séance ne présume pas l'hôpital, et deux rôles qui se
// contredisent se refusent (#277).

import { describe, expect, it } from "vitest";
import { ciblesValant } from "../r2/traces-du-prescripteur";
import {
  ADRESSE,
  ALLER,
  ids,
  optionsDe,
  posee,
  posees,
  RETOUR,
  type Reponses,
  rappel,
} from "./questions-des-lieux";

describe("les lieux d'un séjour, d'une HAD et d'une permission (QST-LIEUX-001)", () => {
  it("une admission en HAD de Q2.1.g arrive au domicile sans présumer l'hôpital au départ", () => {
    const had: Reponses = { ...RETOUR, "Q2.1.g": "3_ADMISSION_HAD" };
    expect(ids("P3/depart", had)).toContain("Q3.2.categorie");
    expect(optionsDe("P3/depart", "Q3.2.categorie", had)).toContain(
      "3_AUTRE_LIEU",
    );
    expect(ids("P3/arrivee", had)).toEqual(["Q3.3.adresse"]);
  });

  it("elle part de l'établissement quand le patient y séjourne", () => {
    const had: Reponses = {
      ...RETOUR,
      "Q2.2.1": ["1_HOSPITALISATION"],
      "Q2.2.1.cadre": "1_ETABLISSEMENT",
      "Q2.1.g": "3_ADMISSION_HAD",
    };
    expect(rappel("P3/depart", "Q3.2.nom", had)).toEqual([
      { label: "Lieu de départ", value: "L’établissement de santé quitté" },
    ]);
  });

  it("un EHPAD, autre lieu, se choisit au départ comme à l'arrivée d'un transfert", () => {
    const transfert: Reponses = { ...ALLER, "Q2.5": "1_TRANSFERT" };
    expect(optionsDe("P3/depart", "Q3.2.categorie", transfert)).toContain(
      "3_AUTRE_LIEU",
    );
    expect(
      optionsDe("P3/arrivee", "Q3.3.categorie", {
        ...transfert,
        "Q3.2.categorie": "2_STRUCTURE_DE_SOINS",
        "Q3.2.adresse": ADRESSE,
      }),
    ).toContain("3_AUTRE_LIEU");
  });

  // Le sens vient de Q3.1.2, pas de Q2.8.5 (D-284).
  it("plusieurs permissions du S3141, en aller-retour, partent de l'établissement, sans domicile présumé", () => {
    const S3141 = ciblesValant({ cible_support_id: "S3141" });
    const permissions: Reponses = {
      "Q2.2.1": ["1_HOSPITALISATION"],
      "Q2.2.1.cadre": "1_ETABLISSEMENT",
      "Q2.2.1.a": "1_OUI",
      "Q2.8.5": "1_OUI",
      "Q3.1.2": "3_ALLER_RETOUR_EQUIVALENT",
    };
    expect(
      posees("P3/depart", permissions, S3141).find(
        ({ id }) => id === "Q3.2.nom",
      )?.reminder,
    ).toEqual([
      {
        label: "Lieu de départ",
        value: "L’établissement de santé où le patient séjourne",
      },
    ]);
    expect(
      posees("P3/arrivee", permissions, S3141).map(({ id }) => id),
    ).toContain("Q3.3.categorie");
  });

  it("le lieu de vie d'une permission se choisit, sans domicile présumé", () => {
    const aller: Reponses = { ...ALLER, "Q2.2.1.a": "1_OUI" };
    expect(optionsDe("P3/arrivee", "Q3.3.categorie", aller)).toEqual([
      "1_DOMICILE",
      "3_AUTRE_LIEU",
    ]);
  });

  it("le retour d'une permission part du lieu de vie, choisi", () => {
    const retour: Reponses = { ...RETOUR, "Q2.2.1.a": "1_OUI" };
    expect(optionsDe("P3/depart", "Q3.2.categorie", retour)).toEqual([
      "1_DOMICILE",
      "3_AUTRE_LIEU",
    ]);
    expect(rappel("P3/arrivee", "Q3.3.nom", retour)).toEqual([
      {
        label: "Lieu d’arrivée",
        value: "L’établissement de santé où le patient séjourne",
      },
    ]);
  });

  it("une permission vers la prison garde l'établissement pénitentiaire", () => {
    const prison: Reponses = {
      ...RETOUR,
      "Q2.2.1.a": "1_OUI",
      "Q2.2.1": ["1_HOSPITALISATION", "10_RETOUR_PENITENTIAIRE"],
      "Q2.2.1.b": ["0_AUCUN"],
    };
    expect(rappel("P3/depart", "Q3.2.nom", prison)).toEqual([
      {
        label: "Lieu de départ",
        value: "L’établissement de santé où le patient séjourne",
      },
    ]);
    expect(rappel("P3/arrivee", "Q3.3.nom", prison)).toEqual([
      {
        label: "Lieu d’arrivée",
        value: "L’établissement pénitentiaire où le patient retourne",
      },
    ]);
  });

  const AUTRE_DEPLACEMENT: Reponses = {
    "Q2.2.1": ["1_HOSPITALISATION"],
    "Q2.2.1.cadre": "1_ETABLISSEMENT",
    "Q2.2.1.a": "2_NON",
    "Q2.5": "2_AUTRE_DEPLACEMENT",
  };

  it("un autre déplacement pendant un séjour en établissement en part, et y revient", () => {
    const sejour = AUTRE_DEPLACEMENT;
    const etablissement = "L’établissement de santé où le patient séjourne";
    expect(rappel("P3/depart", "Q3.2.nom", { ...ALLER, ...sejour })).toEqual([
      { label: "Lieu de départ", value: etablissement },
    ]);
    expect(rappel("P3/arrivee", "Q3.3.nom", { ...RETOUR, ...sejour })).toEqual([
      { label: "Lieu d’arrivée", value: etablissement },
    ]);
  });

  it("une admission en HAD déclarée comme autre déplacement part de l'établissement vers le domicile (#311)", () => {
    const sortie: Reponses = {
      ...RETOUR,
      ...AUTRE_DEPLACEMENT,
      "Q2.6": ["10_ADMISSION_HAD"],
    };
    expect(rappel("P3/depart", "Q3.2.nom", sortie)).toEqual([
      { label: "Lieu de départ", value: "L’établissement de santé quitté" },
    ]);
    expect(
      posee("P3/depart", "Q3.2.adresse", { ...sortie, "Q3.2.adresse": ADRESSE })
        .inconsistencies,
    ).toEqual([]);
    expect(ids("P3/arrivee", sortie)).toEqual(["Q3.3.adresse"]);
  });

  it("l'établissement du séjour ne se redemande pas : seul l'autre lieu se choisit", () => {
    const aller = { ...ALLER, ...AUTRE_DEPLACEMENT };
    const retour = { ...RETOUR, ...AUTRE_DEPLACEMENT };
    const etablissement = (lieu: string) => [
      `${lieu}.nom`,
      `${lieu}.service`,
      `${lieu}.adresse`,
    ];
    expect(ids("P3/depart", aller)).toEqual(etablissement("Q3.2"));
    expect(ids("P3/arrivee", aller)).toEqual([
      "Q3.3.categorie",
      "Q3.3.adresse",
    ]);
    expect(ids("P3/depart", retour)).toEqual([
      "Q3.2.categorie",
      "Q3.2.adresse",
    ]);
    expect(ids("P3/arrivee", retour)).toEqual(etablissement("Q3.3"));
  });

  // L'USLD de Q2.6 peut être l'établissement du séjour, une structure de soins
  // comme lui (D-244) : l'autre lieu reste libre.
  it("avec l'USLD de Q2.6, l'établissement du séjour est une structure, et l'autre lieu reste libre", () => {
    const usld: Reponses = {
      ...AUTRE_DEPLACEMENT,
      "Q2.6": ["6_USLD"],
      "Q3.2.adresse": ADRESSE,
    };
    const aller = { ...ALLER, ...usld };
    expect(ids("P3/depart", aller)).toEqual([
      "Q3.2.nom",
      "Q3.2.service",
      "Q3.2.adresse",
    ]);
    expect(optionsDe("P3/arrivee", "Q3.3.categorie", aller)).toContain(
      "1_DOMICILE",
    );
    const depuisLeDomicile = { "Q3.2.categorie": "1_DOMICILE" } as const;
    expect(
      ids("P3/arrivee", { ...RETOUR, ...usld, ...depuisLeDomicile }),
    ).toEqual(["Q3.3.nom", "Q3.3.service", "Q3.3.adresse"]);
  });

  // Une séance n'est pas un séjour : sans hospitalisation en cours, le départ
  // de l'aller et l'arrivée du retour se choisissent, domicile compris.
  it.each<[string, Reponses]>([
    ["une chimiothérapie", { "Q1.3": ["3_CHIMIOTHERAPIE"] }],
    ["une hémodialyse", { "Q1.3": ["5_DIALYSE"], "Q1.3.a": "1_OUI" }],
  ])("%s sans séjour en cours ne part pas de l'hôpital", (_cas, seance) => {
    const aller = { ...ALLER, ...seance };
    expect(ids("P3/depart", aller)).toEqual(["Q3.2.categorie", "Q3.2.adresse"]);
    expect(optionsDe("P3/depart", "Q3.2.categorie", aller)).toContain(
      "1_DOMICILE",
    );
    expect(
      optionsDe("P3/arrivee", "Q3.3.categorie", { ...RETOUR, ...seance }),
    ).toContain("1_DOMICILE");
  });

  it("des soins pendant une HAD partent du domicile, sans établissement inventé", () => {
    const had: Reponses = {
      ...ALLER,
      "Q2.2.1": ["1_HOSPITALISATION"],
      "Q2.2.1.cadre": "2_HAD",
    };
    expect(ids("P3/depart", had)).toEqual(["Q3.2.adresse"]);
    expect(optionsDe("P3/arrivee", "Q3.3.categorie", had)).not.toContain(
      "1_DOMICILE",
    );
  });

  const CONTRADICTION = [
    "Les réponses précédentes donnent au départ ou à l’arrivée deux lieux différents. Revenez par « Précédent » pour les corriger.",
  ];
  const incoherencesDuDepart = (reponses: Reponses) =>
    posee("P3/depart", "Q3.2.adresse", { ...reponses, "Q3.2.adresse": ADRESSE })
      .inconsistencies;
  const PERMISSION: Reponses = {
    "Q2.2.1": ["1_HOSPITALISATION"],
    "Q2.2.1.cadre": "1_ETABLISSEMENT",
    "Q2.2.1.a": "1_OUI",
  };

  it("deux rôles contradictoires se refusent : une permission ne part pas du domicile d'une HAD", () => {
    expect(
      incoherencesDuDepart({
        ...ALLER,
        ...PERMISSION,
        "Q2.2.1.cadre": "2_HAD",
      }),
    ).toEqual(CONTRADICTION);
  });

  // Une dialyse cochée en partie 1 fixe le centre de dialyse comme lieu de
  // soins : il contredit le lieu de vie de la permission, au départ de l'aller
  // comme à l'arrivée du retour, et l'hôpital d'une admission en HAD.
  it.each<[string, Reponses]>([
    ["une permission, à l'aller", { ...ALLER, ...PERMISSION }],
    ["une permission, au retour", { ...RETOUR, ...PERMISSION }],
    [
      "une admission en HAD, à l'aller",
      { ...ALLER, "Q2.1.g": "3_ADMISSION_HAD" },
    ],
  ])("une dialyse de la partie 1 contredit %s", (_cas, reponses) => {
    expect(
      incoherencesDuDepart({ ...reponses, "Q1.3": ["5_DIALYSE"] }),
    ).toEqual(CONTRADICTION);
  });

  it("une dialyse pendant un séjour en HAD ne contredit rien", () => {
    expect(
      incoherencesDuDepart({
        ...ALLER,
        "Q1.3": ["5_DIALYSE"],
        "Q2.2.1": ["1_HOSPITALISATION"],
        "Q2.2.1.cadre": "2_HAD",
      }),
    ).toEqual([]);
  });

  it("le HTNM est l'arrivée de l'aller et le départ du retour", () => {
    const htnm: Reponses = {
      "Q2.2.1": ["5_HTNM"],
      "Q2.2.1.b": ["0_AUCUN"],
    };
    const lieu = [
      {
        label: "Lieu d’arrivée",
        value: "L’hébergement temporaire non médicalisé",
      },
    ];
    expect(rappel("P3/arrivee", "Q3.3.nom", { ...ALLER, ...htnm })).toEqual(
      lieu,
    );
    expect(rappel("P3/depart", "Q3.2.nom", { ...RETOUR, ...htnm })).toEqual([
      { ...lieu[0], label: "Lieu de départ" },
    ]);
  });
});
