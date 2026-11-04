// Des pages de P2 rouvertes dans le formulaire : la page composée du trajet,
// qui attend « Suivant », et les champs qu'une réponse révèle, qui le
// bloquent tant qu'ils sont vides. Ce sont les cas « Distance/ligne » et
// « Conditions obligatoires » des compléments de recette de l'éditeur
// (v10.1.4, #149).

import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { afficherLaPage, choisir, page } from "../formulaire-du-modele";
import { appareillage } from "./reponses-de-la-convocation";
import { MINEUR, PATIENT_SEUL } from "./reponses-de-la-permission";

const DISTANCE = /^Quelle distance sépare/;
const Q27A = /^L’établissement confirme-t-il/;
const Q284 = /^Cette permission a-t-elle été autorisée/;
const Q210A = /^Le fournisseur est-il agréé/;
const Q210B = /^Sélectionnez l’appareillage concerné/;

// Le bouton qui avance : « Voir le résultat » sur la dernière page posée.
const suivant = () =>
  screen.getByRole("button", { name: /^(Suivant|Voir le résultat)$/ });
const dans = (question: RegExp, reponse: RegExp) =>
  within(screen.getByRole("group", { name: question })).getByRole("radio", {
    name: reponse,
  });

describe("la page du trajet", () => {
  it("n'avance pas d'elle-même : la distance choisie, « Suivant » attend", async () => {
    const { "Q2.3.1": _, ...avantLeTrajet } = PATIENT_SEUL;
    const user = afficherLaPage("P2/trajet", avantLeTrajet);
    await page(DISTANCE);

    await choisir(user, /^50 km ou moins/);
    await new Promise((resolve) => setTimeout(resolve, 400));

    expect(screen.getByRole("group", { name: DISTANCE })).toBeInTheDocument();
    expect(suivant()).toBeEnabled();
  });
});

describe("les champs qu'une réponse révèle bloquent « Suivant »", () => {
  it("Q2.7.a, sous l'adulte à sa charge", async () => {
    const user = afficherLaPage("P2/permission", PATIENT_SEUL);
    await choisir(user, /^20 ans ou plus : transport exceptionnel/);

    expect(await page(Q27A)).toBeInTheDocument();
    expect(suivant()).toBeDisabled();
    await user.click(dans(Q27A, /^Oui/));
    expect(suivant()).toBeEnabled();
  });

  it("Q2.8.4, sur la page du mineur", async () => {
    const { "Q2.8.4": _, ...sansAutorisation } = MINEUR;
    const user = afficherLaPage("P2/permission-mineur", sansAutorisation);
    await page(Q284);

    expect(suivant()).toBeDisabled();
    await user.click(dans(Q284, /^Oui/));
    expect(suivant()).toBeEnabled();
  });

  it("Q2.10.a et Q2.10.b, sous l'appareillage", async () => {
    const {
      "Q2.10.a": _,
      "Q2.10.b": __,
      ...sansPrecisions
    } = appareillage("1_OUI", "2_PODO_ORTHESE");
    const user = afficherLaPage("P2/convocation", sansPrecisions);
    await page(Q210A);

    expect(suivant()).toBeDisabled();
    await user.click(dans(Q210A, /^Oui$/));
    expect(suivant()).toBeDisabled();
    await user.click(dans(Q210B, /^Podo-orthèse$/));
    expect(suivant()).toBeEnabled();
  });
});
