// Ce que le questionnaire envoie au journal des parcours (#385) : chaque page
// ouverte et ses questions, chaque saisie, chaque validation et celles qu'une
// correction fait tomber, l'entrée et la fin de chaque phase. Voir
// docs/knowledge/adr/analytics.md, ADR-8.
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

const duType = (envoyes: AnalyticsEvent[], type: AnalyticsEvent["type"]) =>
  envoyes.filter((envoye) => envoye.type === type);

// Ce qui part, en bref : le type, et la question ou la phase.
const enBref = (envoyes: AnalyticsEvent[]) =>
  envoyes.map(({ type, question_id, screen }) =>
    [type, question_id ?? screen].join(" "),
  );

describe("le journal des questions", () => {
  it("le parcours jusqu'au résultat : la phase, chaque question exposée, saisie et validée", async () => {
    const { user, envoyes } = await ouvrirAvecUnJournal();

    await allerAuResultat(user);

    expect(enBref(envoyes)).toEqual([
      "simulation_started P0",
      "phase_entered P1",
      "question_exposed boisson",
      "question_interacted boisson",
      "question_validated boisson",
      "question_exposed accompagnements",
      "question_interacted accompagnements",
      "question_validated accompagnements",
      "phase_completed P1",
    ]);
  });

  it("une question est exposée sous l'affichage de sa page, avec ses jalons", async () => {
    const { user, envoyes } = await ouvrirAvecUnJournal();
    await user.click(radio("Un thé"));
    await question(ACCOMPAGNEMENTS);

    const [boisson, accompagnements] = duType(envoyes, "question_exposed");
    expect(boisson).toEqual(
      expect.objectContaining({
        screen: "P1",
        page_id: "boisson",
        exposure_id: `${boisson?.page_view_id}:boisson`,
        // Sans réponse, les accompagnements ne se posent pas encore.
        milestones: ["first", "last"],
      }),
    );
    expect(accompagnements?.milestones).toEqual(["last"]);
    expect(accompagnements?.page_view_id).not.toBe(boisson?.page_view_id);
  });

  it("monté comme en production, où React rejoue les effets, le parcours part une fois", async () => {
    const { user, envoyes } = await ouvrirAvecUnJournal({ strictMode: true });

    await allerAuResultat(user);

    expect(enBref(envoyes)).toEqual([
      "simulation_started P0",
      "phase_entered P1",
      "question_exposed boisson",
      "question_interacted boisson",
      "question_validated boisson",
      "question_exposed accompagnements",
      "question_interacted accompagnements",
      "question_validated accompagnements",
      "phase_completed P1",
    ]);
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

  it("une validation tombée part avec l'exposition qu'elle annule, et la phase ne se termine qu'une fois", async () => {
    const { user, envoyes } = await ouvrirAvecUnJournal();
    await allerAuResultat(user);
    const [, validation] = duType(envoyes, "question_validated");

    await user.click(bouton("Précédent"));
    await question(ACCOMPAGNEMENTS);
    await user.click(bouton("Précédent"));
    await question(BOISSON);
    await user.click(radio("Rien"));
    await screen.findByRole("heading", { level: 1, name: "Votre commande" });

    expect(duType(envoyes, "question_invalidated")).toEqual([
      expect.objectContaining({
        question_id: "accompagnements",
        exposure_id: validation?.exposure_id,
      }),
    ]);
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

    expect(enBref(envoyes.slice(avant))).toEqual([
      "phase_entered P3",
      "question_exposed quantite",
      "question_interacted quantite",
      "question_validated quantite",
      "phase_completed P3",
    ]);
  });
});
