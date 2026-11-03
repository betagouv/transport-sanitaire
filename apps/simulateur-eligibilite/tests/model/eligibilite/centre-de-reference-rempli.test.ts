// Le centre de référence sur la PMT et la DAP remplies (N4-01 et N4-02 de la
// recette de l'éditeur, `Recette_documents_N4.json`) : entre Oui et Non à
// Q3.4.a, seule sa case change, sur le seul volet médical. Le reste du
// document ne bouge pas. Ce que vaut la case se teste avec sa rubrique
// (`s3138g-rempli.test.ts`, `s3139h-rempli.test.ts`), son absence du S3141
// avec la page du soin (`soin-et-urgence.test.ts`).

import { describe, expect, it } from "vitest";
import { S3138G } from "../../../front/models/eligibilite/r3/s3138g/s3138g";
import { S3139H } from "../../../front/models/eligibilite/r3/s3139h/s3139h";
import {
  type BoundCerfa,
  dtoFrom,
} from "../../../front/socle/cerfa/generate-the-cerfa/compute-the-dto";
import { markedStates, textsOn } from "../../socle/cerfa/pdf-aplati";
import {
  DAP,
  donnees,
  gabarit,
  genere,
  PMT,
  type Reponses,
} from "./reponses-du-cerfa";

// Un support : son parcours, sa case du centre et l'état qui la coche, ses
// volets et son volet médical.
type Support = {
  readonly nom: string;
  readonly cerfa: BoundCerfa;
  readonly reponses: Reponses;
  readonly case: string;
  readonly etat: string;
  readonly volets: readonly number[];
  readonly medical: number;
};

const SUPPORTS: readonly Support[] = [
  {
    ...{ nom: "S3138g", cerfa: S3138G, reponses: PMT },
    ...{ case: "transp autre cent", etat: "On", volets: [3, 4], medical: 3 },
  },
  {
    ...{ nom: "S3139h", cerfa: S3139H, reponses: DAP },
    ...{ case: "malrare", etat: "Oui", volets: [2, 3, 4], medical: 2 },
  },
];

const OUI = "1_OUI" as const;
const NON = "2_NON" as const;
type Centre = typeof OUI | typeof NON;

describe("le centre de référence, entre Oui et Non (N4-01, N4-02)", () => {
  it.each(SUPPORTS)(
    "$nom : seule la cellule du centre change",
    ({ cerfa, reponses }) => {
      const oui = dto(cerfa, reponses, OUI);
      const non = dto(cerfa, reponses, NON);

      expect(differentes(oui.fields, non.fields)).toEqual(["centre_rare"]);
      expect(differentes(oui.drawings, non.drawings)).toEqual([]);
    },
  );

  it.each(SUPPORTS)(
    "$nom : la case n'est marquée que sur le volet médical",
    async (support) => {
      const pdf = await rempli(support, OUI);

      for (const page of support.volets)
        expect(
          await markedStates(
            await gabarit(support.nom),
            pdf,
            support.case,
            page,
          ),
        ).toEqual(page === support.medical ? [support.etat] : []);
    },
  );

  it.each(SUPPORTS)(
    "$nom : aucun texte d'aucun volet ne change",
    async (support) => {
      const oui = await rempli(support, OUI);
      const non = await rempli(support, NON);

      for (const page of support.volets)
        expect(await textsOn(oui, page)).toEqual(await textsOn(non, page));
    },
  );
});

// ---- implémentation ----

// Ce que le socle passe au cerfa, avec cette réponse à Q3.4.a.
function dto(cerfa: BoundCerfa, reponses: Reponses, centre: Centre) {
  return dtoFrom(cerfa.mapping, donnees({ ...reponses, "Q3.4.a": centre }));
}

// Le support rempli avec cette réponse à Q3.4.a.
function rempli(
  { nom, cerfa, reponses }: Support,
  centre: Centre,
): Promise<Uint8Array> {
  return genere(cerfa.cerfa, nom, dto(cerfa, reponses, centre));
}

// Les cellules qui ne valent pas la même chose dans les deux.
function differentes(
  a: Readonly<Record<string, unknown>>,
  b: Readonly<Record<string, unknown>>,
): string[] {
  return Object.keys({ ...a, ...b }).filter((cle) => a[cle] !== b[cle]);
}
