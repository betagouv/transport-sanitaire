// Ce que le questionnaire envoie au journal des parcours (#385) : chaque page
// ouverte et ses questions, chaque saisie, chaque validation, l'entrée, les
// limites affichées et la fin de chaque phase. Voir ADR-0044.
//
// Le modèle de test pose P1 (la boisson, puis les accompagnements, sauf pour
// « Rien ») et P3 (la quantité).

import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { AnalyticsEvent } from "../../../shared/analytics/analytics-event";
import { journalDeTest } from "../analytics/journal-de-test";
import {
  ACCOMPAGNEMENTS,
  allerAuResultat,
  BOISSON,
  bouton,
  caseACocher,
  ouvrirLeSimulateur,
  QUANTITE,
  question,
  radio,
} from "./questionnaire";

async function ouvrirAvecUnJournal({ strictMode = false } = {}) {
  const { analytics, envoyes } = journalDeTest();
  const user = await ouvrirLeSimulateur({ analytics, strictMode });
  await question(BOISSON);
  return { user, envoyes };
}

// L'affichage d'une exposition : son id, sans la question.
const affichageDe = (exposition?: AnalyticsEvent) =>
  exposition?.exposure_id?.replace(/:[^:]+$/, "");

const duType = (envoyes: AnalyticsEvent[], type: AnalyticsEvent["type"]) =>
  envoyes.filter((envoye) => envoye.type === type);

// Ce qui part, en bref : le type, la question ou la phase, et la limite.
const enBref = (envoyes: AnalyticsEvent[]) =>
  envoyes.map(({ type, question_id, screen, boundary }) =>
    [type, question_id ?? screen, boundary].filter(Boolean).join(" "),
  );

// Le parcours du modèle de test jusqu'au résultat. Sans réponse, les
// accompagnements ne se posent pas encore : la boisson est d'abord la première
// et la dernière page de P1.
const JUSQU_AU_RESULTAT = [
  "simulation_started P0",
  "phase_entered P1",
  "phase_boundary_displayed P1 first",
  "phase_boundary_displayed P1 last",
  "question_exposed boisson",
  "question_interacted boisson",
  "question_validated boisson",
  "phase_boundary_displayed P1 last",
  "question_exposed accompagnements",
  "question_interacted accompagnements",
  "question_validated accompagnements",
  "phase_completed P1",
  "result_displayed R2",
];

describe("le journal des questions", () => {
  it("le parcours jusqu'au résultat : la phase, chaque question exposée, saisie et validée", async () => {
    const { user, envoyes } = await ouvrirAvecUnJournal();

    await allerAuResultat(user);

    expect(enBref(envoyes)).toEqual(JUSQU_AU_RESULTAT);
  });

  it("une question est exposée sous l'affichage de sa page", async () => {
    const { user, envoyes } = await ouvrirAvecUnJournal();
    await user.click(radio("Un thé"));
    await question(ACCOMPAGNEMENTS);

    const [boisson, accompagnements] = duType(envoyes, "question_exposed");
    expect(boisson).toEqual(
      expect.objectContaining({
        screen: "P1",
        page_id: "boisson",
        exposure_id: expect.stringMatching(/:boisson$/),
      }),
    );
    expect(affichageDe(accompagnements)).not.toBe(affichageDe(boisson));
  });

  it("une limite de phase part avec la page qui l'affiche", async () => {
    const { user, envoyes } = await ouvrirAvecUnJournal();
    await user.click(radio("Un thé"));
    await question(ACCOMPAGNEMENTS);

    expect(duType(envoyes, "phase_boundary_displayed")).toEqual([
      expect.objectContaining({
        screen: "P1",
        boundary: "first",
        page_id: "boisson",
      }),
      expect.objectContaining({
        screen: "P1",
        boundary: "last",
        page_id: "boisson",
      }),
      expect.objectContaining({
        screen: "P1",
        boundary: "last",
        page_id: "accompagnements",
      }),
    ]);
  });

  it("une limite déjà affichée ne repart pas quand sa page se rouvre", async () => {
    const { user, envoyes } = await ouvrirAvecUnJournal();
    await user.click(radio("Un thé"));
    await question(ACCOMPAGNEMENTS);

    await user.click(bouton("Précédent"));
    await question(BOISSON);

    expect(duType(envoyes, "phase_boundary_displayed")).toHaveLength(3);
  });

  it("monté comme en production, où React rejoue les effets, le parcours part une fois", async () => {
    const { user, envoyes } = await ouvrirAvecUnJournal({ strictMode: true });

    await allerAuResultat(user);

    expect(enBref(envoyes)).toEqual(JUSQU_AU_RESULTAT);
  });

  it("une saisie n'expose rien de plus, et ne part qu'au changement de question", async () => {
    const { user, envoyes } = await ouvrirAvecUnJournal();
    await user.click(radio("Un thé"));
    await question(ACCOMPAGNEMENTS);

    await user.click(caseACocher("Du lait"));
    await user.click(caseACocher("Du sucre"));

    expect(enBref(envoyes).slice(-2)).toEqual([
      "question_exposed accompagnements",
      "question_interacted accompagnements",
    ]);
  });

  it("une page rouverte est un nouvel affichage, dans la même phase", async () => {
    const { user, envoyes } = await ouvrirAvecUnJournal();
    await user.click(radio("Un thé"));
    await question(ACCOMPAGNEMENTS);

    await user.click(bouton("Précédent"));
    await question(BOISSON);

    const boissons = duType(envoyes, "question_exposed").filter(
      ({ question_id }) => question_id === "boisson",
    );
    expect(boissons).toHaveLength(2);
    expect(boissons[1]?.exposure_id).not.toBe(boissons[0]?.exposure_id);
    expect(duType(envoyes, "phase_entered")).toHaveLength(1);
  });

  it("une correction qui change la fin de la phase ne la termine pas une seconde fois", async () => {
    const { user, envoyes } = await ouvrirAvecUnJournal();
    await allerAuResultat(user);

    await user.click(bouton("Précédent"));
    await question(ACCOMPAGNEMENTS);
    await user.click(bouton("Précédent"));
    await question(BOISSON);
    await user.click(radio("Rien"));
    await screen.findByRole("heading", { level: 1, name: "Votre commande" });

    expect(duType(envoyes, "phase_completed")).toHaveLength(1);
  });

  it("le complément suit le journal, de l'entrée en P3 à sa fin", async () => {
    const { user, envoyes } = await ouvrirAvecUnJournal();
    await allerAuResultat(user);
    const avant = envoyes.length;

    await user.click(bouton("Compléter la commande"));
    await user.type(screen.getByRole("spinbutton", QUANTITE), "2");
    await user.click(bouton("Terminer"));
    await screen.findByRole("button", { name: "Imprimer le bon de commande" });

    // Le document de R3 suit, plus ou moins vite : il a son propre journal.
    const duComplement = envoyes
      .slice(avant)
      .filter(({ screen }) => screen === "P3");
    expect(enBref(duComplement)).toEqual([
      "phase_entered P3",
      "phase_boundary_displayed P3 first",
      "phase_boundary_displayed P3 last",
      "question_exposed quantite",
      "question_interacted quantite",
      "question_validated quantite",
      "phase_completed P3",
    ]);
  });
});
