// La PMT remplie (#160) : chaque cellule de l'éditeur a son champ ou sa raison
// de rester vide, et un parcours réel s'écrit sur les deux volets du gabarit,
// pages 3 et 4. Rien de médical ne s'écrit sur la page 4. Ce que vaut chaque
// cellule se teste avec sa rubrique (`rubriques-du-cerfa.test.ts`,
// `rubriques-de-la-pmt.test.ts`, `texte-medical.test.ts`).

import { describe, expect, it } from "vitest";
import { S3138G } from "../../../front/models/eligibilite/r3/s3138g/s3138g";
import { dtoFrom } from "../../../front/socle/cerfa-mapping";
import { drawnOn, markedStates, textsOn } from "../../socle/cerfa/test-form";
import {
  donnees,
  gabarit,
  genere,
  PMT,
  type Reponses,
} from "./reponses-du-cerfa";
import type { ValeursDesCibles } from "./traces-du-praticien";

// Les cellules de la PMT, recopiées de `mapping_documents.json` (v10.1.3).
const CELLULES = [
  ...["beneficiaire_nom_prenom", "beneficiaire_nir", "beneficiaire_naissance"],
  ...["beneficiaire_adresse", "organisme", "assure_nom_prenom", "assure_nir"],
  ...["tiers_oui", "tiers_non", "tiers_date", "hospitalisation", "ald_exo"],
  ...["ald_non_exo", "atmp", "atmp_date"],
  ...["mode_tap_ou_tpmr", "mode_individual", "mode_public"],
  ...["ambulance_position_allongee_demi_assise", "ambulance_oxygene"],
  ...["ambulance_surveillance_constante", "ambulance_brancardage_portage"],
  ...["ambulance_isolement_asepsie", "partage_incompatible", "fauteuil"],
  ...["accompagnant", "depart_domicile", "depart_structure", "depart_autre"],
  ...["depart_nom", "depart_adresse", "depart_complement"],
  ...["depart_code_postal", "depart_commune", "depart_pays"],
  ...["arrivee_domicile", "arrivee_structure", "arrivee_autre", "arrivee_nom"],
  ...["arrivee_adresse", "arrivee_complement", "arrivee_code_postal"],
  ...["arrivee_commune", "arrivee_pays", "aller_retour", "nombre"],
  ...["urgence_appel15", "urgence_autre", "urgence_precision"],
  ...["elements_medicaux", "centre_rare", "exoneration_oui"],
  ...["exoneration_non", "pension_militaire_oui", "pension_militaire_non"],
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

describe("la PMT", () => {
  const portees = [
    ...Object.keys(S3138G.mapping.fields),
    ...Object.keys(S3138G.mapping.drawings),
  ];

  it("donne à chaque cellule de l'éditeur un champ, ou une raison de rester vide", () => {
    const sansRaison = CELLULES.filter(
      (cellule) =>
        !portees.includes(cellule) &&
        !IDENTITES.includes(cellule) &&
        !PARTIES_D_UN_LIEU.includes(cellule),
    );

    expect(CELLULES).toHaveLength(61);
    expect(sansRaison).toEqual([]);
  });

  it("ne porte que des cellules de l'éditeur, et la précision du texte médical", () => {
    expect(portees.filter((cellule) => !CELLULES.includes(cellule))).toEqual([
      COMMENTAIRE,
    ]);
  });
});

describe("la PMT d'une dialyse", () => {
  it("sort aplatie, sans champ", async () => {
    expect((await drawnOn(await rempli(PMT))).fields).toBe(0);
  });

  it.each([3, 4])(
    "écrit le lieu d'arrivée et le nombre sur la page %i",
    async (page) => {
      const ecrit = await textsOn(await rempli(PMT), page);

      expect(ecrit).toEqual(expect.arrayContaining([ARRIVEE, "1"]));
    },
  );

  it("écrit le texte médical sur la page 3 seulement", async () => {
    const pdf = await rempli(PMT);

    expect((await textsOn(pdf, 3)).join(" ")).toContain(SEANCE);
    expect((await textsOn(pdf, 4)).join(" ")).not.toContain("séance");
  });

  it.each([
    ["domicile", ["On"]],
    ["non", ["NON"]],
    ["oui1", ["NON"]],
    ["oui", []],
    ["domicile_2", []],
    ["transp aller-retour", []],
    ["Urg SAMU centre 15", []],
    ["autres", []],
    ["transp autre cent", []],
  ])("marque la case « %s » : %j", async (champ, etats) => {
    expect(await marquees(PMT, {}, champ)).toEqual(etats);
  });
});

describe("les cases de la PMT", () => {
  it.each([
    [
      "entré sortie hosp",
      { cible_hospitalisation_ou_seances_assimilees: true },
      ["NON"],
    ],
    [
      "ALD exo",
      { cible_ald_juridiquement_qualifiante_3_ou_4_degres: true },
      ["OUI"],
    ],
    ["ALD exo", { cible_mineur_ald_non_exonerante_reconnue: true }, ["NON"]],
    [
      "transport lié à un accident du travail ou une maladie professionnelle",
      { cible_situation_at_mp: true },
      ["On"],
    ],
    [
      "transp autre cent",
      { cible_centre_reference_destination_reelle: true },
      ["On"],
    ],
    ["oui2", { cible_situation_pension_militaire: true }, ["OUI"]],
    ["oui2", { cible_situation_pension_militaire: false }, ["NON"]],
    ["oui2", { cible_situation_pension_militaire: undefined }, []],
  ] as const)("« %s » d'après %j : %j", async (champ, cibles, etats) => {
    expect(await marquees(PMT, cibles, champ)).toEqual(etats);
  });

  it("écrivent la mention du mineur sur la page 3 seulement (#128)", async () => {
    const cibles = { cible_mineur_ald_non_exonerante_reconnue: true };
    const pdf = await rempli(PMT, cibles);

    expect((await textsOn(pdf, 3)).join(" ")).toContain(
      "Mineur nécessitant des soins prolongés",
    );
    expect((await textsOn(pdf, 4)).join(" ")).not.toContain("Mineur");
  });
});

describe("l'urgence de la PMT", () => {
  const AUTRE = { cible_urgence_appel15: false, cible_urgence_autre: true };
  const PRECISION: Reponses = { ...PMT, "Q3.5": "Douleur thoracique" };

  it("coche « autres » sur les deux volets", async () => {
    expect(await marquees(PRECISION, AUTRE, "autres")).toEqual(["On"]);
  });

  it.each([3, 4])(
    "dessine la précision de l'urgence sur la page %i",
    async (page) => {
      const pdf = await rempli(PRECISION, AUTRE);

      expect(await textsOn(pdf, page)).toContain("Douleur thoracique");
    },
  );

  it.each([3, 4])(
    "garde sur une ligne, page %i, une précision longue de l'urgence",
    async (page) => {
      const precision =
        "Douleur thoracique aiguë avec suspicion de syndrome coronarien";
      const pdf = await rempli({ ...PMT, "Q3.5": precision }, AUTRE);

      expect(await textsOn(pdf, page)).toContain(precision);
    },
  );

  it("coche l'appel au Centre 15 établi", async () => {
    const cibles = { cible_urgence_appel15: true, cible_urgence_autre: false };

    expect(await marquees(PMT, cibles, "Urg SAMU centre 15")).toEqual(["On"]);
  });
});

// ---- implémentation ----

// La PMT de ce parcours, remplie sur son gabarit.
function rempli(
  reponses: Reponses,
  cibles: ValeursDesCibles = {},
): Promise<Uint8Array> {
  const dto = dtoFrom(S3138G.mapping, donnees(reponses, cibles));
  return genere(S3138G.cerfa, "S3138g", dto);
}

// Les états marqués de la case `champ`, sur la PMT de ce parcours.
async function marquees(
  reponses: Reponses,
  cibles: ValeursDesCibles,
  champ: string,
): Promise<string[]> {
  const pdf = await rempli(reponses, cibles);
  return markedStates(await gabarit("S3138g"), pdf, champ);
}
