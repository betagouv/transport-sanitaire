// Ce que les boutons du premier résultat envoient au journal des parcours :
// leur exposition, une fois tant qu'ils restent affichés sur la même fiche,
// puis chaque clic, au clavier comme à la souris, avec la même exposition.
//
// Le navigateur de test ne met pas en page : le PDF de la fiche y échoue
// toujours, et son téléchargement n'y réussit jamais.

import { fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  boutons,
  LIBELLE_DE_L_AVIS,
  ouvrirAvecUnJournal,
  sansDialogue,
  sansRang,
  venuPour,
} from "./boutons-envoyes";
import {
  bouton,
  type ouvrirLeSimulateur,
  qui,
  repondreJusquAuResultat,
} from "./questionnaire";

// Un premier résultat qui montre une fiche.
const avecUneFiche = qui(async () => ({
  title: "Le résultat",
  sheet: { title: "Votre commande", body: "Un contenu" },
}));

async function allerALaFiche(
  user: Awaited<ReturnType<typeof ouvrirLeSimulateur>>,
) {
  await repondreJusquAuResultat(user);
  await screen.findByRole("heading", { level: 1, name: "Le résultat" });
}

let dialogue: ReturnType<typeof sansDialogue>;
beforeEach(() => {
  dialogue = sansDialogue();
});
afterEach(() => dialogue.arreter());

describe("les boutons de la fiche patient", () => {
  it("le R2 expose « Imprimer » et « Télécharger » sur la version f1 de la fiche", async () => {
    const { user, envoyes } = await ouvrirAvecUnJournal({
      modele: avecUneFiche,
    });

    await allerALaFiche(user);

    expect(boutons(envoyes)).toEqual([
      "button_exposed patient_sheet_print f1 R2",
      "button_exposed patient_sheet_download f1 R2",
    ]);
  });

  it("la souris et le clavier envoient le même clic, avec l'exposition du bouton", async () => {
    const { user, envoyes } = await ouvrirAvecUnJournal({
      modele: avecUneFiche,
    });
    await allerALaFiche(user);

    await user.click(bouton("Imprimer"));
    bouton("Imprimer").focus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");

    const [souris, ...clavier] = sansRang(envoyes, "button_clicked");
    expect(clavier).toEqual([souris, souris]);
    expect(souris).toMatchObject({
      button_id: "patient_sheet_print",
      activity_origin: "user",
      screen: "R2",
      revision: "r1",
      artifact_id: "f1",
      exposure_id: envoyes.find(
        ({ button_id }) => button_id === "patient_sheet_print",
      )?.exposure_id,
    });
  });

  it("le téléchargement cliqué part comme un clic, et rien d'autre quand son PDF échoue", async () => {
    const { user, envoyes } = await ouvrirAvecUnJournal({
      modele: avecUneFiche,
    });
    await allerALaFiche(user);

    fireEvent.click(bouton("Télécharger"));
    await screen.findByText(/^Le téléchargement a échoué/);

    expect(boutons(envoyes).slice(2)).toEqual([
      "button_clicked patient_sheet_download f1 R2",
    ]);
  });

  it("le R2 quitté puis réaffiché expose à nouveau, sur la même version de la fiche", async () => {
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

    const imprimer = envoyes.filter(
      ({ button_id }) => button_id === "patient_sheet_print",
    );
    expect(boutons(imprimer)).toEqual([
      "button_exposed patient_sheet_print f1 R2",
      "button_exposed patient_sheet_print f1 R2",
      "button_clicked patient_sheet_print f1 R2",
    ]);
    const [premiere, seconde, clic] = imprimer;
    expect(premiere?.exposure_id).not.toBe(seconde?.exposure_id);
    expect(clic?.exposure_id).toBe(seconde?.exposure_id);
  });

  it("monté comme en production, où React rejoue les effets, chaque bouton est exposé une fois", async () => {
    const { user, envoyes } = await ouvrirAvecUnJournal({
      modele: avecUneFiche,
      strictMode: true,
    });

    await allerALaFiche(user);
    await user.click(bouton("Imprimer"));

    expect(boutons(envoyes)).toEqual([
      "button_exposed patient_sheet_print f1 R2",
      "button_exposed patient_sheet_download f1 R2",
      "button_clicked patient_sheet_print f1 R2",
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
      name: `${LIBELLE_DE_L_AVIS} (nouvel onglet)`,
    });

    await user.click(avis);

    expect(boutons(envoyes)).toEqual([
      "feedback_exposed - r1 R2",
      "feedback_clicked - r1 R2",
    ]);
    const [expose, clic] = envoyes.filter(({ type }) =>
      type.startsWith("feedback_"),
    );
    expect(clic?.exposure_id).toBe(expose?.exposure_id);
  });
});
