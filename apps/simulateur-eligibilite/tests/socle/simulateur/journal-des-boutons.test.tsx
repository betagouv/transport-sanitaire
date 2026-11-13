// Ce que les boutons des écrans de résultat envoient au journal des parcours
// (#388) : leur exposition, une fois par affichage et par version de leur
// objet, puis chaque clic, au clavier comme à la souris, avec la même
// exposition. Voir docs/knowledge/adr/analytics.md, ADR-11.
//
// Le navigateur de test ne met pas en page : le PDF de la fiche y échoue
// toujours, et son téléchargement n'y réussit jamais.

import { fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { constant } from "../../../core/socle";
import type { Intent, Model } from "../../../front/socle/model";
import type { AnalyticsEvent } from "../../../shared/analytics/analytics-event";
import { journalDeTest } from "../analytics/journal-de-test";
import { modeleDeTest } from "../modele-de-test";
import {
  allerAuCerfa,
  bouton,
  ouvrirLeSimulateur,
  qui,
  repondreJusquAuResultat,
} from "./questionnaire";
import { ecouterLesTelechargements } from "./telechargements";

const LIBELLE = "Donnez votre avis";

// Le modèle de test, venu pour cette intention, qui invite à donner son avis.
const venuPour = (intent: Intent, modele = modeleDeTest): Model => ({
  ...modele,
  intent: constant(intent),
  feedback: { url: "https://exemple.test/avis", label: LIBELLE },
});

// Un premier résultat qui montre une fiche.
const avecUneFiche = qui(async () => ({
  title: "Le résultat",
  sheet: { title: "Votre commande", body: "Un contenu" },
}));

async function ouvrirAvecUnJournal(
  options: Parameters<typeof ouvrirLeSimulateur>[0] = {},
) {
  const { analytics, envoyes } = journalDeTest();
  const user = await ouvrirLeSimulateur({ analytics, ...options });
  return { user, envoyes };
}

async function allerALaFiche(
  user: Awaited<ReturnType<typeof ouvrirLeSimulateur>>,
) {
  await repondreJusquAuResultat(user);
  await screen.findByRole("heading", { level: 1, name: "Le résultat" });
}

// Les événements des boutons, sans ceux des questions.
const desBoutons = (envoyes: AnalyticsEvent[]) =>
  envoyes.filter(
    ({ type, exposure_id }) => exposure_id && !type.startsWith("question_"),
  );

// Les événements des boutons, en bref : le type, l'action, l'objet et l'écran.
const boutons = (envoyes: AnalyticsEvent[]) =>
  desBoutons(envoyes).map(
    ({ type, action, sheet_id, document_id, revision, screen }) =>
      `${type}${action ? `/${action}` : ""} ${sheet_id ?? document_id ?? revision} ${screen}`,
  );

const exposition = (envoyes: AnalyticsEvent[], type: string) =>
  envoyes.find((event) => event.type === type)?.exposure_id;

// Le dialogue d'impression, que le navigateur de test n'a pas, et l'onglet que
// l'avis ouvrirait : ni l'un ni l'autre ne s'ouvre ici.
const sansOnglet = (event: Event) => {
  if (event.target instanceof HTMLAnchorElement && event.target.target)
    event.preventDefault();
};
beforeEach(() => {
  window.print = () => {};
  document.addEventListener("click", sansOnglet);
});
afterEach(() => {
  Reflect.deleteProperty(window, "print");
  document.removeEventListener("click", sansOnglet);
});

describe("les boutons de la fiche patient", () => {
  it("le R2 expose « Imprimer » et « Télécharger » sur la version f1, avec son affichage", async () => {
    const { user, envoyes } = await ouvrirAvecUnJournal({
      modele: avecUneFiche,
    });

    await allerALaFiche(user);

    expect(boutons(envoyes)).toEqual([
      "action_exposed/print f1 R2",
      "action_exposed/download f1 R2",
    ]);
    const [imprimer] = desBoutons(envoyes);
    expect(imprimer?.exposure_id).toBe(
      `${imprimer?.page_view_id}:sheet_print:f1`,
    );
  });

  it("chaque clic part avec l'exposition du bouton, à la souris comme au clavier", async () => {
    const { user, envoyes } = await ouvrirAvecUnJournal({
      modele: avecUneFiche,
    });
    await allerALaFiche(user);

    await user.click(bouton("Imprimer"));
    bouton("Imprimer").focus();
    await user.keyboard("{Enter}");

    const clics = envoyes.filter(
      ({ type }) => type === "sheet_print_requested",
    );
    expect(clics).toHaveLength(2);
    expect(clics).toEqual(
      clics.map(() =>
        expect.objectContaining({
          screen: "R2",
          revision: "r1",
          sheet_id: "f1",
          exposure_id: exposition(envoyes, "action_exposed"),
        }),
      ),
    );
  });

  it("le téléchargement demandé part, et rien d'autre quand son PDF échoue", async () => {
    const { user, envoyes } = await ouvrirAvecUnJournal({
      modele: avecUneFiche,
    });
    await allerALaFiche(user);

    fireEvent.click(bouton("Télécharger"));
    await screen.findByText(/^Le téléchargement a échoué/);

    expect(boutons(envoyes).slice(2)).toEqual([
      "sheet_download_requested f1 R2",
    ]);
  });

  it("un second affichage du R2 expose à nouveau, sur la même version de la fiche", async () => {
    const { user, envoyes } = await ouvrirAvecUnJournal({
      modele: avecUneFiche,
    });
    await allerALaFiche(user);

    await user.click(bouton("Précédent"));
    await user.click(
      await screen.findByRole("button", { name: "Voir le résultat" }),
    );
    await screen.findByRole("heading", { level: 1, name: "Le résultat" });
    await user.click(bouton("Imprimer"));

    const imprimer = envoyes.filter(({ action }) => action === "print");
    expect(imprimer.map(({ sheet_id }) => sheet_id)).toEqual(["f1", "f1"]);
    expect(imprimer[0]?.page_view_id).not.toBe(imprimer[1]?.page_view_id);
    expect(exposition(envoyes, "sheet_print_requested")).toBe(
      imprimer[1]?.exposure_id,
    );
  });

  it("monté comme en production, où React rejoue les effets, chaque bouton est exposé une fois", async () => {
    const { user, envoyes } = await ouvrirAvecUnJournal({
      modele: avecUneFiche,
      strictMode: true,
    });

    await allerALaFiche(user);

    expect(boutons(envoyes)).toEqual([
      "action_exposed/print f1 R2",
      "action_exposed/download f1 R2",
    ]);
  });
});

describe("l'avis", () => {
  it("en R2, il est exposé avec la révision, et son clic garde l'exposition", async () => {
    const { user, envoyes } = await ouvrirAvecUnJournal({
      modele: venuPour("check"),
    });
    await repondreJusquAuResultat(user);
    const avis = await screen.findByRole("link", {
      name: `${LIBELLE} (nouvel onglet)`,
    });

    await user.click(avis);

    expect(boutons(envoyes)).toEqual([
      "feedback_exposed r1 R2",
      "feedback_clicked r1 R2",
    ]);
    expect(exposition(envoyes, "feedback_clicked")).toBe(
      exposition(envoyes, "feedback_exposed"),
    );
  });
});

describe("les boutons du document R3", () => {
  it("le document prêt expose ses boutons et l'avis sur sa version, et chaque clic part avec", async () => {
    const { user, envoyes } = await ouvrirAvecUnJournal({
      modele: venuPour("prescribe"),
    });
    await allerAuCerfa(user);
    // Le texte du second résultat ne vient qu'avec le PDF prêt.
    await screen.findByText(/^Commande : thé, lait/, {}, { timeout: 4000 });
    const { telechargements, arreter } = ecouterLesTelechargements();

    await user.click(bouton("Imprimer le bon de commande"));
    await user.click(bouton("Télécharger le bon de commande"));
    await user.click(
      screen.getByRole("link", { name: `${LIBELLE} (nouvel onglet)` }),
    );
    arreter();

    expect(telechargements).toHaveLength(1);
    expect(boutons(envoyes)).toEqual([
      "action_exposed/print d1 R3",
      "action_exposed/download d1 R3",
      "feedback_exposed d1 R3",
      "document_print_requested d1 R3",
      "document_download_requested d1 R3",
      "document_download_succeeded d1 R3",
      "feedback_clicked d1 R3",
    ]);
    expect(exposition(envoyes, "document_download_succeeded")).toBe(
      envoyes.find(({ action }) => action === "download")?.exposure_id,
    );
  });
});
