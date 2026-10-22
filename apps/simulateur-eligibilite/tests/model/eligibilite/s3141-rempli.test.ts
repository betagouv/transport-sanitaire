// Le S3141 rempli (#158) : chaque cellule de l'éditeur a son champ ou sa
// raison de rester vide, et un parcours réel s'écrit sur le gabarit. Ce que
// vaut chaque cellule se teste avec sa rubrique (`rubriques-du-cerfa.test.ts`).

import { PDFDict, PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { S3141 } from "../../../front/models/eligibilite/r3/s3141/s3141";
import { dtoFrom } from "../../../front/socle/cerfa-mapping";
import { drawnOn, markedStates } from "../../socle/cerfa/test-form";
import {
  donnees,
  gabarit,
  genere,
  PERMISSIONS,
  type Reponses,
} from "./reponses-du-cerfa";

// Les cellules du S3141, recopiées de `mapping_documents.json` (v10.1.3).
const CELLULES = [
  ...["beneficiaire_nom_prenom", "beneficiaire_nir", "beneficiaire_naissance"],
  ...["beneficiaire_adresse", "assure_nom_prenom", "assure_nir"],
  ...["tiers_oui", "tiers_non", "tiers_date", "debut_hospitalisation"],
  ...["mode_tap_ou_tpmr", "mode_individual", "mode_public"],
  ...["ambulance_position_allongee_demi_assise", "ambulance_oxygene"],
  ...["ambulance_surveillance_constante", "ambulance_brancardage_portage"],
  ...["ambulance_isolement_asepsie", "partage_incompatible", "fauteuil"],
  ...["accompagnant", "lien_ald", "lien_atmp", "lien_atmp_date"],
  ...["depart_domicile", "depart_structure", "depart_autre", "depart_nom"],
  ...["depart_adresse", "depart_complement", "depart_code_postal"],
  ...["depart_commune", "depart_pays", "arrivee_domicile"],
  ...["arrivee_structure", "arrivee_autre", "arrivee_nom", "arrivee_adresse"],
  ...["arrivee_complement", "arrivee_code_postal", "arrivee_commune"],
  ...["arrivee_pays", "aller_retour", "nombre", "periode_fin"],
  ...["exoneration_oui", "exoneration_non", "prescripteur_nom_prenom"],
  ...["prescripteur_rpps", "structure_nom", "structure_adresse"],
  ...["structure_identifiant", "date_prescription"],
];

// Aucune source fiable : l'identité reste à écrire à la main (D-74).
const IDENTITES = [
  ...["beneficiaire_nom_prenom", "beneficiaire_nir", "beneficiaire_naissance"],
  ...["beneficiaire_adresse", "assure_nom_prenom", "assure_nir"],
  ...["prescripteur_nom_prenom", "prescripteur_rpps", "structure_nom"],
  ...["structure_adresse", "structure_identifiant"],
];

// Les parties d'un lieu, écrites ensemble dans sa zone (D-138).
const PARTIES_D_UN_LIEU = ["depart", "arrivee"].flatMap((extremite) =>
  ["nom", "adresse", "complement", "code_postal", "commune", "pays"].map(
    (partie) => `${extremite}_${partie}`,
  ),
);

describe("le S3141", () => {
  it("donne à chaque cellule de l'éditeur un champ, ou une raison de rester vide", () => {
    const portees = Object.keys(S3141.mapping.fields);
    const sansRaison = CELLULES.filter(
      (cellule) =>
        !portees.includes(cellule) &&
        !IDENTITES.includes(cellule) &&
        !PARTIES_D_UN_LIEU.includes(cellule),
    );

    expect(CELLULES).toHaveLength(53);
    expect(sansRaison).toEqual([]);
  });

  it("ne porte que des cellules de l'éditeur", () => {
    const portees = Object.keys(S3141.mapping.fields);

    expect(portees.filter((cellule) => !CELLULES.includes(cellule))).toEqual(
      [],
    );
  });
});

describe("le S3141 de plusieurs permissions", () => {
  const ACCIDENT: Reponses = {
    ...PERMISSIONS,
    "Q3.6.2": "1_OUI",
    "Q3.6.3": "2026-09-30",
  };

  it("sort aplati, sans champ", async () => {
    expect((await drawnOn(await rempli(ACCIDENT))).fields).toBe(0);
  });

  it("écrit les dates en chiffres sur leurs cases, le nombre et le départ", async () => {
    const ecrit = (await drawnOn(await rempli(ACCIDENT))).texts.join("");

    for (const texte of [
      "30092026", // l'accident
      "01102026", // le début de l'hospitalisation
      "01122026", // la fin de la période
      "22102026", // la prescription
      "4",
      "Hôpital Necker, 149 rue de Sèvres, 75015 Paris",
    ])
      expect(ecrit).toContain(texte);
  });

  it("coche l'accident causé par un tiers à côté du « oui » imprimé, à droite du « non » (D-139)", async () => {
    const pdf = await rempli(ACCIDENT);
    const [coche] = await markedStates(await gabarit("S3141"), pdf, "rct");

    expect(await abscisses("rct")).toEqual({ Oui: 288, non: 368 });
    expect(coche).toBe("non");
  });

  it.each([
    ["mt", ["Oui"]],
    ["arr dom", ["Oui"]],
    ["a/r", ["Oui"]],
    ["dép dom", []],
    ["assis", []],
    ["exo", []],
  ])("marque la case « %s » : %j", async (champ, etats) => {
    const pdf = await rempli(ACCIDENT);

    expect(await markedStates(await gabarit("S3141"), pdf, champ)).toEqual(
      etats,
    );
  });

  it("coche « non » à gauche quand l'accident n'est pas causé par un tiers", async () => {
    const pdf = await rempli(PERMISSIONS);

    expect(await markedStates(await gabarit("S3141"), pdf, "rct")).toEqual([
      "Oui",
    ]);
  });

  it("sans réponse sur l'accident, ne marque ni Oui ni Non", async () => {
    const { "Q3.6.2": _, ...sansReponse } = PERMISSIONS;
    const pdf = await rempli(sansReponse);

    expect(await markedStates(await gabarit("S3141"), pdf, "rct")).toEqual([]);
  });

  it("écrit en entier un établissement au nom et à l'adresse très longs", async () => {
    const reponses: Reponses = {
      ...PERMISSIONS,
      "Q3.2.nom": "Centre hospitalier universitaire, service de pédiatrie",
      "Q3.2.adresse": {
        street: "3175 chemin de la Côte-Sainte-Catherine prolongée",
        complement: "Bâtiment 7, escalier B, porte 12",
        postalCode: "13009",
        city: "Marseille",
      },
    };

    expect((await drawnOn(await rempli(reponses))).texts.join("")).toContain(
      "Centre hospitalier universitaire, service de pédiatrie, 3175 chemin " +
        "de la Côte-Sainte-Catherine prolongée, Bâtiment 7, escalier B, " +
        "porte 12, 13009 Marseille",
    );
  });
});

// ---- implémentation ----

// Le S3141 de ce parcours, rempli sur son gabarit.
function rempli(reponses: Reponses): Promise<Uint8Array> {
  const dto = dtoFrom(S3141.mapping, donnees(reponses));
  return genere(S3141.cerfa, "S3141", dto);
}

// L'abscisse arrondie de chaque case du champ, par état d'export.
async function abscisses(champ: string): Promise<Record<string, number>> {
  const document = await PDFDocument.load(await gabarit("S3141"));
  const widgets = document.getForm().getField(champ).acroField.getWidgets();
  return Object.fromEntries(
    widgets.flatMap((widget) => {
      const normal = widget.getAppearances()?.normal;
      const etats = normal instanceof PDFDict ? normal.keys() : [];
      return etats
        .map((etat) => etat.asString().slice(1))
        .filter((etat) => etat !== "Off")
        .map((etat) => [etat, Math.round(widget.getRectangle().x)]);
    }),
  );
}
