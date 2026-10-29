// Les pages du soin et de l'urgence de P3 (Q3.4, Q3.4.a, Q3.5, #146), posées
// selon les cibles figées au verrou. `CATALOGUE_COMPLET_QUESTIONS.md` Q3.4,
// Q3.4.a et Q3.5, `CONTRAT_CONTEXTES_V1012.json` (`centreReference`).

import { describe, expect, it } from "vitest";
import { model } from "../../../core/models/eligibilite";
import type { Questions } from "../../../core/models/eligibilite/declarations/questions";
import { SEEDS } from "../../../core/models/eligibilite/seeds-catalogue";
import { preconisationOf } from "../../../core/socle/model";
import type { Answers } from "../../../core/socle/questionnaire-engine/question";
import { Questionnaire } from "../../../core/socle/questionnaire-engine/questionnaire";
import { MATERNITE_ETABLIE } from "./reponses-de-la-branche";

type Reponses = Answers<Questions>;

const pages = model.complement.pages;

const seed = (id: string) => {
  const trouvee = SEEDS.find((candidate) => candidate.id === id);
  if (!trouvee) throw new Error(`seed ${id} absente`);
  return trouvee.answers as Reponses;
};
const cibles = (reponses: Reponses) => preconisationOf(model, reponses).cibles;
// Les cibles sont celles du verrou : `figees` les donne, `reponses` les complète.
const posees = (pageId: string, reponses: Reponses, figees = reponses) => {
  const page = pages.find(({ id }) => id === pageId);
  if (!page) throw new Error(`${pageId} n'existe pas`);
  return new Questionnaire(pages)
    .readWith(reponses, cibles(figees))
    .questionsOn(page);
};
const ids = (pageId: string, reponses: Reponses) =>
  posees(pageId, reponses).map(({ id }) => id);

const SEANCE = {
  label: "Séance",
  value: "Ce déplacement concerne une séance de dialyse en centre.",
};
const HEMODIALYSE = { label: "Séance d’hémodialyse", value: "Oui." };

