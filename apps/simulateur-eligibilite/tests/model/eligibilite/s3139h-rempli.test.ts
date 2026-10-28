// La DAP remplie (#161) : chaque cellule de l'éditeur a son champ ou sa raison
// de rester vide, et un parcours réel s'écrit sur les trois volets du
// gabarit, pages 2 à 4. Rien de médical ne s'écrit hors de la page 2. Ce que
// vaut chaque cellule se teste avec sa rubrique (`rubriques-du-cerfa.test.ts`,
// `rubriques-de-la-pmt.test.ts`, `rubriques-de-la-dap.test.ts`,
// `texte-medical.test.ts`), la consigne du mineur avec la PMT
// (`consigne-du-mineur.test.ts`).

import { describe, expect, it } from "vitest";
import { S3139H } from "../../../front/models/eligibilite/r3/s3139h/s3139h";
import { dtoFrom } from "../../../front/socle/cerfa-mapping";
import { drawnOn, markedStates, textsOn } from "../../socle/cerfa/test-form";
import {
  abscisses,
  DAP,
  donnees,
  ETRANGER,
  gabarit,
  genere,
  type Reponses,
} from "./reponses-du-cerfa";
import type { ValeursDesCibles } from "./traces-du-prescripteur";

// Les cellules de la DAP, recopiées de `mapping_documents.json` (v10.1.3).
const CELLULES = [
  ...["beneficiaire_nom_prenom", "beneficiaire_nir", "beneficiaire_naissance"],
  ...["beneficiaire_adresse", "organisme", "assure_nom_prenom", "assure_nir"],
  ...["tiers_oui", "tiers_non", "tiers_date", "longue_distance", "serie"],
  ...["camsp_cmpp", "engagement_maternite", "avion_bateau", "air_accompagnant"],
  ...["air_hospitalisation", "air_ald_exo", "air_ald_non_exo", "air_atmp"],
  ...["air_atmp_date", "mode_tap_ou_tpmr", "mode_individual", "mode_public"],
  ...["ambulance_position_allongee_demi_assise", "ambulance_oxygene"],
  ...["ambulance_surveillance_constante", "ambulance_brancardage_portage"],
  ...["ambulance_isolement_asepsie", "partage_incompatible", "fauteuil"],
  ...["accompagnant", "lien_ald", "lien_atmp", "lien_atmp_date"],
  ...["depart_domicile", "depart_structure", "depart_autre", "depart_nom"],
  ...["depart_adresse", "depart_complement", "depart_code_postal"],
  ...["depart_commune", "depart_pays", "arrivee_domicile", "arrivee_structure"],
  ...["arrivee_autre", "arrivee_nom", "arrivee_adresse", "arrivee_complement"],
  ...["arrivee_code_postal", "arrivee_commune", "arrivee_pays", "aller_retour"],
  ...["nombre", "urgence_appel15", "urgence_autre", "urgence_precision"],
  ...["elements_medicaux", "centre_rare", "exoneration_oui", "exoneration_non"],
  ...["prescripteur_nom_prenom", "prescripteur_rpps", "structure_nom"],
  ...["structure_adresse", "structure_identifiant", "date_prescription"],
];

// Aucune source fiable : l'identité reste à écrire à la main (D-74).
const IDENTITES = [
  ...["beneficiaire_nom_prenom", "beneficiaire_nir", "beneficiaire_naissance"],
  ...["beneficiaire_adresse", "organisme", "assure_nom_prenom", "assure_nir"],
  ...["prescripteur_nom_prenom", "prescripteur_rpps", "structure_nom"],
  ...["structure_adresse", "structure_identifiant"],
];

// Les parties d'un lieu, écrites ensemble dans sa zone (D-138).
const PARTIES_D_UN_LIEU = ["depart", "arrivee"].flatMap((extremite) =>
  ["nom", "adresse", "complement", "code_postal", "commune", "pays"].map(
    (partie) => `${extremite}_${partie}`,
  ),
);

// La précision facultative du texte médical : une cellule à nous, que le
// cerfa retire faute de place (#159).
const COMMENTAIRE = "elements_medicaux_precision";

