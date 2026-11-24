// Ce que les boutons du document R3 envoient au journal des parcours : leur
// exposition une fois le PDF prêt, chaque clic, au clavier comme à la souris,
// puis l'impression et le téléchargement que l'app lance vraiment, sur le même
// document. Un bouton qui attend son PDF n'est ni exposé ni cliqué.

import { screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  boutons,
  LIBELLE_DE_L_AVIS,
  ouvrirAvecUnJournal,
  sansDialogue,
  sansRang,
  venuPour,
} from "./boutons-envoyes";
import { auGabarit, gabaritRetenu } from "./gabarit-retenu";
import { allerAuCerfa, bouton } from "./questionnaire";
import { ecouterLesTelechargements } from "./telechargements";

const IMPRIMER = "Imprimer le bon de commande";
const TELECHARGER = "Télécharger le bon de commande";

// Le texte du second résultat ne vient qu'avec le PDF prêt.
const documentPret = () => screen.findByText(/^Commande : thé, lait/);

let dialogue: ReturnType<typeof sansDialogue>;
let ecoute: ReturnType<typeof ecouterLesTelechargements>;
beforeEach(() => {
  dialogue = sansDialogue();
  ecoute = ecouterLesTelechargements();
});
afterEach(() => {
  dialogue.arreter();
  ecoute.arreter();
});

describe("les boutons du document R3", () => {
  it("le document prêt expose ses boutons et l'avis ; chaque clic part, puis ce que l'app lance", async () => {
    const { user, envoyes } = await ouvrirAvecUnJournal({
      modele: venuPour("prescribe"),
    });
    await allerAuCerfa(user);
    await documentPret();

    await user.click(bouton(IMPRIMER));
    await user.click(bouton(TELECHARGER));
    await user.click(
      screen.getByRole("link", {
        name: `${LIBELLE_DE_L_AVIS} (nouvel onglet)`,
      }),
    );

    expect(ecoute.telechargements).toHaveLength(1);
    expect(boutons(envoyes)).toEqual([
      "button_exposed document_print d1 R3",
      "button_exposed document_download d1 R3",
      "feedback_exposed - d1 R3",
      "button_clicked document_print d1 R3",
      "document_print_requested - d1 R3",
      "button_clicked document_download d1 R3",
      "document_download_requested - d1 R3",
      "document_download_succeeded - d1 R3",
      "feedback_clicked - d1 R3",
    ]);
  });

  it("la souris et le clavier envoient le même clic, et lancent la même impression", async () => {
    const { user, envoyes } = await ouvrirAvecUnJournal();
    await allerAuCerfa(user);
    await documentPret();

    await user.click(bouton(IMPRIMER));
    bouton(IMPRIMER).focus();
    await user.keyboard("{Enter}");
    await waitFor(() =>
      expect(sansRang(envoyes, "document_print_requested")).toHaveLength(2),
    );

    const [souris, clavier] = sansRang(envoyes, "button_clicked");
    expect(clavier).toEqual(souris);
    expect(souris).toMatchObject({
      button_id: "document_print",
      activity_origin: "user",
      document_id: "d1",
      document_revision: "dr1",
      artifact_id: "d1",
    });
    const [lanceALaSouris, lanceAuClavier] = sansRang(
      envoyes,
      "document_print_requested",
    );
    expect(lanceAuClavier).toEqual(lanceALaSouris);
  });

  it("tant que le PDF se génère, rien n'est exposé, et un clic ne part pas", async () => {
    const gabarit = gabaritRetenu();
    const { user, envoyes } = await ouvrirAvecUnJournal({
      modele: auGabarit(gabarit.charge),
    });
    await allerAuCerfa(user);
    await screen.findByText("Génération du document en cours…");

    await user.click(bouton(IMPRIMER));

    expect(bouton(IMPRIMER)).toBeDisabled();
    expect(boutons(envoyes)).toEqual([]);
    gabarit.lache();
    await documentPret();
  });

  it("l'impression qui relance une génération ratée part, sur le document généré, sans clic exposé", async () => {
    const gabarit = gabaritRetenu({ echoueDAbord: true });
    const { user, envoyes } = await ouvrirAvecUnJournal({
      modele: auGabarit(gabarit.charge),
    });
    await allerAuCerfa(user);
    await screen.findByRole("alert");

    await user.click(bouton(IMPRIMER));
    gabarit.lache();
    await documentPret();
    await waitFor(() =>
      expect(boutons(envoyes)).toContain("document_print_requested - d1 R3"),
    );

    expect(boutons(envoyes)).toEqual([
      "button_exposed document_print d1 R3",
      "button_exposed document_download d1 R3",
      "document_print_requested - d1 R3",
    ]);
  });
});
