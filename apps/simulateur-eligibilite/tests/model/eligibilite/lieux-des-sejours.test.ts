// Les lieux d'un séjour en cours, d'une admission en HAD et d'une permission
// en P3 (Q3.2, Q3.3) : les rôles de QST-LIEUX-001 (`REFERENTIEL/02`). Le lieu de
// vie d'une permission n'est pas présumé domicile, et deux rôles qui se
// contredisent se refusent (#277).

import { describe, expect, it } from "vitest";
import {
  ADRESSE,
  ALLER,
  ids,
  naturesDe,
  posee,
  posees,
  RETOUR,
  type Reponses,
  rappel,
} from "./questions-des-lieux";
import { ciblesValant } from "./traces-du-prescripteur";

describe("les lieux d'un séjour, d'une HAD et d'une permission (QST-LIEUX-001)", () => {
  it("une admission en HAD de Q2.1.g arrive au domicile sans présumer l'hôpital au départ", () => {
    const had: Reponses = { ...RETOUR, "Q2.1.g": "3_ADMISSION_HAD" };
    expect(ids("P3/depart", had)).toContain("Q3.2.nature");
    expect(naturesDe("P3/depart", "Q3.2.nature", had)).toContain("3_EHPAD");
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

  it("une EHPAD se choisit au départ comme à l'arrivée d'un transfert", () => {
    const transfert: Reponses = { ...ALLER, "Q2.5": "1_TRANSFERT" };
    expect(naturesDe("P3/depart", "Q3.2.nature", transfert)).toContain(
      "3_EHPAD",
    );
    expect(
      naturesDe("P3/arrivee", "Q3.3.nature", {
        ...transfert,
        "Q3.2.nature": "2_ETABLISSEMENT_DE_SANTE",
        "Q3.2.adresse": ADRESSE,
      }),
    ).toContain("3_EHPAD");
  });

  it("plusieurs permissions du S3141 partent de l'établissement, sans Q3.1.2 ni domicile présumé", () => {
    const S3141 = ciblesValant({ cible_support_id: "S3141" });
    const permissions: Reponses = {
      "Q2.1": "11_PERMISSION",
      "Q2.8.5": "1_OUI",
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
    ).toContain("Q3.3.nature");
  });

  it("le lieu de vie d'une permission se choisit, sans domicile présumé", () => {
    const aller: Reponses = { ...ALLER, "Q2.2.1.a": "1_OUI" };
    expect(naturesDe("P3/arrivee", "Q3.3.nature", aller)).toEqual([
      "1_DOMICILE",
      "3_EHPAD",
      "5_HEBERGEMENT_NON_MEDICALISE",
      "8_AUTRE_LIEU",
    ]);
  });

  it("le retour d'une permission part du lieu de vie, choisi", () => {
    const retour: Reponses = { ...RETOUR, "Q2.2.1.a": "1_OUI" };
    expect(naturesDe("P3/depart", "Q3.2.nature", retour)).toEqual([
      "1_DOMICILE",
      "3_EHPAD",
      "5_HEBERGEMENT_NON_MEDICALISE",
      "8_AUTRE_LIEU",
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
      "Q2.2.1": ["1_HOSPITALISATION", "3_AUTRE_CADRE"],
      "Q2.2.1.b": ["10_RETOUR_PENITENTIAIRE"],
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

  it("un autre déplacement pendant un séjour en établissement en part, et y revient", () => {
    const sejour: Reponses = {
      "Q2.2.1": ["1_HOSPITALISATION"],
      "Q2.2.1.cadre": "1_ETABLISSEMENT",
      "Q2.2.1.a": "2_NON",
      "Q2.5": "2_AUTRE_DEPLACEMENT",
    };
    const etablissement = "L’établissement de santé où le patient séjourne";
    expect(rappel("P3/depart", "Q3.2.nom", { ...ALLER, ...sejour })).toEqual([
      { label: "Lieu de départ", value: etablissement },
    ]);
    expect(rappel("P3/arrivee", "Q3.3.nom", { ...RETOUR, ...sejour })).toEqual([
      { label: "Lieu d’arrivée", value: etablissement },
    ]);
  });

  it("des soins pendant une HAD partent du domicile, sans établissement inventé", () => {
    const had: Reponses = {
      ...ALLER,
      "Q2.2.1": ["1_HOSPITALISATION"],
      "Q2.2.1.cadre": "2_HAD",
    };
    expect(ids("P3/depart", had)).toEqual(["Q3.2.adresse"]);
    expect(naturesDe("P3/arrivee", "Q3.3.nature", had)).not.toContain(
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
      "Q2.2.1": ["3_AUTRE_CADRE"],
      "Q2.2.1.b": ["5_HTNM"],
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
