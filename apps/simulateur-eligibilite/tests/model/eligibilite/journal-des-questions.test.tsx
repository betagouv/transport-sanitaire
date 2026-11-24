// Ce que le journal des parcours reçoit des pages du modèle de l'éditeur : l'id
// de page qu'il nomme, et une précision qu'un brouillon révèle, exposée dans le
// même affichage que sa question.

import { describe, expect, it } from "vitest";
import { journalDeTest } from "../../socle/analytics/journal-de-test";
import { afficherLaPage, cocher, page, suivant } from "./formulaire-du-modele";
import { BRANCARD, CONSULTATION } from "./p2/reponses-des-contextes";

const SITUATIONS = /^L’une de ces situations/;
const SOINS = /^L’un de ces soins/;
const INDICATION = /^Ce retour nécessite-t-il/;

describe("le journal des questions du modèle", () => {
  it("les deux pages des contextes portent le nom que leur donne l'éditeur", async () => {
    const { analytics, envoyes } = journalDeTest();
    const user = afficherLaPage("P2/contextes-situations", BRANCARD, analytics);
    await page(SITUATIONS);
    await cocher(user, /^Non, aucune de ces situations/);
    await suivant(user);
    await page(SOINS);

    expect(expositions(envoyes)).toEqual([
      ["Q2.2.1", "P2/contextes-situations"],
      ["Q2.2.1.b", "P2/contextes-soins"],
    ]);
  });

  it("la précision que révèle une case est exposée dans le même affichage", async () => {
    const { analytics, envoyes } = journalDeTest();
    const user = afficherLaPage(
      "P2/contextes-situations",
      CONSULTATION,
      analytics,
    );
    await page(SITUATIONS);
    await cocher(user, /^Retour vers un établissement pénitentiaire/);
    await page(INDICATION);

    const [situations, indication] = envoyes.filter(
      ({ type }) => type === "question_exposed",
    );
    expect(indication?.question_id).toBe("Q2.2.1.indication");
    expect(affichageDe(indication)).toBe(affichageDe(situations));
  });
});

// ---- implémentation ----

// L'affichage d'une exposition : son id, sans la question.
const affichageDe = (exposition?: { exposure_id?: string }) =>
  exposition?.exposure_id?.replace(/:[^:]+$/, "");

const expositions = (
  envoyes: { type: string; question_id?: string; page_id?: string }[],
) =>
  envoyes
    .filter(({ type }) => type === "question_exposed")
    .map(({ question_id, page_id }) => [question_id, page_id]);
