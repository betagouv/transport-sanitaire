// Le script que le CMS (Sites Conformes) exécute sur ses pages. Il ajoute
// l'opt-out au pied de page et répond au simulateur embarqué, sur la mesure
// d'audience, sur le thème, sur le retour au haut de l'iframe et sur le
// chargement de la page. Chaque test le
// charge dans une fenêtre neuve, avec le vrai pied de page DSFR. Le simulateur
// est une fenêtre qui relève les messages reçus.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Window } from "happy-dom";
import { describe, expect, it, vi } from "vitest";
import { racine } from "../../inspection-des-sources";

const SOURCE = readFileSync(
  join(racine, "front", "socle", "analytics", "cms.js"),
  "utf-8",
);
const ORIGINE_SIMULATEUR = /ORIGINE_SIMULATEUR = "([^"]+)"/.exec(SOURCE)?.[1];

const PIED_DE_PAGE = `
  <footer class="fr-footer">
    <div class="fr-footer__bottom">
      <ul class="fr-footer__bottom-list">
        <li class="fr-footer__bottom-item">
          <a class="fr-footer__bottom-link" href="/plan-du-site">Plan du site</a>
        </li>
      </ul>
    </div>
  </footer>`;

function executerLeScript(fenetre: Window) {
  new Function(
    "window",
    "document",
    "localStorage",
    "MutationObserver",
    SOURCE,
  )(fenetre, fenetre.document, fenetre.localStorage, fenetre.MutationObserver);
}

// `chargement` : le type que le navigateur donne au chargement de la page.
function pageDuCms({
  refusMemorise = false,
  theme = "",
  chargement = "",
} = {}) {
  const fenetre = new Window({ url: "https://cms.test/" });
  Object.defineProperty(fenetre, "performance", {
    value: {
      getEntriesByType: (type: string) =>
        type === "navigation" && chargement ? [{ type: chargement }] : [],
    },
  });
  fenetre.document.body.innerHTML = PIED_DE_PAGE;
  if (theme)
    fenetre.document.documentElement.setAttribute("data-fr-theme", theme);
  if (refusMemorise) {
    fenetre.localStorage.setItem("statistiques-simulateur-refusees", "1");
  }
  executerLeScript(fenetre);

  const simulateur = {
    recus: [] as Array<{ message: unknown; origine: string }>,
    postMessage(message: unknown, origine: string) {
      this.recus.push({ message, origine });
    },
  };
  const demander = (
    origin = ORIGINE_SIMULATEUR,
    type = "statistiques-simulateur:demande",
  ) =>
    fenetre.dispatchEvent(
      new fenetre.MessageEvent("message", {
        data: { type },
        origin,
        source: simulateur as never,
      }),
    );
  const demanderLeTheme = () =>
    demander(ORIGINE_SIMULATEUR, "theme-simulateur:demande");
  const changerLeTheme = (theme: string) =>
    fenetre.document.documentElement.setAttribute("data-fr-theme", theme);
  const bouton = () =>
    fenetre.document.querySelector(
      ".fr-footer__bottom-list li:last-child button",
    ) as unknown as HTMLButtonElement;
  return { simulateur, demander, demanderLeTheme, changerLeTheme, bouton };
}

const choix = (suivi: boolean) => ({
  message: { type: "statistiques-simulateur:choix", suivi },
  origine: ORIGINE_SIMULATEUR,
});
const theme = (theme: string) => ({
  message: { type: "theme-simulateur:choix", theme },
  origine: ORIGINE_SIMULATEUR,
});

describe("opt-out de la mesure d'audience, côté CMS", () => {
  it("ajoute l'opt-out à la fin du pied de page", () => {
    const { bouton } = pageDuCms();
    expect(bouton().textContent).toBe(
      "Désactiver la mesure d'audience du simulateur",
    );
    expect(bouton().className).toBe("fr-footer__bottom-link");
  });

  it("répond au simulateur que la mesure est acceptée par défaut", () => {
    const { simulateur, demander } = pageDuCms();
    demander();
    expect(simulateur.recus).toEqual([choix(true)]);
  });

  it("ne répond qu'au simulateur, pas à une autre origine", () => {
    const { simulateur, demander } = pageDuCms();
    demander("https://ailleurs.test");
    expect(simulateur.recus).toEqual([]);
  });

  it("au clic, prévient le simulateur du refus et change son libellé", () => {
    const { simulateur, demander, bouton } = pageDuCms();
    demander();
    bouton().click();

    expect(simulateur.recus.at(-1)).toEqual(choix(false));
    expect(bouton().textContent).toBe(
      "Réactiver la mesure d'audience du simulateur",
    );
  });

  it("se souvient du refus d'une visite précédente", () => {
    const { simulateur, demander, bouton } = pageDuCms({
      refusMemorise: true,
    });
    demander();
    expect(simulateur.recus).toEqual([choix(false)]);
    expect(bouton().textContent).toBe(
      "Réactiver la mesure d'audience du simulateur",
    );
  });

  it("un second clic réactive la mesure", () => {
    const { simulateur, demander, bouton } = pageDuCms();
    demander();
    bouton().click();
    bouton().click();
    expect(simulateur.recus.at(-1)).toEqual(choix(true));
  });
});

