// Le chargement de la page, au début de la simulation (ADR-13) : ouverte,
// rechargée ou rouverte par l'historique. Seule la première simulation de la
// page le porte. Dans l'iframe, c'est la page du CMS qui le donne : la page
// parente est une vraie fenêtre d'iframe, qui répond par de vrais évènements
// `message`.

import { afterEach, describe, expect, it, vi } from "vitest";
import { HostPageLoad } from "../../../front/socle/analytics";
import { chargee, journalDeTest } from "./journal-de-test";

const RATTACHEMENT = {
  etabId: "e_chu_grenoble",
  serviceId: "s_grenoble_cardio",
};

const demarrer = ({ analytics }: ReturnType<typeof journalDeTest>) =>
  analytics.startASimulation.execute({
    rattachement: RATTACHEMENT,
    seeded: false,
  });

describe("le chargement de la page", () => {
  it("une simulation ouverte sur une page rechargée le dit", () => {
    const journal = journalDeTest(chargee("reload"));

    demarrer(journal);

    expect(journal.envoyes).toEqual([
      expect.objectContaining({
        type: "simulation_started",
        navigation: "reload",
      }),
    ]);
  });

  it("une simulation ouverte normalement le dit aussi", () => {
    const journal = journalDeTest(chargee("navigate"));

    demarrer(journal);

    expect(journal.envoyes[0]?.navigation).toBe("navigate");
  });

  it("sans type connu du navigateur, la simulation part sans", () => {
    const journal = journalDeTest(chargee(undefined));

    demarrer(journal);

    expect(journal.envoyes).toHaveLength(1);
    expect(journal.envoyes[0]?.navigation).toBeUndefined();
  });

  it("une nouvelle simulation sur la même page ne le dit plus : elle ne l'a pas rechargée", () => {
    const journal = journalDeTest(chargee("reload"));
    demarrer(journal);

    demarrer(journal);

    expect(journal.envoyes.map(({ navigation }) => navigation)).toEqual([
      "reload",
      undefined,
    ]);
  });
});

function pageParente() {
  const iframe = document.createElement("iframe");
  document.body.appendChild(iframe);
  const parent = iframe.contentWindow as Window;
  const demandes: unknown[] = [];
  parent.addEventListener("message", (e) =>
    demandes.push((e as MessageEvent).data),
  );
  const repondre = (navigation: unknown, source: Window = parent) =>
    window.dispatchEvent(
      new MessageEvent("message", {
        data: { type: "chargement-simulateur:type", navigation },
        source,
      }),
    );
  return { parent, demandes, repondre };
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("le chargement de la page qui embarque le simulateur", () => {
  it("hors iframe, lit le sien : le navigateur de test n'en dit rien", () => {
    expect(new HostPageLoad({ parent: window }).navigation()).toBeUndefined();
  });

  it("dans l'iframe, le demande à la page qui l'embarque", async () => {
    const { parent, demandes } = pageParente();
    new HostPageLoad({ parent });
    await vi.waitFor(() =>
      expect(demandes).toEqual([{ type: "chargement-simulateur:demande" }]),
    );
  });

  it("prend le chargement que la page répond", () => {
    const { parent, repondre } = pageParente();
    const chargement = new HostPageLoad({ parent });

    repondre("reload");

    expect(chargement.navigation()).toBe("reload");
  });

  it("tant que la page n'a pas répondu, le chargement est inconnu", () => {
    const { parent } = pageParente();
    expect(new HostPageLoad({ parent }).navigation()).toBeUndefined();
  });

  it("n'écoute que la page qui l'embarque", () => {
    const { parent } = pageParente();
    const { parent: autre, repondre } = pageParente();
    const chargement = new HostPageLoad({ parent });

    repondre("reload", autre);

    expect(chargement.navigation()).toBeUndefined();
  });

  it("ignore un type que le contrat ne connaît pas", () => {
    const { parent, repondre } = pageParente();
    const chargement = new HostPageLoad({ parent });

    repondre("prerender");

    expect(chargement.navigation()).toBeUndefined();
  });
});
