// La précision du prescripteur (Q3.4) sur la PMT et la DAP remplies : elle
// suit le texte médical tant qu'elle tient dans son cadre, et seul un
// commentaire qui ne tient pas est retiré et signalé (TS1017-08,
// DOC-COMMENTAIRE-CAPACITE-20261104, #356). L'erreur technique, sans alerte
// de longueur, se teste avec l'écran (`avertissement-du-commentaire.test.tsx`).

import { describe, expect, it } from "vitest";
import type { Faits } from "../../../../core/models/eligibilite/faits/noms";
import { Fait } from "../../../../core/socle";
import { S3138G } from "../../../../front/models/eligibilite/r3/s3138g/s3138g";
import { S3139H } from "../../../../front/models/eligibilite/r3/s3139h/s3139h";
import {
  type BoundCerfa,
  dtoFrom,
  generateCerfa,
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

describe.each(SUPPORTS)("la précision du texte médical, $nom", (support) => {
  it("vide : rien n'est retiré", async () => {
    const { "Q3.4": _, ...reponses } = support.reponses;

    const { texte, removedComments } = await rempli(support, reponses);

    expect(texte).toBe(`${SEANCE}.`);
    expect(removedComments).toEqual([]);
  });

  it("« Test » seul : suit le texte, sans alerte", async () => {
    const reponses = { ...support.reponses, "Q3.4": "Test" };

    const { texte, removedComments } = await rempli(support, reponses);

    expect(texte).toBe(`${SEANCE} ; Test.`);
    expect(removedComments).toEqual([]);
  });

  it("« Test » après la mention de l'ALD : suit le texte, sans alerte", async () => {
    const reponses = { ...support.reponses, "Q3.4": "Test" };
    const faits = { fait_ald_liee: Fait.oui("test") };

    const { texte, removedComments } = await rempli(support, reponses, faits);

    expect(texte).toBe(`${SEANCE} ; ${ALD} ; Test.`);
    expect(removedComments).toEqual([]);
  });

  it("trop longue pour le cadre : retirée, et signalée", async () => {
    const reponses = { ...support.reponses, "Q3.4": LONG };

    const { texte, removedComments } = await rempli(support, reponses);

    expect(texte).not.toContain("Suivi pluridisciplinaire");
    expect(removedComments).toEqual(["elements_medicaux_precision"]);
  });
});

// ---- implémentation ----

// Le support rempli : le texte de son champ médical, et les commentaires
// retirés.
async function rempli(
  { nom, cerfa, champ }: Support,
  reponses: Reponses,
  faits: Partial<Faits> = {},
): Promise<{ texte: string; removedComments: readonly string[] }> {
  const dto = dtoFrom(cerfa.mapping, donnees(reponses, {}, undefined, faits));
  const depuisLeDisque = { ...cerfa.cerfa, template: () => gabarit(nom) };
  const genere = await generateCerfa(depuisLeDisque, dto);
  const pdf = new Uint8Array(await genere.pdf.arrayBuffer());
  const texte = (await textsIn(await gabarit(nom), pdf, champ)).join(" ");
  return { texte, removedComments: genere.removedComments };
}
