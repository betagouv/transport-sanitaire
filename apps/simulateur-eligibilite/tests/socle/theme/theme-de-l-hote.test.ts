// Le thème du simulateur suit celui de la page qui l'embarque. Le simulateur le
// demande, le CMS répond, puis prévient de chaque changement. La page parente
// est une vraie fenêtre d'iframe, qui répond par de vrais évènements `message`.

import { afterEach, describe, expect, it, vi } from "vitest";
import { applyTheme } from "../../../front/socle/theme/apply-theme";
import {
  followHostTheme,
  type Theme,
} from "../../../front/socle/theme/host-theme";

function pageParente() {
  const iframe = document.createElement("iframe");
  document.body.appendChild(iframe);
  const parent = iframe.contentWindow as Window;
  const demandes: unknown[] = [];
  parent.addEventListener("message", (e) =>
    demandes.push((e as MessageEvent).data),
  );
  const repondre = (data: unknown, source: Window = parent) =>
    window.dispatchEvent(new MessageEvent("message", { data, source }));
  return { parent, demandes, repondre };
}

function suivre(options: Parameters<typeof followHostTheme>[1]) {
  const themes: Theme[] = [];
  followHostTheme((theme) => themes.push(theme), options);
  return themes;
}

const sombre = { type: "theme-simulateur:choix", theme: "dark" };
const clair = { type: "theme-simulateur:choix", theme: "light" };

afterEach(() => {
  document.body.innerHTML = "";
});

describe("le thème de la page qui embarque l'app", () => {
  it("hors iframe, reste clair sans rien demander", () => {
    expect(suivre({ parent: window })).toEqual(["light"]);
  });

  it("dans l'iframe, demande son thème à la page qui l'embarque", async () => {
    const { parent, demandes } = pageParente();
    suivre({ parent });
    await vi.waitFor(() =>
      expect(demandes).toEqual([{ type: "theme-simulateur:demande" }]),
    );
  });

  it("prend le thème sombre que la page transmet", () => {
    const { parent, repondre } = pageParente();
    const themes = suivre({ parent });
    repondre(sombre);
    expect(themes).toEqual(["dark"]);
  });

  it("suit les changements ultérieurs du thème", () => {
    const { parent, repondre } = pageParente();
    const themes = suivre({ parent });
    repondre(sombre);
    repondre(clair);
    expect(themes).toEqual(["dark", "light"]);
  });

  it("ignore un thème qu'il ne connaît pas", () => {
    const { parent, repondre } = pageParente();
    const themes = suivre({ parent, delaiMs: 60_000 });
    repondre({ type: "theme-simulateur:choix", theme: "sepia" });
    expect(themes).toEqual([]);
  });

  it("n'écoute que la page qui l'embarque", () => {
    const { parent } = pageParente();
    const { parent: autre, repondre } = pageParente();
    const themes = suivre({ parent, delaiMs: 60_000 });
    repondre(sombre, autre);
    expect(themes).toEqual([]);
  });

  it("sans réponse de la page, reste clair au bout du délai", async () => {
    const { parent } = pageParente();
    const themes = suivre({ parent, delaiMs: 10 });
    expect(themes).toEqual([]);
    await vi.waitFor(() => expect(themes).toEqual(["light"]));
  });
});

describe("le thème posé sur le DSFR", () => {
  it("pose le choix et le thème résolu sur la racine", () => {
    const racine = document.createElement("html");
    applyTheme("dark", racine);
    expect(racine.getAttribute("data-fr-scheme")).toBe("dark");
    expect(racine.getAttribute("data-fr-theme")).toBe("dark");
  });
});
