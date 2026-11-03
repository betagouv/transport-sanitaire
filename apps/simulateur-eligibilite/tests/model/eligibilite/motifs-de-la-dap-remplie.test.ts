// Les motifs que la DAP remplie coche (#161) : les fondements que les règles
// établissent, l'Engagement maternité, rien pour la demande d'examen à
// l'étranger, et l'avion ou le bateau avec ses cases. Le reste de la DAP se
// vérifie dans `s3139h-rempli.test.ts`.

import { describe, expect, it } from "vitest";
import { S3139H } from "../../../front/models/eligibilite/r3/s3139h/s3139h";
import { dtoFrom } from "../../../front/socle/cerfa/generate-the-cerfa/compute-the-dto";
import { markedStates, textsOn } from "../../socle/cerfa/pdf-aplati";
import {
  DAP,
  donnees,
  ETRANGER,
  EXAMEN_DE_MATERNITE,
  gabarit,
  genere,
  Q38,
  type Reponses,
} from "./reponses-du-cerfa";
import type { ValeursDesCibles } from "./traces-du-prescripteur";

const VOLETS = [2, 3, 4];

describe("les motifs de la DAP", () => {
  it("cochent ensemble les fondements établis", async () => {
    const cibles = {
      cible_dap_motif_longue_distance: true,
      cible_dap_motif_serie: true,
      cible_dap_motif_camsp_cmpp: true,
    };

    expect(await marquees(DAP, cibles, "km")).toEqual(["Oui", "non", "camsp"]);
  });

  it("cochent l'Engagement maternité, Q3.8 répondue", async () => {
    const reponses: Reponses = { ...EXAMEN_DE_MATERNITE, ...Q38 };

    expect(await marquees(reponses, {}, "km")).toEqual(["engag"]);
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
