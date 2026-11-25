// La cellule médicale de la PMT et de la DAP remplies : un seul texte, écrit à
// 9 pt. Un texte qui n'y tient pas fait du cerfa un aperçu : seul son plus long
// début s'écrit, et la génération le signale avec son maximum. Seule la
// justification du lieu éloigné (Q3.4.distance) y entre en saisie libre : la
// DAP la porte, et la PMT déborde avec la mention du mineur
// (`consigne-du-mineur.test.ts`).

import { describe, expect, it } from "vitest";
import type { Faits } from "../../../../core/models/eligibilite/faits/noms";
import { Fait } from "../../../../core/socle";
import { CerfaDtoService } from "../../../../core/socle/cerfa";
import {
  type BoundCerfa,
  generateCerfa,
  type Overflowing,
} from "../../../../front/socle/cerfa";
import { textsIn } from "../../../socle/cerfa/pdf-aplati";
import { DOCUMENTS } from "../documents-lies";
import { DAP, donnees, gabarit, PMT, type Reponses } from "./reponses-du-cerfa";

const SEANCE = "Ce déplacement concerne une séance de dialyse en centre";
const ALD = "soins en lien avec une ALD reconnue";
const ELOIGNEMENT = "justification médicale du lieu de soins éloigné : ";
const LONG = "Suivi pluridisciplinaire au long cours ".repeat(20).trim();

// Un support, son parcours et son champ médical.
type Support = {
  readonly nom: string;
  readonly cerfa: BoundCerfa;
  readonly reponses: Reponses;
  readonly champ: string;
};

// Un texte de base qui tient seul dans son cadre. Celui qui n'y tient pas
// attend l'éditeur : la DAP perd la justification de la distance.
const { "Q3.4.distance": _distance, ...DAP_COURTE } = DAP;

const LA_DAP: Support = {
  nom: "S3139h",
  cerfa: DOCUMENTS.S3139h,
  reponses: DAP_COURTE,
  champ: "elmedic",
};
const SUPPORTS: readonly Support[] = [
  {
    nom: "S3138g",
    cerfa: DOCUMENTS.S3138g,
    reponses: PMT,
    champ: "comm évent",
  },
  LA_DAP,
];

describe.each(SUPPORTS)("la cellule médicale, $nom", (support) => {
  it("le texte seul, qui tient", async () => {
    const { texte, overflowing } = await rempli(support, support.reponses);

    expect(texte).toBe(`${SEANCE}.`);
    expect(overflowing).toEqual([]);
  });

  it("la mention de l'ALD suit le soin, et tient", async () => {
    const faits = { fait_ald_liee: Fait.oui("test") };

    const { texte, overflowing } = await rempli(
      support,
      support.reponses,
      faits,
    );

    expect(texte).toBe(`${SEANCE} ; ${ALD}.`);
    expect(overflowing).toEqual([]);
  });
});

describe("la cellule médicale trop longue, S3139h", () => {
  it("seul le début s'écrit, et la cellule est signalée", async () => {
    const reponses = { ...DAP, "Q3.4.distance": LONG };

    const { texte, overflowing } = await rempli(LA_DAP, reponses);

    const [cellule] = overflowing;
    expect(cellule).toMatchObject({
      entry: "elements_medicaux",
      label: "Éléments d’ordre médical et commentaires",
      text: `${SEANCE} ; ${ELOIGNEMENT}${LONG}.`,
    });
    expect(cellule?.maximum).toBeLessThan(
      Array.from(cellule?.text ?? "").length,
    );
    expect(texte.replace(/\s+/g, " ").trim()).toBe(
      Array.from(cellule?.text ?? "")
        .slice(0, cellule?.maximum)
        .join("")
        .replace(/\s+/g, " ")
        .trim(),
    );
  });
});

// ---- implémentation ----

// Le support rempli : le texte de son champ médical, et ce qui en déborde.
async function rempli(
  { nom, cerfa, champ }: Support,
  reponses: Reponses,
  faits: Partial<Faits> = {},
): Promise<{ texte: string; overflowing: readonly Overflowing[] }> {
  const dto = CerfaDtoService.from(
    cerfa.mapping,
    donnees(reponses, {}, undefined, faits),
  );
  const depuisLeDisque = { ...cerfa.cerfa, template: () => gabarit(nom) };
  const genere = await generateCerfa(depuisLeDisque, dto);
  const pdf = new Uint8Array(await genere.pdf.arrayBuffer());
  const texte = (await textsIn(await gabarit(nom), pdf, champ)).join(" ");
  return { texte, overflowing: genere.overflowing };
}
