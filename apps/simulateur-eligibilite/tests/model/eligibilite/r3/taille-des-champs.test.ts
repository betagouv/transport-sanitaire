// La taille des champs de chaque document de R3 (ANA22-03) : chaque texte que
// nous remplissons se mesure sous son identifiant fermé, `<support>.<champ>`,
// et les parties d'une adresse de départ ou d'arrivée sous un seul,
// `*_adresse_native`. Les champs jamais remplis chez nous (bénéficiaire hors
// son adresse, assuré, prescripteur, structure, `S3141.cadence`) n'y sont pas.

import { describe, expect, it } from "vitest";
import { S3138G } from "../../../../front/models/eligibilite/r3/s3138g/s3138g";
import { S3139H } from "../../../../front/models/eligibilite/r3/s3139h/s3139h";
import { S3141 } from "../../../../front/models/eligibilite/r3/s3141/s3141";
import {
  type BoundCerfa,
  type CerfaDto,
  generateCerfa,
} from "../../../../front/socle/cerfa";
import { TYPOGRAPHIC_FIELDS } from "../../../../shared/analytics/typographic-fields";
import { gabarit } from "./reponses-du-cerfa";

const COMMUNS = [
  "beneficiaire_adresse",
  "tiers_date",
  "nombre",
  "date_prescription",
  "depart_adresse_native",
  "arrivee_adresse_native",
];

const DOCUMENTS = [
  {
    support: "S3138g",
    cerfa: S3138G,
    champs: [...COMMUNS, "atmp_date", "urgence_precision", "elements_medicaux"],
  },
  {
    support: "S3139h",
    cerfa: S3139H,
    champs: [
      ...COMMUNS,
      "air_atmp_date",
      "lien_atmp_date",
      "urgence_precision",
      "elements_medicaux",
    ],
  },
  {
    support: "S3141",
    cerfa: S3141,
    champs: [
      ...COMMUNS,
      "debut_hospitalisation",
      "lien_atmp_date",
      "periode_fin",
    ],
  },
] as const;

// Les champs que nous ne remplissons jamais : aucune source fiable (D-74).
const JAMAIS_REMPLIS = [
  /\.beneficiaire_(nom_prenom|nir|naissance)$/,
  /\.organisme$/,
  /\.assure_/,
  /\.prescripteur_/,
  /\.structure_/,
  /^S3141\.cadence$/,
];

describe.each(DOCUMENTS)("la taille des champs du $support", (document) => {
  it("chaque texte rempli se mesure sous son identifiant fermé", async () => {
    const { sizes, unmeasured } = await typographieDe(document, {});

    const mesures = [...Object.keys(sizes), ...unmeasured];
    expect(mesures.sort()).toEqual(
      document.champs.map((champ) => `${document.support}.${champ}`).sort(),
    );
    const fermes: readonly string[] = TYPOGRAPHIC_FIELDS[document.support];
    for (const champ of mesures) {
      expect(fermes).toContain(champ);
      for (const jamais of JAMAIS_REMPLIS) expect(champ).not.toMatch(jamais);
    }
  });

  it("les deux parties d'une adresse comptent une fois, à leur plus petite taille", async () => {
    const longue = "Centre hospitalier régional, ".repeat(6);
    const seule = await typographieDe(document, {
      depart_structure: longue,
    });
    const ensemble = await typographieDe(document, {
      depart_structure: longue,
      depart_autre: "Domicile",
    });

    const adresse = `${document.support}.depart_adresse_native`;
    expect(seule.sizes[adresse]).toBeLessThan(9);
    expect(ensemble.sizes[adresse]).toBe(seule.sizes[adresse]);
  });
});

// ---- implémentation ----

// La taille des textes du document où chaque texte est rempli : une date pour
// une date, un texte court sinon, sauf ceux que le test donne.
async function typographieDe(
  { support, cerfa: { cerfa } }: { support: string; cerfa: BoundCerfa },
  donnes: Readonly<Record<string, string>>,
) {
  const fields = Object.fromEntries(
    Object.entries(cerfa.fields).flatMap(([cle, binding]) => {
      if ("state" in binding) return [];
      const date = "date" in binding && binding.date;
      return [[cle, donnes[cle] ?? (date ? "2026-11-17" : "Court")]];
    }),
  );
  const drawings = Object.fromEntries(
    Object.keys(cerfa.drawings).map((cle) => [cle, donnes[cle] ?? "Court"]),
  );
  const dto: CerfaDto = { fields, drawings };
  const depuisLeDisque = { ...cerfa, template: () => gabarit(support) };
  return (await generateCerfa(depuisLeDisque, dto)).typography;
}