const SEANCE = "Ce déplacement concerne une séance de dialyse en centre";
const ARRIVEE = "Centre de dialyse, 149 rue de Sèvres, 75015 Paris";
const VOLETS = [2, 3, 4];

describe("la DAP", () => {
  const portees = [
    ...Object.keys(S3139H.mapping.fields),
    ...Object.keys(S3139H.mapping.drawings),
  ];

  it("donne à chaque cellule de l'éditeur un champ, ou une raison de rester vide", () => {
    const sansRaison = CELLULES.filter(
      (cellule) =>
        !portees.includes(cellule) &&
        !IDENTITES.includes(cellule) &&
        !PARTIES_D_UN_LIEU.includes(cellule),
    );

    expect(CELLULES).toHaveLength(68);
    expect(sansRaison).toEqual([]);
  });

  it("ne porte que des cellules de l'éditeur, et la précision du texte médical", () => {
    expect(portees.filter((cellule) => !CELLULES.includes(cellule))).toEqual([
      COMMENTAIRE,
    ]);
  });
});

describe("la DAP d'une dialyse à plus de 150 km", () => {
  it("sort aplatie, sans champ", async () => {
    expect((await drawnOn(await rempli(DAP))).fields).toBe(0);
  });

  it.each(VOLETS)(
    "écrit le lieu d'arrivée et le nombre sur la page %i",
    async (page) => {
      const ecrit = await textsOn(await rempli(DAP), page);

      expect(ecrit).toEqual(expect.arrayContaining([ARRIVEE, "1"]));
    },
  );

  it("écrit le texte médical sur la page 2 seulement", async () => {
    const pdf = await rempli(DAP);

    expect((await textsOn(pdf, 2)).join(" ")).toContain(SEANCE);
    for (const page of [3, 4])
      expect((await textsOn(pdf, page)).join(" ")).not.toContain("séance");
  });

  it.each([
    ["km", ["Oui"]],
    ["dép", ["Oui"]],
    ["vsl", ["Oui"]],
    ["trans part", ["Oui"]],
    ["bat ou av", []],
    ["sit", []],
    ["samu", []],
    ["alret", []],
  ])("marque la case « %s » : %j", async (champ, etats) => {
    expect(await marquees(DAP, {}, champ)).toEqual(etats);
  });
});

describe("les motifs de la DAP", () => {
  it("cochent ensemble les fondements établis", async () => {
    const cibles = {
      cible_dap_motif_longue_distance: true,
      cible_dap_motif_serie: true,
      cible_dap_motif_camsp_cmpp: true,
    };

    expect(await marquees(DAP, cibles, "km")).toEqual(["Oui", "non", "camsp"]);
  });

  it("ne cochent rien pour le transport à l'étranger à examiner", async () => {
    expect(await marquees(ETRANGER, {}, "km")).toEqual([]);
    expect(await marquees(ETRANGER, {}, "bat ou av")).toEqual([]);
  });

  it("laissent la demande d'examen à l'étranger au seul volet médical", async () => {
    const pdf = await rempli(ETRANGER);
    const examen = "demande d’examen de la prise en charge du transport";

    expect((await textsOn(pdf, 2)).join(" ")).toContain(examen);
    expect((await textsOn(pdf, 3)).join(" ")).not.toContain("examen");
  });
});

describe("le transport par avion ou bateau", () => {
  const AVION = {
    cible_dap_motif_avion_bateau: true,
    cible_personne_accompagnante: true,
    cible_hospitalisation_ou_seances_assimilees: true,
    cible_ald_juridiquement_qualifiante_3_ou_4_degres: true,
    cible_situation_at_mp: true,
  };
  const DATE_AT_MP: Reponses = { ...DAP, "Q3.6.1": "2026-08-12" };

  it.each([
    ["bat ou av", ["Oui"]],
    ["pers acc", ["Oui"]],
    ["sit", ["Oui", "non", "atmp"]],
  ])("coche « %s » : %j", async (champ, etats) => {
    expect(await marquees(DATE_AT_MP, AVION, champ)).toEqual(etats);
  });

  // Une fois sous l'avion ou le bateau, une fois sous le mode de transport.
  it.each(VOLETS)(
    "écrit deux fois la date de l'AT/MP sur la page %i",
    async (page) => {
      const pdf = await rempli(DATE_AT_MP, AVION);
      const ecrit = (await textsOn(pdf, page)).join("");

      expect(ecrit.split("12082026")).toHaveLength(3);
    },
  );
});

