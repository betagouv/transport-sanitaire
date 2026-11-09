// À chaque nouvelle page, l'écran revient en haut. Dans une iframe, l'app
// demande aussi à la page qui l'embarque de remonter au haut de l'iframe :
// Safari ne la laisse pas le faire elle-même (#369). La page parente est une
// vraie fenêtre d'iframe, qui relève les messages reçus.

import { afterEach, describe, expect, it, vi } from "vitest";
import { scrollToTheTop } from "../../../front/socle/questionnaire/scroll-to-the-top";

function pageParente() {
  const iframe = document.createElement("iframe");
  document.body.appendChild(iframe);
  const parent = iframe.contentWindow as Window;
  const demandes: unknown[] = [];
  parent.addEventListener("message", (e) =>
    demandes.push((e as MessageEvent).data),
  );
  return { parent, demandes };
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("le retour en haut de l'écran", () => {
  it("dans l'iframe, demande à la page qui l'embarque d'y remonter", async () => {
    const { parent, demandes } = pageParente();
    scrollToTheTop(document, { parent });
    await vi.waitFor(() =>
      expect(demandes).toEqual([{ type: "defilement-simulateur:haut" }]),
    );
  });

  it("hors iframe, ne demande rien", async () => {
    const envoyes: unknown[] = [];
    const relever = (e: MessageEvent) => envoyes.push(e.data);
    window.addEventListener("message", relever);

    scrollToTheTop(document, { parent: window });
    await new Promise((fin) => setTimeout(fin, 20));

    window.removeEventListener("message", relever);
    expect(envoyes).toEqual([]);
  });
});
