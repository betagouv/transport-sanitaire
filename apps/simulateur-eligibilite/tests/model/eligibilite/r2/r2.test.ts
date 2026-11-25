// Le résultat de R2 en donnée : un cas par membre de `ResultatR2`, ce que
// chacun porte, et la preuve qu'il se sérialise en JSON sans rien perdre : ni
// élément React, ni fonction, ni classe. L'écran qui le montre est éprouvé à
// part (`acceptee/`, `refusee/`, `orientee/`).

import { beforeAll, describe, expect, it } from "vitest";
import { catalogueResultats } from "../../../../core/models/eligibilite/r2/catalogue";
import { R2, type ResultatR2 } from "../../../../core/models/eligibilite/r2/r2";
import { SEEDS } from "../../../../core/models/eligibilite/seeds-catalogue";
import { Cible } from "../../../../core/socle/decision-engine";
import { lectureDe, type Reponses } from "../p2/reponses-de-la-permission";

type Catalogue = Awaited<ReturnType<typeof catalogueResultats>>;

let catalogue: Catalogue;
beforeAll(async () => {
  catalogue = await catalogueResultats();
});

describe("le résultat de R2, un cas par membre", () => {
  it("hors circuit : l'orientation pénitentiaire, sans fiche", () => {
    expect(resultatDe("orientation-penitentiaire")).toEqual({
      cas: "hors circuit",
      titre: "Ce retour relève de l’organisation pénitentiaire",
      texte:
        "Ce déplacement a été identifié comme exclusivement administratif, sans indication médicale de transport. Rapprochez-vous de l’administration pénitentiaire pour organiser le déplacement.",
    });
  });

  it("sans issue : les règles n'ont pas conclu, rien d'autre", () => {
    const resultat = resultatDe("issue-pmt", {
      cible_issue_id: Cible.of(undefined),
    });
    expect(resultat).toEqual({ cas: "sans issue" });
  });

  it("sans mode : une issue acceptée dont aucun mode n'est choisi", () => {
    const resultat = resultatDe("issue-pmt", {
      cible_mode_id: Cible.of<"TAP">(undefined),
    });
    expect(resultat).toEqual({ cas: "sans mode" });
  });

  it("acceptée : l'issue, la fiche du patient et sa feuille", () => {
    const resultat = resultatDe("issue-pmt");
    if (resultat.cas !== "acceptée") throw new Error(resultat.cas);
    expect(resultat.issue).toBe("ISSUE_PMT");
    expect(resultat.fiche.titreDuPrescripteur).not.toBe("");
    expect(resultat.fiche.titreDuPatient).not.toBe("");
    expect(resultat.fiche.consignes.etapes.length).toBeGreaterThan(0);
    expect(resultat.feuille.introduction).toBe(catalogue.patientSheetIntro);
    expect(resultat.feuille.avis).toEqual({
      texte: catalogue.patientFeedback.text,
      courriel: catalogue.patientFeedback.email,
    });
  });

  it("refusée : la fiche négative et sa feuille, sans issue à porter", () => {
    const resultat = resultatDe("issue-non-eligible");
    if (resultat.cas !== "refusée") throw new Error(resultat.cas);
    expect(resultat.fiche.titreDuPatient).not.toBe("");
    expect(resultat.fiche.raison).not.toBe("");
    expect(resultat.feuille.avis.courriel).toBe(
      catalogue.patientFeedback.email,
    );
    expect(resultat).not.toHaveProperty("issue");
  });

  it("orientée : l'issue et la page du prescripteur, sans feuille", () => {
    const resultat = resultatDe("issue-caisse");
    if (resultat.cas !== "orientée") throw new Error(resultat.cas);
    expect(resultat.issue).toBe("ISSUE_CAISSE");
    expect(resultat.page.titre).not.toBe("");
    expect(resultat).not.toHaveProperty("feuille");
  });

  it("n'attend pas le catalogue quand elle n'en a pas besoin", () => {
    const sans = (id: string, forcees = {}) =>
      R2.of(lectureDe(reponsesDe(id), forcees)).sansCatalogue;
    expect(sans("orientation-penitentiaire")?.cas).toBe("hors circuit");
    expect(
      sans("issue-pmt", { cible_issue_id: Cible.of(undefined) })?.cas,
    ).toBe("sans issue");
    expect(sans("issue-pmt")).toBeUndefined();
  });
});

describe("le résultat de R2 se sérialise en JSON sans perte", () => {
  it.each(SEEDS.map(({ id }) => id))("la seed %s", (id) => {
    const resultat = resultatDe(id);
    expect(JSON.parse(JSON.stringify(resultat))).toStrictEqual(resultat);
  });
});

// ---- implémentation ----

function reponsesDe(id: string): Reponses {
  const seed = SEEDS.find((candidate) => candidate.id === id);
  if (!seed) throw new Error(`Seed inconnue : ${id}`);
  return seed.answers as Reponses;
}

// Le résultat de la seed `id`, éventuellement avec des cibles forcées.
function resultatDe(id: string, forcees = {}): ResultatR2 {
  return R2.of(lectureDe(reponsesDe(id), forcees)).resultat(catalogue);
}