describe("les cases inversées du gabarit (D-188)", () => {
  // Le gabarit imprime « non » puis « oui », « ALD exonérante » puis « ALD non
  // exonérante », chacun suivi de sa case : l'état de chaque case n'est pas
  // son libellé.
  it.each([
    ["rap acc", { Oui: 294, non: 327 }],
    ["sit", { Oui: 520, non: 398, ald: 495, atmp: 306 }],
  ])("« %s » range ses cases ainsi : %j", async (champ, rangees) => {
    expect(await abscisses("S3139h", champ)).toEqual(rangees);
  });

  it.each([
    ["2_NON", ["Oui"]],
    ["1_OUI", ["non"]],
  ] as const)(
    "l'accident causé par un tiers %s coche %j",
    async (reponse, etats) => {
      const reponses: Reponses = { ...DAP, "Q3.6.2": reponse };

      expect(await marquees(reponses, {}, "rap acc")).toEqual(etats);
    },
  );

  it("l'ALD exonérante liée à l'avion coche l'état « non »", async () => {
    const cibles = {
      cible_dap_motif_avion_bateau: true,
      cible_hospitalisation_ou_seances_assimilees: false,
      cible_ald_juridiquement_qualifiante_3_ou_4_degres: true,
    };

    expect(await marquees(DAP, cibles, "sit")).toEqual(["non"]);
  });
});

describe("les autres cases de la DAP", () => {
  it.each([
    [
      "ald",
      { cible_ald_juridiquement_qualifiante_3_ou_4_degres: true },
      ["Oui"],
    ],
    [
      "ald",
      {
        cible_ald_juridiquement_qualifiante_3_ou_4_degres: true,
        cible_situation_at_mp: true,
      },
      ["Oui", "non"],
    ],
  ] as const)("« %s » d'après %j : %j", async (champ, cibles, etats) => {
    expect(await marquees(DAP, cibles, champ)).toEqual(etats);
  });

  it.each([
    ["1_OUI", ["Oui"]],
    ["2_NON", []],
  ] as const)("« malrare » d'après Q3.4.a %s : %j", async (centre, etats) => {
    const reponses: Reponses = { ...DAP, "Q3.4.a": centre };
    expect(await marquees(reponses, {}, "malrare")).toEqual(etats);
  });
});

describe("l'urgence de la DAP", () => {
  const AUTRE = { cible_urgence_appel15: false, cible_urgence_autre: true };

  it("coche « autres » hors appel au Centre 15", async () => {
    expect(await marquees(DAP, AUTRE, "samu")).toEqual(["non"]);
  });

  it("coche l'appel au Centre 15 établi", async () => {
    const cibles = { cible_urgence_appel15: true, cible_urgence_autre: false };

    expect(await marquees(DAP, cibles, "samu")).toEqual(["Oui"]);
  });

  it.each(VOLETS)(
    "écrit la précision de l'urgence sur la page %i",
    async (page) => {
      const precision =
        "Douleur thoracique aiguë avec suspicion de syndrome coronarien";
      const pdf = await rempli({ ...DAP, "Q3.5": precision }, AUTRE);

      expect(await textsOn(pdf, page)).toContain(precision);
    },
  );
});

// ---- implémentation ----

// La DAP de ce parcours, remplie sur son gabarit.
function rempli(
  reponses: Reponses,
  cibles: ValeursDesCibles = {},
): Promise<Uint8Array> {
  const dto = dtoFrom(S3139H.mapping, donnees(reponses, cibles));
  return genere(S3139H.cerfa, "S3139h", dto);
}

// Les états marqués de la case `champ`, sur la DAP de ce parcours.
async function marquees(
  reponses: Reponses,
  cibles: ValeursDesCibles,
  champ: string,
): Promise<string[]> {
  const pdf = await rempli(reponses, cibles);
  return markedStates(await gabarit("S3139h"), pdf, champ);
}
