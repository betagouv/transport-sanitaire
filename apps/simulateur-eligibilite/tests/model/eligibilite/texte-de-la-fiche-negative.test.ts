// Le texte de la fiche patient négative (#134). Les phrases attendues sont
// celles de l'aperçu de l'éditeur : un texte qui change sans que son oracle
// change échoue ici.

import { describe, expect, it } from "vitest";
import { SEEDS } from "../../../core/models/eligibilite/seeds-catalogue";
import { catalogueResultats } from "../../../front/models/eligibilite/r2/catalogue-resultats";
import { texteDeLaFicheNegative } from "../../../front/models/eligibilite/r2/fiche-negative/texte-de-la-fiche-negative";
import { traceDuResultat } from "../../../front/models/eligibilite/r2/trace-du-resultat";
import { lectureDe } from "./reponses-de-la-permission";
import { trace } from "./traces-du-prescripteur";

const catalogue = await catalogueResultats();

const seed = SEEDS.find(({ id }) => id === "issue-non-eligible");
if (!seed) throw new Error("Seed inconnue : issue-non-eligible");

describe("le texte de la seed issue-non-eligible", () => {
  const texte = texteDeLaFicheNegative(
    catalogue,
    traceDuResultat(lectureDe(seed.answers)),
  );

  it("donne les titres de l'aperçu", () => {
    expect(texte.titreDuPatient).toBe(
      "Votre transport ne peut pas être pris en charge par l’Assurance Maladie",
    );
    expect(texte.titreDuPrescripteur).toBe(
      "Le transport de votre patient ne peut pas être pris en charge par l’Assurance Maladie",
    );
  });

  it("donne la raison de la consultation", () => {
    expect(texte.raison).toBe(
      "Votre déplacement concerne une consultation médicale. Cette consultation, à elle seule, ne suffit pas à ouvrir droit au remboursement de votre transport par l’Assurance Maladie.",
    );
  });

  it("donne ce que l'Assurance Maladie ne rembourse pas", () => {
    expect(texte.informationInstitutionnelle.title).toBe(
      "L’Assurance Maladie ne rembourse pas systématiquement les transports :",
    );
    expect(texte.informationInstitutionnelle.items).toHaveLength(4);
  });

  it("lit les consignes en paragraphes, puis en liste", () => {
    const { titre, blocs } = texte.consignes;
    expect(titre).toBe("Les règles de la prescription médicale de transport");
    expect(blocs).toEqual([
      {
        type: "paragraphe",
        texte: expect.stringMatching(
          /^La prescription de transport est un acte médical réglementé/,
        ),
      },
      { type: "paragraphe", texte: "La réglementation précise que :" },
      { type: "liste", puces: expect.any(Array) },
    ]);
    expect(blocs[2]).toMatchObject({ puces: { length: 4 } });
  });

  it("donne le bloc des frais de transport", () => {
    expect(texte.finance.title).toBe("Le saviez-vous ?");
  });
});

describe("les parties facultatives du catalogue", () => {
  it("montre le sous-titre quand le catalogue en porte", () => {
    const negative = catalogue.issues.ISSUE_NON_ELIGIBLE;
    const avec = {
      ...catalogue,
      issues: {
        ...catalogue.issues,
        ISSUE_NON_ELIGIBLE: {
          ...negative,
          instructions: {
            ...negative.instructions,
            intro: {
              ...negative.instructions.intro,
              subtitle: "Un sous-titre",
            },
          },
        },
      },
    };
    const { consignes } = texteDeLaFicheNegative(avec, trace({}));
    expect(consignes.sousTitre).toBe("Un sous-titre");
  });
});
