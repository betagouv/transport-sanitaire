// Le modèle de l'éditeur déroulé dans le formulaire du socle, comme à l'écran.
//
// Les autres tests du modèle appellent le moteur du questionnaire sans écran,
// et ceux du socle éprouvent chaque mécanisme sur des pages écrites pour eux.
// Ceux-ci vérifient l'assemblage : les conditions du modèle, lues par le
// formulaire, avec son brouillon, son avance automatique et ses blocages. Ils
// sont peu nombreux à dessein : un parcours par mécanisme de P2. La permission
// a les siens (`parcours-de-la-permission.test.tsx`).

import { screen, waitFor } from "@testing-library/react";
import type userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  afficherLeQuestionnaire,
  avecUnProfessionnel,
  choisir,
  choisirDans,
  cocher,
  jusquAQ21,
  page,
  Q21,
  suivant,
} from "./formulaire-du-modele";

const Q21F = /^Les séances sélectionnées motivent-elles/;
const Q21G = /^S’agit-il d’une entrée dans un établissement/;
const Q221 = /^L’une de ces situations concerne-t-elle le transport/;
const HOSPITALISE = /^Hospitalisation en cours/;
const Q221B = /^L’un de ces soins ou rendez-vous/;
const Q231 = /^Quelle distance sépare les lieux de départ/;
const Q25 = /^Quel type de déplacement le patient doit-il effectuer/;
const Q26A = /^Le transfert est-il définitif ou provisoire/;
const Q26 = /^Quelle situation précise et quelles exceptions/;
const Q210 = /^Quelle convocation, quel avis d’audience/;
const Q210A = /^Le fournisseur est-il agréé/;
const Q210B = /^Sélectionnez l’appareillage concerné/;

// « Non » aux deux blocs des situations particulières, une page chacun.
async function sansSituation(user: ReturnType<typeof userEvent.setup>) {
  await cocher(user, /^Non, aucune de ces situations/);
  await suivant(user);
  await page(Q221B);
  await cocher(user, /^Non, aucun\./);
  await suivant(user);
}

describe("le modèle de l'éditeur, déroulé dans le formulaire", () => {
  it("révèle Q2.1.g sur la page de Q2.1, puis attend « Suivant »", async () => {
    const user = await jusquAQ21();

    await choisir(user, /^Entrée ou sortie d’hospitalisation/);
    expect(await page(Q21G)).toBeInTheDocument();
    expect(screen.getByRole("group", { name: Q21 })).toBeInTheDocument();

    await choisir(user, /^Une entrée dans un établissement de santé/);
    // Q2.1.g révélée, la page attend « Suivant » (D-240).
    await suivant(user);
    expect(await page(Q221)).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: HOSPITALISE })).toBeNull();
  });

  it("saute Q2.1 quand le brancard prouve le motif", async () => {
    const user = afficherLeQuestionnaire();
    await avecUnProfessionnel(user, [/^Nécessite un brancardage/]);
    await cocher(user, /^Aucune de ces situations/);
    await suivant(user);

    expect(await page(Q221)).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: Q21 })).toBeNull();
  });

  it("pose les soins sur une seconde page, même après « Non » au premier bloc", async () => {
    const user = afficherLeQuestionnaire();
    await avecUnProfessionnel(user, [/^Nécessite un brancardage/]);
    await cocher(user, /^Aucune de ces situations/);
    await suivant(user);
    await page(Q221);

    await cocher(user, /^Non, aucune de ces situations/);
    await suivant(user);
    expect(await page(Q221B)).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: Q231 })).toBeNull();

    await cocher(user, /^Accident du travail/);
    await suivant(user);
    expect(await page(Q231)).toBeInTheDocument();
  });

  it("bloque sur Q2.1.f quand les séances ne sont pas le même déplacement", async () => {
    const user = afficherLeQuestionnaire();
    await avecUnProfessionnel(user, [
      /^Ne peut pas se déplacer de manière autonome/,
    ]);
    await cocher(user, /séance de chimiothérapie/);
    await cocher(user, /séance de radiothérapie/);
    await suivant(user);
    await page(Q21F);
    expect(screen.queryByRole("group", { name: Q21 })).toBeNull();

    await choisir(user, /^Non, il s’agit de déplacements/);
    expect(
      await screen.findByText(/une simulation par déplacement/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: Q231 })).toBeNull();

    await choisir(user, /^Oui, il s’agit du même déplacement/);
    expect(await page(Q221)).toBeInTheDocument();
  });

  it("pose le type du transfert, puis ses exceptions, après le trajet", async () => {
    const user = await jusquAQ21();
    await choisir(user, /^Transfert entre établissements/);
    await page(Q221);
    await sansSituation(user);
    await page(Q231);
    await choisir(user, /^50 km ou moins/);
    await suivant(user);

    await page(Q25);
    await choisir(user, /^Un transfert entre établissements/);
    expect(await page(Q26A)).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: Q26 })).toBeNull();

    await choisir(user, /^Définitif/);
    expect(await page(Q26)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Suivant" })).toBeDisabled();
    expect(
      screen.getByRole("checkbox", { name: /^Admission dans un nouvel/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("checkbox", { name: /^Transfert <48/ }),
    ).toBeNull();

    await cocher(user, /^Aucune de ces exceptions/);
    expect(
      await screen.findByRole("button", { name: "Voir le résultat" }),
    ).toBeEnabled();
  });
  it("pose la convocation après le trajet, et révèle l'agrément et l'appareillage sous l'option 6", async () => {
    const terminer = vi.fn();
    const user = await jusquAQ21(terminer);
    await choisir(user, /^Autre motif de déplacement/);
    await page(Q221);
    // Seule Q2.2.1.b dit la convocation.
    await cocher(user, /^Non, aucune de ces situations/);
    await suivant(user);
    await page(Q221B);
    await cocher(user, /^Convocation de contrôle/);
    await suivant(user);
    await page(Q231);
    await choisir(user, /^50 km ou moins/);
    await suivant(user);

    await page(Q210);
    expect(screen.queryByRole("group", { name: Q210A })).toBeNull();
    await choisir(user, /^Déplacement chez un fournisseur d’appareillage/);
    expect(await page(Q210A)).toBeInTheDocument();
    expect(screen.getByRole("group", { name: Q210B })).toBeInTheDocument();

    await choisirDans(user, Q210A, /^Oui\.$/);
    await choisirDans(user, Q210B, /^Podo-orthèse\.$/);
    // Ses sous-champs révélés font de la page une page composée (D-240).
    expect(terminer).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Voir le résultat" }));
    await waitFor(() => expect(terminer).toHaveBeenCalledOnce());
  });
});