describe("la page du soin (Q3.4, Q3.4.a)", () => {
  it("pour la PMT, la précision et le centre de référence", () => {
    expect(ids("P3/soin", seed("issue-pmt"))).toEqual(["Q3.4", "Q3.4.a"]);
  });

  it("au-delà de 150 km, la DAP demande aussi la raison du lieu éloigné", () => {
    expect(ids("P3/soin", seed("issue-dap-sans-urgence"))).toEqual([
      "Q3.4",
      "Q3.4.distance",
      "Q3.4.a",
    ]);
  });

  it("le S3141 n'a pas de rubrique médicale : rien ne s'y pose", () => {
    expect(ids("P3/soin", seed("issue-s3141"))).toEqual([]);
  });

  it("rappelle la séance que P1 a prouvée et son hémodialyse, sans les redemander", () => {
    const [precision] = posees("P3/soin", seed("issue-pmt"));
    expect(precision?.reminder).toEqual([SEANCE, HEMODIALYSE]);
  });

  it("rappelle le motif de Q2.1 quand il s'est posé", () => {
    const pmt = seed("issue-pmt");
    const entree: Reponses = {
      ...pmt,
      "Q2.1": "8_HOSPITALISATION",
      "Q2.1.g": "1_ENTREE",
    };
    const [precision] = posees("P3/soin", entree, pmt);
    expect(precision?.reminder).toEqual([
      {
        label: "Motif",
        value:
          "Entrée ou sortie d’hospitalisation, ou admission en HAD (Hospitalisation à Domicile).",
      },
      {
        label: "Précision",
        value: "Une entrée dans un établissement de santé",
      },
      SEANCE,
      HEMODIALYSE,
    ]);
  });

  it("rappelle aussi le parcours de l'enfant et le déplacement des séances de Q2.1", () => {
    const pmt = seed("issue-pmt");
    const precise: Reponses = { ...pmt, "Q2.1.h": "1_OUI", "Q2.1.f": "1_OUI" };
    const [precision] = posees("P3/soin", precise, pmt);
    expect(precision?.reminder).toEqual([
      { label: "Séance dans le parcours de l’enfant", value: "Oui" },
      SEANCE,
      HEMODIALYSE,
      {
        label: "Séances et déplacement",
        value: "Oui, il s’agit du même déplacement et du même lieu",
      },
    ]);
  });

  it("un retour simple ne va pas vers le centre de référence : Q3.4.a ne se pose pas", () => {
    const pmt = seed("issue-pmt");
    const retour: Reponses = { ...pmt, "Q3.1.1": 1, "Q3.1.2": "2_RETOUR" };
    expect(posees("P3/soin", retour, pmt).map(({ id }) => id)).toEqual([
      "Q3.4",
    ]);
  });

  it("la justification du lieu éloigné reprend le catalogue, et vide, elle bloque", () => {
    const dap = seed("issue-dap-sans-urgence");
    const soin = pages.filter(({ id }) => id === "P3/soin");
    const reponses = (justification: string): Reponses => ({
      ...dap,
      "Q3.4.distance": justification,
      "Q3.4.a": "2_NON",
    });
    expect(
      posees("P3/soin", dap).find(({ id }) => id === "Q3.4.distance")?.label,
    ).toBe("Justification médicale du lieu de soins éloigné");
    expect(
      new Questionnaire(soin).readWith(reponses(""), cibles(dap)).isComplete(),
    ).toBe(false);
    expect(
      new Questionnaire(soin)
        .readWith(reponses("Centre expert"), cibles(dap))
        .isComplete(),
    ).toBe(true);
  });

  it("sans réponse à Q3.4.a, le document attend, et R2 reste la même", () => {
    const avant = seed("issue-pmt");
    const sansCentre: Reponses = {
      ...avant,
      "Q3.1.1": 1,
      "Q3.1.2": "1_ALLER",
      "Q3.2.nature": "1_DOMICILE",
      "Q3.2.adresse": { street: "1 rue A", postalCode: "75001", city: "Paris" },
      "Q3.3.nom": "Centre de dialyse",
      "Q3.3.adresse": { street: "2 rue B", postalCode: "75002", city: "Paris" },
    };
    const jusquAuSoin = pages.slice(
      0,
      pages.findIndex(({ id }) => id === "P3/soin") + 1,
    );
    expect(
      new Questionnaire(jusquAuSoin)
        .readWith(sansCentre, cibles(avant))
        .isComplete(),
    ).toBe(false);
    expect(
      new Questionnaire(jusquAuSoin)
        .readWith({ ...sansCentre, "Q3.4.a": "2_NON" }, cibles(avant))
        .isComplete(),
    ).toBe(true);
    expect(cibles({ ...sansCentre, "Q3.4.a": "1_OUI" })).toEqual(cibles(avant));
  });
});

describe("la page de l'urgence (Q3.5)", () => {
  it("se pose quand l'urgence médicale est attestée, sous le libellé du catalogue", () => {
    const [urgence] = posees("P3/urgence", seed("issue-dap-urgence-attestee"));
    expect(urgence).toMatchObject({
      id: "Q3.5",
      label: "Quelle précision faut-il apporter sur l’urgence déjà attestée ?",
    });
  });

  it("l'urgence de Q2.12 va à la caisse : aucun document, Q3.5 ne se pose pas", () => {
    const reponses: Reponses = {
      ...MATERNITE_ETABLIE,
      "Q2.12": "1_OUI",
    };
    expect(cibles(reponses).cible_support_id.value).toBe("AUCUN");
    expect(ids("P3/urgence", reponses)).toEqual([]);
  });

  it.each(["issue-dap-sans-urgence", "issue-pmt"])(
    "ne se pose pas sans urgence acquise (%s)",
    (id) => {
      expect(ids("P3/urgence", seed(id))).toEqual([]);
    },
  );
});
