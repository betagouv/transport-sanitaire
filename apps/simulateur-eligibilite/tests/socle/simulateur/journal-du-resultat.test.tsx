// Ce que le premier résultat envoie au journal des parcours (#386) : chaque
// révision affichée, une fois chargée, et sa chute quand une modification de
// P1 la rend caduque. Voir docs/knowledge/adr/analytics.md, ADR-9.
//
// Le modèle de test ne déclare pas de codes : son R2 n'envoie que sa révision
// et la complétion.

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
  qui,
  radio,
  repondreJusquAuResultat,
} from "./questionnaire";

async function ouvrirAvecUnJournal(options: { strictMode?: boolean } = {}) {
  const { analytics, envoyes } = journalDeTest();
  const user = await ouvrirLeSimulateur({ analytics, ...options });
  return { user, envoyes };
}

// Les révisions envoyées, en bref : le type et la révision.
const revisions = (envoyes: AnalyticsEvent[]) =>
  envoyes
    .filter(({ type }) => type.startsWith("result_"))
    .map(({ type, revision }) => `${type} ${revision}`);

// Du résultat, revient sur la page des accompagnements.
async function revenirAuxAccompagnements(
  user: Awaited<ReturnType<typeof ouvrirLeSimulateur>>,
) {
  await user.click(bouton("Précédent"));
  await question(ACCOMPAGNEMENTS);
}

describe("le journal du premier résultat", () => {
  it("un R2 affiché part avec sa révision et la complétion, sans code, motif ni portion que le modèle ne déclare pas", async () => {
    const { user, envoyes } = await ouvrirAvecUnJournal();

    await allerAuResultat(user);

    const affiches = envoyes.filter(({ type }) => type === "result_displayed");
    expect(affiches).toEqual([
      expect.objectContaining({
        screen: "R2",
        revision: "r1",
        can_complete: true,
      }),
    ]);
    expect(affiches[0]).not.toHaveProperty("reason_codes");
    expect(affiches[0]).not.toHaveProperty("motifs");
    expect(affiches[0]).not.toHaveProperty("portions");
  });

  it("monté comme en production, où React rejoue les effets, le R2 part une fois", async () => {
    const { user, envoyes } = await ouvrirAvecUnJournal({ strictMode: true });

    await allerAuResultat(user);

    expect(revisions(envoyes)).toEqual(["result_displayed r1"]);
  });

  it("rien ne part tant que le résultat charge", async () => {
    const { analytics, envoyes } = journalDeTest();
    const user = await ouvrirLeSimulateur({
      analytics,
      modele: qui(() => new Promise(() => {})),
    });

    await repondreJusquAuResultat(user);
    await screen.findByText("Chargement du résultat…");

    expect(revisions(envoyes)).toEqual([]);
  });

  it("revalider sans rien changer garde la révision : le R2 réaffiché ne repart pas", async () => {
    const { user, envoyes } = await ouvrirAvecUnJournal();
    await allerAuResultat(user);

    await revenirAuxAccompagnements(user);
    await user.click(bouton("Voir le résultat"));
    await screen.findByRole("heading", { level: 1, name: "Votre commande" });

    expect(revisions(envoyes)).toEqual(["result_displayed r1"]);
  });

  it("une réponse changée fait tomber la révision à sa validation, et le R2 suivant ouvre r2", async () => {
    const { user, envoyes } = await ouvrirAvecUnJournal();
    await allerAuResultat(user);

    await revenirAuxAccompagnements(user);
    await user.click(caseACocher("Du sucre"));
    await user.click(bouton("Voir le résultat"));
    await screen.findByRole("heading", { level: 1, name: "Votre commande" });

    expect(revisions(envoyes)).toEqual([
      "result_displayed r1",
      "result_invalidated r1",
      "result_displayed r2",
    ]);
    const chute = envoyes.find(({ type }) => type === "result_invalidated");
    expect(chute?.screen).toBe("P1");
  });

  it("une révision tombée ne revient pas, même avec les réponses d'avant", async () => {
    const { user, envoyes } = await ouvrirAvecUnJournal();
    await allerAuResultat(user);

    await revenirAuxAccompagnements(user);
    await user.click(bouton("Précédent"));
    await question(BOISSON);
    await user.click(radio("Rien"));
    await screen.findByRole("heading", { level: 1, name: "Votre commande" });
    await user.click(bouton("Précédent"));
    await question(BOISSON);
    await user.click(radio("Un thé"));
    await question(ACCOMPAGNEMENTS);
    await user.click(caseACocher("Du lait"));
    await user.click(bouton("Voir le résultat"));
    await screen.findByRole("heading", { level: 1, name: "Votre commande" });

    expect(revisions(envoyes).at(-1)).toBe("result_displayed r3");
  });

  it("l'entrée dans le complément porte la révision du R2 qui l'ouvre", async () => {
    const { user, envoyes } = await ouvrirAvecUnJournal();
    await allerAuResultat(user);

    await user.click(bouton("Compléter la commande"));
    await screen.findByRole("spinbutton", QUANTITE);

    expect(envoyes).toContainEqual(
      expect.objectContaining({
        type: "phase_entered",
        screen: "P3",
        revision: "r1",
      }),
    );
  });
});
