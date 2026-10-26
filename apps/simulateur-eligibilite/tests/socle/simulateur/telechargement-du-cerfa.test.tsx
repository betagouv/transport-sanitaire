import { resolveObjectURL } from "node:buffer";
import { screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Model } from "../../../front/socle/model";
import { drawnOn } from "../cerfa/test-form";
import { auGabarit, gabaritRetenu } from "./gabarit-retenu";
import { allerAuCerfa, bouton, ouvrirLeSimulateur } from "./questionnaire";
import { ecouterLesTelechargements } from "./telechargements";

// Le cerfa s'imprime et se télécharge sous le second résultat, rempli dans le
// navigateur dès que le résultat s'affiche : les deux actions portent le même
// PDF. Il porte la date du jour où le complément a été validé. Un PDF arrivé
// après qu'on a quitté le résultat ne sort pas (D-190).

type User = Awaited<ReturnType<typeof ouvrirLeSimulateur>>;

const TELECHARGER = "Télécharger le bon de commande";
const IMPRIMER = "Imprimer le bon de commande";
let ecoute: ReturnType<typeof ecouterLesTelechargements>;

beforeEach(() => {
  ecoute = ecouterLesTelechargements();
  vi.useFakeTimers({ toFake: ["Date"] });
});

afterEach(() => {
  ecoute.arreter();
  vi.useRealTimers();
});

describe("le second résultat", () => {
  it("porte le titre que le modèle donne à la préconisation", async () => {
    const user = await ouvrirLeSimulateur();
    await allerAuCerfa(user);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /^Commande complétée : thé, lait Étape/,
      }),
    ).toBeVisible();
  });
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

  it("propose « Imprimer » avant « Télécharger », dans l'ordre où ils s'empilent", async () => {
    const user = await ouvrirLeSimulateur();
    await allerAuCerfa(user);

    const imprimer = await genere(IMPRIMER);
    const telecharger = await genere(TELECHARGER);
    expect(
      imprimer.compareDocumentPosition(telecharger) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("s'imprime tel qu'il se télécharge", async () => {
    const user = await ouvrirLeSimulateur();
    await allerAuCerfa(user);

    const imprime = await imprimer(user);
    const telecharge = await telecharger(user);

    expect(imprime).toEqual(await telecharge.contenu());
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

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Le document n'a pas pu être généré.",
    );
    expect(screen.getByText("Commande : thé, lait, 2 tasses")).toBeVisible();
    expect(ecoute.telechargements).toEqual([]);
  });

  it("dit « Préparation du PDF… » sur « Télécharger » tant qu'il se génère", async () => {
    const gabarit = gabaritRetenu();
    const user = await ouvrirLeSimulateur({
      modele: auGabarit(gabarit.charge),
    });
    await allerAuCerfa(user);

    expect(bouton("Préparation du PDF…")).toBeDisabled();
    expect(bouton(IMPRIMER)).toBeDisabled();
    gabarit.lache();
    expect(await genere(TELECHARGER)).toBeEnabled();
  });

  it("ne sort pas si l'on quitte le résultat pendant une nouvelle tentative", async () => {
    const gabarit = gabaritRetenu({ echoueDAbord: true });
    const user = await ouvrirLeSimulateur({
      modele: auGabarit(gabarit.charge),
    });
    await allerAuCerfa(user);
    await user.click(await genere(TELECHARGER));

    await user.click(bouton("Précédent"));
    gabarit.lache();
    await user.click(bouton("Terminer"));
    await genere(TELECHARGER);

    expect(ecoute.telechargements).toEqual([]);
    expect(document.querySelector("iframe")).toBeNull();
  });
});

// ---- implémentation ----

async function telecharger(user: User) {
  await user.click(await genere(TELECHARGER));
  await waitFor(() => expect(ecoute.telechargements).toHaveLength(1));
  const [pdf] = ecoute.telechargements;
  if (!pdf) throw new Error("Aucun téléchargement.");
  return pdf;
}

// Le bouton `name`, actif une fois le PDF généré.
async function genere(name: string) {
  const action = await screen.findByRole("button", { name });
  await waitFor(() => expect(action).toBeEnabled());
  return action;
}

// Le PDF que le cadre d'impression charge. Le navigateur de test ne l'imprime
// pas : on relit le blob derrière son URL, par Node, qui l'a créée.
async function imprimer(user: User) {
  await user.click(await genere(IMPRIMER));
  const cadre = document.querySelector("iframe");
  const blob = cadre && resolveObjectURL(cadre.src);
  if (!blob) throw new Error("Aucun PDF à imprimer.");
  return new Uint8Array(await blob.arrayBuffer());
}

// Le modèle de test, dont le gabarit ne se charge pas.
function sansGabarit(): Model {
  return auGabarit(() => Promise.reject(new Error("Gabarit introuvable.")));
}