describe("thème de la page, côté CMS", () => {
  it("répond au simulateur le thème que le DSFR a résolu", () => {
    const { simulateur, demanderLeTheme } = pageDuCms({ theme: "dark" });
    demanderLeTheme();
    expect(simulateur.recus).toEqual([theme("dark")]);
  });

  it("répond clair tant que le DSFR n'a rien résolu", () => {
    const { simulateur, demanderLeTheme } = pageDuCms();
    demanderLeTheme();
    expect(simulateur.recus).toEqual([theme("light")]);
  });

  it("prévient le simulateur quand le thème change", async () => {
    const { simulateur, demanderLeTheme, changerLeTheme } = pageDuCms({
      theme: "light",
    });
    demanderLeTheme();
    changerLeTheme("dark");
    await vi.waitFor(() =>
      expect(simulateur.recus.at(-1)).toEqual(theme("dark")),
    );
  });

  it("ne répond le thème qu'au simulateur", () => {
    const { simulateur, demander } = pageDuCms({ theme: "dark" });
    demander("https://ailleurs.test", "theme-simulateur:demande");
    expect(simulateur.recus).toEqual([]);
  });
});

// La page du CMS et l'iframe du simulateur, à 1 500 px du haut. La fenêtre de
// test ne met pas en page : l'iframe dit où elle est d'après le défilement.
function pageAvecLeSimulateur() {
  const fenetre = new Window({ url: "https://cms.test/" });
  fenetre.document.body.innerHTML = `<iframe src="about:blank"></iframe>`;
  const iframe = fenetre.document.querySelector("iframe");
  if (!iframe) throw new Error("iframe absente");
  iframe.getBoundingClientRect = () =>
    new fenetre.DOMRect(0, 1500 - fenetre.scrollY, 600, 3000);
  executerLeScript(fenetre);
  const demanderLeHaut = (source: unknown, origin = ORIGINE_SIMULATEUR) =>
    fenetre.dispatchEvent(
      new fenetre.MessageEvent("message", {
        data: { type: "defilement-simulateur:haut" },
        origin,
        source: source as never,
      }),
    );
  return { fenetre, simulateur: iframe.contentWindow, demanderLeHaut };
}

describe("retour au haut de l'iframe, côté CMS", () => {
  it("remonte la page au haut de l'iframe qui le demande", () => {
    const { fenetre, simulateur, demanderLeHaut } = pageAvecLeSimulateur();
    fenetre.scrollTo({ top: 4100 });
    demanderLeHaut(simulateur);
    expect(fenetre.scrollY).toBe(1500);
  });

  it("ne remonte que pour le simulateur, pas pour une autre origine", () => {
    const { fenetre, simulateur, demanderLeHaut } = pageAvecLeSimulateur();
    fenetre.scrollTo({ top: 4100 });
    demanderLeHaut(simulateur, "https://ailleurs.test");
    expect(fenetre.scrollY).toBe(4100);
  });

  it("ne remonte que pour une iframe de la page", () => {
    const { fenetre, demanderLeHaut } = pageAvecLeSimulateur();
    fenetre.scrollTo({ top: 4100 });
    demanderLeHaut(new Window());
    expect(fenetre.scrollY).toBe(4100);
  });
});

const chargement = (navigation: string | undefined) => ({
  message: { type: "chargement-simulateur:type", navigation },
  origine: ORIGINE_SIMULATEUR,
});

describe("chargement de la page, côté CMS", () => {
  it("répond au simulateur que la page du CMS a été rechargée", () => {
    const { simulateur, demander } = pageDuCms({ chargement: "reload" });
    demander(ORIGINE_SIMULATEUR, "chargement-simulateur:demande");
    expect(simulateur.recus).toEqual([chargement("reload")]);
  });

  it("répond sans type quand le navigateur ne dit rien", () => {
    const { simulateur, demander } = pageDuCms();
    demander(ORIGINE_SIMULATEUR, "chargement-simulateur:demande");
    expect(simulateur.recus).toEqual([chargement(undefined)]);
  });

  it("ne répond le chargement qu'au simulateur", () => {
    const { simulateur, demander } = pageDuCms({ chargement: "reload" });
    demander("https://ailleurs.test", "chargement-simulateur:demande");
    expect(simulateur.recus).toEqual([]);
  });
});
