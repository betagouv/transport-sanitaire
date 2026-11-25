// La précision de l'urgence sur la PMT et la DAP (T06, R04) : un texte strict,
// sur une ligne, en 8 pt, sur chaque volet qui la porte. Elle s'écrit telle que
// saisie : trop longue, ou coupée d'un retour à la ligne, elle ne tient pas, le
// cerfa n'est qu'un aperçu et la génération la signale.

import { describe, expect, it } from "vitest";
import { CerfaDtoService } from "../../../../core/socle/cerfa";
import type { BoundCerfa, GeneratedCerfa } from "../../../../front/socle/cerfa";
import { generateCerfa } from "../../../socle/cerfa/generer-le-cerfa";
import { textsOn } from "../../../socle/cerfa/pdf-aplati";
import { DOCUMENTS } from "../documents-lies";
import { DAP, donnees, gabarit, PMT, type Reponses } from "./reponses-du-cerfa";

const AUTRE = { cible_urgence_appel15: false, cible_urgence_autre: true };
const COURTE = "Douleur thoracique";
// La phrase de l'éditeur : 232 points en 8 pt, elle tient sur la DAP et pas
// sur la PMT, qui en a 218 (`urgence-document.mjs`).
const PHRASE = "Douleur thoracique aiguë avec suspicion de syndrome coronarien";

type Support = {
  readonly nom: string;
  readonly cerfa: BoundCerfa;
  readonly reponses: Reponses;
  readonly volets: readonly number[];
};

const PMT_ = {
  nom: "S3138g",
  cerfa: DOCUMENTS.S3138g,
  reponses: PMT,
  volets: [3, 4],
};
const DAP_ = {
  nom: "S3139h",
  cerfa: DOCUMENTS.S3139h,
  reponses: DAP,
  volets: [2, 3, 4],
};

describe.each([PMT_, DAP_])("la précision de l'urgence, $nom", (support) => {
  it("courte : s'écrit en 8 pt sur chaque volet", async () => {
    const genere = await rempli(support, COURTE);

    expect(debordeDe(genere)).toEqual([]);
    expect(genere.typography.sizes[`${support.nom}.urgence_precision`]).toBe(8);
    for (const page of support.volets)
      expect(await textsOn(await pdfDe(genere), page)).toContain(COURTE);
  });

  it("coupée d'un retour à la ligne : ne tient pas, jusqu'au retour", async () => {
    const genere = await rempli(support, "Douleur\nthoracique");

    expect(debordeDe(genere)).toEqual([
      {
        entry: "urgence_precision",
        label: "Précision sur l’urgence",
        text: "Douleur\nthoracique",
        maximum: 7,
      },
    ]);
  });
});

describe("la phrase de l'éditeur", () => {
  it("tient sur la DAP", async () => {
    expect(debordeDe(await rempli(DAP_, PHRASE))).toEqual([]);
  });

  it("déborde de la PMT : seul son plus long début se dessine", async () => {
    const genere = await rempli(PMT_, PHRASE);

    const [precision] = debordeDe(genere);
    expect(precision?.maximum).toBeLessThan(Array.from(PHRASE).length);
    const debut = Array.from(PHRASE).slice(0, precision?.maximum).join("");
    for (const page of PMT_.volets)
      expect(await textsOn(await pdfDe(genere), page)).toContain(debut);
  });
});

// ---- implémentation ----

// Le support rempli, l'urgence attestée hors Centre 15 avec cette précision.
async function rempli(
  { nom, cerfa, reponses }: Support,
  precision: string,
): Promise<GeneratedCerfa> {
  const saisies = { ...reponses, "Q3.5": precision };
  const dto = CerfaDtoService.from(cerfa.mapping, donnees(saisies, AUTRE));
  const depuisLeDisque = { ...cerfa.cerfa, template: () => gabarit(nom) };
  return generateCerfa(depuisLeDisque, dto);
}

// La précision, si elle déborde. La cellule médicale de la DAP déborde aussi,
// avec la justification de la distance.
function debordeDe(genere: GeneratedCerfa) {
  return genere.overflowing.filter(
    ({ entry }) => entry === "urgence_precision",
  );
}

async function pdfDe(genere: GeneratedCerfa): Promise<Uint8Array> {
  return new Uint8Array(await genere.pdf.arrayBuffer());
}
