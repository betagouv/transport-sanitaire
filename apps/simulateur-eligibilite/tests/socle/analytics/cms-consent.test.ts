// Le pont avec la page qui embarque l'app. Le simulateur demande le choix du
// prescripteur sur la mesure d'audience, et le CMS répond. La page parente est
// une vraie fenêtre d'iframe. Elle répond par de vrais évènements `message`.

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CmsConsent,
  type CmsConsentOptions,
} from "../../../front/socle/analytics/cms-consent.adapter";
import type { Consent } from "../../../front/socle/analytics/consent.port";

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

function suivre(options: CmsConsentOptions) {
  const choix: Consent[] = [];
  new CmsConsent(options).follow((c) => choix.push(c));
  return choix;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("choix du prescripteur sur la mesure d'audience", () => {
  it("hors iframe, mesure sans rien demander", () => {
    expect(suivre({ parent: window })).toEqual(["suivi"]);
  });

  it("dans l'iframe, demande le choix à la page qui l'embarque", async () => {
    const { parent, demandes } = pageParente();
    suivre({ parent });
    await vi.waitFor(() =>
      expect(demandes).toEqual([{ type: "statistiques-simulateur:demande" }]),
    );
  });

  it("applique le refus transmis par la page", () => {
    const { parent, repondre } = pageParente();
    const choix = suivre({ parent });
    repondre({ type: "statistiques-simulateur:choix", suivi: false });
    expect(choix).toEqual(["refus"]);
  });

  it("suit les changements ultérieurs du choix", () => {
    const { parent, repondre } = pageParente();
    const choix = suivre({ parent });
    repondre({ type: "statistiques-simulateur:choix", suivi: false });
    repondre({ type: "statistiques-simulateur:choix", suivi: true });
    expect(choix).toEqual(["refus", "suivi"]);
  });

  it("n'écoute que la page qui l'embarque", () => {
    const { parent } = pageParente();
    const { parent: autre, repondre } = pageParente();
    const choix = suivre({ parent, delaiMs: 60_000 });
    repondre({ type: "statistiques-simulateur:choix", suivi: false }, autre);
    expect(choix).toEqual([]);
  });

  it("demande une fois pour tous ceux qui suivent le choix", async () => {
    const { parent, demandes, repondre } = pageParente();
    const consentement = new CmsConsent({ parent });
    const matomo: Consent[] = [];
    const journal: Consent[] = [];
    consentement.follow((c) => matomo.push(c));
    consentement.follow((c) => journal.push(c));

    repondre({ type: "statistiques-simulateur:choix", suivi: false });

    expect(matomo).toEqual(["refus"]);
    expect(journal).toEqual(["refus"]);
    await vi.waitFor(() => expect(demandes).toHaveLength(1));
  });

  it("donne le choix déjà connu à qui le suit ensuite", () => {
    const { parent, repondre } = pageParente();
    const consentement = new CmsConsent({ parent });
    consentement.follow(() => {});
    repondre({ type: "statistiques-simulateur:choix", suivi: false });
    const tardif: Consent[] = [];

    consentement.follow((c) => tardif.push(c));

    expect(tardif).toEqual(["refus"]);
  });

  it("sans réponse de la page, mesure au bout du délai", async () => {
    const { parent } = pageParente();
    const choix = suivre({ parent, delaiMs: 10 });
    expect(choix).toEqual([]);
    await vi.waitFor(() => expect(choix).toEqual(["suivi"]));
  });
});
