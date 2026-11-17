// La cellule médicale de la PMT et de la DAP remplies (#403, D-302) : un seul
// texte, la précision du prescripteur (Q3.4) à sa suite, écrit à 9 pt. Un texte
// qui n'y tient pas fait du cerfa un aperçu : seul son plus long début s'écrit,
// et la génération le signale avec son maximum.

import { describe, expect, it } from "vitest";
import type { Faits } from "../../../../core/models/eligibilite/faits/noms";
import { Fait } from "../../../../core/socle";
import { S3138G } from "../../../../front/models/eligibilite/r3/s3138g/s3138g";
import { S3139H } from "../../../../front/models/eligibilite/r3/s3139h/s3139h";
import {
  type BoundCerfa,
  dtoFrom,
  generateCerfa,
  type Overflowing,
} from "../../../../front/socle/cerfa";
import { textsIn } from "../../../socle/cerfa/pdf-aplati";
import { DAP, donnees, gabarit, PMT, type Reponses } from "./reponses-du-cerfa";

const SEANCE = "Ce déplacement concerne une séance de dialyse en centre";
const ALD = "soins en lien avec une ALD reconnue";
const LONG = "Suivi pluridisciplinaire au long cours ".repeat(20).trim();

// Un support, son parcours et son champ médical.
type Support = {
  readonly nom: string;
  readonly cerfa: BoundCerfa;
  readonly reponses: Reponses;
  readonly champ: string;
};

// Un texte de base qui tient seul dans son cadre. Celui qui n'y tient pas
// attend l'éditeur (#348) : la DAP perd la justification de la distance.
const { "Q3.4.distance": _distance, ...DAP_COURTE } = DAP;

const SUPPORTS: readonly Support[] = [
  { nom: "S3138g", cerfa: S3138G, reponses: PMT, champ: "comm évent" },
  { nom: "S3139h", cerfa: S3139H, reponses: DAP_COURTE, champ: "elmedic" },
];

describe.each(SUPPORTS)("la cellule médicale, $nom", (support) => {
  it("sans précision : le texte seul, qui tient", async () => {
    const { "Q3.4": _, ...reponses } = support.reponses;

    const { texte, overflowing } = await rempli(support, reponses);

    expect(texte).toBe(`${SEANCE}.`);
    expect(overflowing).toEqual([]);
  });

  it("« Test » suit le texte, et tient", async () => {
    const reponses = { ...support.reponses, "Q3.4": "Test" };

    const { texte, overflowing } = await rempli(support, reponses);

    expect(texte).toBe(`${SEANCE} ; Test.`);
    expect(overflowing).toEqual([]);
  });

  it("« Test » suit la mention de l'ALD", async () => {
    const reponses = { ...support.reponses, "Q3.4": "Test" };
    const faits = { fait_ald_liee: Fait.oui("test") };

    const { texte, overflowing } = await rempli(support, reponses, faits);

    expect(texte).toBe(`${SEANCE} ; ${ALD} ; Test.`);
    expect(overflowing).toEqual([]);
  });

  it("trop longue : seul le début s'écrit, et la cellule est signalée", async () => {
    const reponses = { ...support.reponses, "Q3.4": LONG };

    const { texte, overflowing } = await rempli(support, reponses);

    const [cellule] = overflowing;
    expect(cellule).toMatchObject({
      entry: "elements_medicaux",
      label: "Éléments d’ordre médical et commentaires",
      text: `${SEANCE} ; ${LONG}.`,
    });
    expect(cellule?.maximum).toBeLessThan(
      Array.from(cellule?.text ?? "").length,
    );
    expect(texte.replace(/\s+/g, " ")).toBe(
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
  const dto = dtoFrom(cerfa.mapping, donnees(reponses, {}, undefined, faits));
  const depuisLeDisque = { ...cerfa.cerfa, template: () => gabarit(nom) };
  const genere = await generateCerfa(depuisLeDisque, dto);
  const pdf = new Uint8Array(await genere.pdf.arrayBuffer());
  const texte = (await textsIn(await gabarit(nom), pdf, champ)).join(" ");
  return { texte, overflowing: genere.overflowing };
}
