// La page des cas particuliers de P1 (P1/3), déroulée dans le formulaire : les
// sous-champs que révèlent l'ALD (Q1.3.b) et la dialyse (Q1.3.a), sur la même
// page. Ce sont les cas « ALD statut/lien » et « Deux sous-champs » des
// compléments de recette de l'éditeur (v10.1.4, #149).

import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  afficherLeQuestionnaire,
  avecUnProfessionnel,
  choisir,
  cocher,
  page,
  suivant,
} from "./formulaire-du-modele";

const Q13A = /^La séance prévue est-elle une séance d’hémodialyse/;
const Q13B = /^Précisez le lien entre le transport et l'Affection/;
const Q221 = /^L’une de ces situations concerne-t-elle le transport/;
const ALD = /^Le patient est en Affection Longue Durée/;
const DIALYSE = /^Ce déplacement concerne une séance de dialyse/;
const LIEN_DIRECT = /^Soin ou examen directement lié/;
const HEMODIALYSE = /^Oui\.$/;

const bouton = (libelle: string) =>
  screen.getByRole("button", { name: libelle });
const optionsDe = (question: RegExp) =>
  within(screen.getByRole("group", { name: question })).getAllByRole("radio");

describe("la page des cas particuliers de P1", () => {
  it("ALD seule : Q1.3.b apparaît sans réponse, et « Suivant » l'attend", async () => {
    const user = afficherLeQuestionnaire();
    await avecUnProfessionnel(user, [/^Nécessite un brancardage/]);

    await cocher(user, ALD);

    expect(await page(Q13B)).toBeInTheDocument();
    for (const option of optionsDe(Q13B)) expect(option).not.toBeChecked();
    expect(bouton("Suivant")).toBeDisabled();

    await choisir(user, LIEN_DIRECT);
    await suivant(user);
    expect(await page(Q221)).toBeInTheDocument();
  });

  it("ALD et dialyse : « Suivant » attend les deux sous-champs", async () => {
    const user = afficherLeQuestionnaire();
    await avecUnProfessionnel(user, [/^Nécessite un brancardage/]);
    await cocher(user, ALD);
    await cocher(user, DIALYSE);

    await choisir(user, HEMODIALYSE);
    expect(bouton("Suivant")).toBeDisabled();

    await choisir(user, LIEN_DIRECT);
    expect(bouton("Suivant")).toBeEnabled();
  });

  it("ALD décochée au retour : Q1.3.b s'efface à la validation, Q1.3.a reste", async () => {
    const user = afficherLeQuestionnaire();
    await avecUnProfessionnel(user, [/^Nécessite un brancardage/]);
    await cocher(user, ALD);
    await cocher(user, DIALYSE);
    await choisir(user, HEMODIALYSE);
    await choisir(user, LIEN_DIRECT);
    await suivant(user);
    await page(Q221);
    await user.click(bouton("Précédent"));
    await page(Q13B);

    await cocher(user, ALD);
    await suivant(user);
    await page(Q221);
    await user.click(bouton("Précédent"));

    expect(await page(Q13A)).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: HEMODIALYSE })).toBeChecked();
    expect(screen.queryByRole("group", { name: Q13B })).toBeNull();
    await cocher(user, ALD);
    expect(await page(Q13B)).toBeInTheDocument();
    for (const option of optionsDe(Q13B)) expect(option).not.toBeChecked();
  });
});
