import { screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Model } from "../../../front/socle/model";
import { drawnOn } from "../cerfa/test-form";
import { modeleDeTest } from "../modele-de-test";
import {
  allerAuResultat,
  bouton,
  ouvrirLeSimulateur,
  QUANTITE,
} from "./questionnaire";
import { ecouterLesTelechargements } from "./telechargements";

// Le cerfa se télécharge sous le second résultat, rempli dans le navigateur.
// Il porte la date du jour où le complément a été validé.

type User = Awaited<ReturnType<typeof ouvrirLeSimulateur>>;

const TELECHARGER = "Télécharger le bon de commande";
let ecoute: ReturnType<typeof ecouterLesTelechargements>;

beforeEach(() => {
  ecoute = ecouterLesTelechargements();
  vi.useFakeTimers({ toFake: ["Date"] });
});

afterEach(() => {
  ecoute.arreter();
  vi.useRealTimers();
});

describe("le cerfa", () => {
  it("se télécharge rempli et aplati, sous un nom daté", async () => {
    vi.setSystemTime(new Date("2026-10-14T10:00:00Z"));
    const user = await ouvrirLeSimulateur();
    await allerAuCerfa(user);

    const pdf = await telecharger(user);

    expect(pdf.nom).toBe("bon-de-commande-2026-10-14.pdf");
    expect(await drawnOn(await pdf.contenu())).toEqual({
      fields: 0,
      texts: ["thé, lait", "2", "2026-10-14"],
    });
  });

  it("garde la date du jour où le complément a été validé", async () => {
    vi.setSystemTime(new Date("2026-10-14T10:00:00Z"));
    const user = await ouvrirLeSimulateur();
    await allerAuCerfa(user);
    vi.setSystemTime(new Date("2026-10-15T10:00:00Z"));

    const pdf = await telecharger(user);

    expect(pdf.nom).toBe("bon-de-commande-2026-10-14.pdf");
    expect((await drawnOn(await pdf.contenu())).texts).toContain("2026-10-14");
  });

  it("prend la date du jour quand le complément est validé à nouveau", async () => {
    vi.setSystemTime(new Date("2026-10-14T10:00:00Z"));
    const user = await ouvrirLeSimulateur();
    await allerAuCerfa(user);
    vi.setSystemTime(new Date("2026-10-15T10:00:00Z"));
    await user.click(bouton("Précédent"));
    await user.click(bouton("Terminer"));

    const pdf = await telecharger(user);

    expect((await drawnOn(await pdf.contenu())).texts).toContain("2026-10-15");
  });

  it("qui ne se génère pas le dit, sous le résultat toujours affiché", async () => {
    const user = await ouvrirLeSimulateur({ modele: sansGabarit() });
    await allerAuCerfa(user);

    await user.click(bouton(TELECHARGER));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Le document n'a pas pu être généré.",
    );
    expect(screen.getByText("Commande : thé, lait, 2 tasses")).toBeVisible();
    expect(ecoute.telechargements).toEqual([]);
  });
});

// ---- implémentation ----

async function allerAuCerfa(user: User) {
  await allerAuResultat(user);
  await user.click(bouton("Compléter la commande"));
  await user.type(screen.getByRole("spinbutton", QUANTITE), "2");
  await user.click(bouton("Terminer"));
  await screen.findByText("Commande : thé, lait, 2 tasses");
}

async function telecharger(user: User) {
  await user.click(bouton(TELECHARGER));
  await waitFor(() => expect(ecoute.telechargements).toHaveLength(1));
  const [pdf] = ecoute.telechargements;
  if (!pdf) throw new Error("Aucun téléchargement.");
  return pdf;
}

// Le modèle de test, dont le gabarit ne se charge pas.
function sansGabarit(): Model {
  const { cerfa } = modeleDeTest;
  return {
    ...modeleDeTest,
    cerfa: {
      ...cerfa,
      form: (cibles) => {
        const form = cerfa.form(cibles);
        return (
          form && {
            ...form,
            template: () => Promise.reject(new Error("Gabarit introuvable.")),
          }
        );
      },
    },
  };
}
