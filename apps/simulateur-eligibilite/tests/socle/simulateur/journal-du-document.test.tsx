// Ce que le document R3 envoie au journal des parcours : chaque version
// affichée, une fois son PDF prêt, et chaque génération ratée.
//
// Le modèle de test donne une PMT en taxi : son document porte le support
// S3138g et le mode TAP, et sa taille imprimée part sous les identifiants de
// la PMT. Le détail de la mesure se teste sur le parcours
// (`analytics/typographie-du-document.test.ts`) et sur les cerfa du modèle de
// l'éditeur (`r3/taille-des-champs.test.ts`).

import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { AnalyticsEvent } from "../../../shared/analytics/analytics-event";
import { journalDeTest } from "../analytics/journal-de-test";
import { auGabarit, gabaritRetenu } from "./gabarit-retenu";
import {
  allerAuCerfa,
  allerAuResultat,
  bouton,
  ouvrirLeSimulateur,
  QUANTITE,
} from "./questionnaire";
import { ecouterLesTelechargements } from "./telechargements";

type User = Awaited<ReturnType<typeof ouvrirLeSimulateur>>;

async function ouvrirAvecUnJournal(
  options: Parameters<typeof ouvrirLeSimulateur>[0] = {},
) {
  const { analytics, envoyes } = journalDeTest();
  const user = await ouvrirLeSimulateur({ analytics, ...options });
  return { user, envoyes };
}

// Les documents envoyés, en bref : le type, la version et la révision. La
// taille imprimée, qui suit chaque version affichée, n'y est pas.
const documents = (envoyes: AnalyticsEvent[]) =>
  envoyes
    .filter(
      ({ type }) =>
        type.startsWith("document_") && type !== "document_typography_measured",
    )
    .map(
      ({ type, document_id, revision }) =>
        `${type} ${document_id ?? "-"} ${revision}`,
    );

// Le texte du second résultat ne vient qu'avec le PDF prêt, qui se génère
// plus lentement sous charge.
const documentPret = () => screen.findByText(/^Commande : thé, lait/);

// Va jusqu'au second résultat, et attend son PDF.
async function allerAuDocument(user: User) {
  await allerAuCerfa(user);
  await documentPret();
}

// Du second résultat, revient au complément, y saisit `quantite` s'il est
// donné, et revalide.
async function revaliderLeComplement(user: User, quantite?: string) {
  await user.click(bouton("Précédent"));
  const saisie = await screen.findByRole("spinbutton", QUANTITE);
  if (quantite) {
    await user.clear(saisie);
    await user.type(saisie, quantite);
  }
  await user.click(bouton("Terminer"));
  await documentPret();
}

describe("le journal du document R3", () => {
  it("un PDF prêt ouvre la version d1, avec la révision, le support et le mode du R2", async () => {
    const { user, envoyes } = await ouvrirAvecUnJournal();

    await allerAuDocument(user);

    const affiches = envoyes.filter(
      ({ type }) => type === "document_displayed",
    );
    expect(affiches).toEqual([
      expect.objectContaining({
        screen: "R3",
        document_id: "d1",
        revision: "r1",
        support: "S3138g",
        transport_composition: "terrestrial_only",
        mode: "TAP",
      }),
    ]);
  });

  it("la taille imprimée de la version part sous les identifiants de son support", async () => {
    const { user, envoyes } = await ouvrirAvecUnJournal();

    await allerAuDocument(user);

    const mesure = envoyes.find(
      ({ type }) => type === "document_typography_measured",
    );
    expect(mesure).toMatchObject({ document_id: "d1", support: "S3138g" });
    expect(mesure?.expected_field_ids).toEqual(
      expect.arrayContaining(["S3138g.elements_medicaux", "S3138g.nombre"]),
    );
  });

  it("monté comme en production, où React rejoue les effets, le document part une fois", async () => {
    const { user, envoyes } = await ouvrirAvecUnJournal({ strictMode: true });

    await allerAuDocument(user);

    expect(documents(envoyes)).toEqual(["document_displayed d1 r1"]);
  });

  it("rien ne part tant que le PDF se génère", async () => {
    const gabarit = gabaritRetenu();
    const { user, envoyes } = await ouvrirAvecUnJournal({
      modele: auGabarit(gabarit.charge),
    });
    await allerAuResultat(user);
    await user.click(bouton("Compléter la commande"));
    await user.type(screen.getByRole("spinbutton", QUANTITE), "2");
    await user.click(bouton("Terminer"));
    await screen.findByText("Génération du document en cours…");

    expect(documents(envoyes)).toEqual([]);
  });

  it("revenir sur le document sans rien changer garde sa version : il ne repart pas", async () => {
    const { user, envoyes } = await ouvrirAvecUnJournal();
    await allerAuDocument(user);

    await revaliderLeComplement(user);

    expect(documents(envoyes)).toEqual(["document_displayed d1 r1"]);
  });

  it("un complément changé invalide le document : la version d2 garde la révision du R2, sous la révision du document suivante", async () => {
    const { user, envoyes } = await ouvrirAvecUnJournal();
    await allerAuDocument(user);

    await revaliderLeComplement(user, "3");

    expect(documents(envoyes)).toEqual([
      "document_displayed d1 r1",
      "document_invalidated - r1",
      "document_displayed d2 r1",
    ]);
    expect(
      envoyes
        .filter(({ type }) => type.startsWith("document_"))
        .map(({ document_revision }) => document_revision),
    ).toEqual(["dr1", "dr1", "dr2", "dr2", "dr2"]);
  });

  it("une génération ratée part avec la révision, sans version, et ne compte pas comme affichée", async () => {
    const { user, envoyes } = await ouvrirAvecUnJournal({
      modele: auGabarit(() =>
        Promise.reject(new Error("Gabarit introuvable.")),
      ),
    });

    await allerAuCerfa(user);
    await screen.findByRole("alert");

    expect(documents(envoyes)).toEqual(["document_generation_failed - r1"]);
    expect(
      envoyes.find(({ type }) => type === "document_generation_failed"),
    ).toMatchObject({ screen: "R3" });
  });

  it("chaque tentative part : l'échec, le document qu'une nouvelle tentative a généré, puis son téléchargement", async () => {
    const gabarit = gabaritRetenu({ echoueDAbord: true });
    const { user, envoyes } = await ouvrirAvecUnJournal({
      modele: auGabarit(gabarit.charge),
    });
    await allerAuCerfa(user);
    await screen.findByRole("alert");
    const ecoute = ecouterLesTelechargements();

    await user.click(bouton("Télécharger le bon de commande"));
    gabarit.lache();
    await documentPret();
    await waitFor(() => expect(ecoute.telechargements).toHaveLength(1));
    ecoute.arreter();

    expect(documents(envoyes)).toEqual([
      "document_generation_failed - r1",
      "document_displayed d1 r1",
      "document_download_requested d1 r1",
      "document_download_succeeded d1 r1",
    ]);
  });
});
