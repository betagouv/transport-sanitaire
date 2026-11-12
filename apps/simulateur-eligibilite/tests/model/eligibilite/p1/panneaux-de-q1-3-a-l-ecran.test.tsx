// Les panneaux des précisions de Q1.3 (UI-CHAMPS-CONDITIONNELS-20261110,
// TS1018-11) : chaque case qui ouvre une précision la range dans un panneau
// juste sous elle, hors de son libellé, et la liste reprend après lui. Leur
// aspect, en clair, en sombre et sur mobile, se compare à l'écran à l'aperçu
// de l'éditeur.

import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  afficherLeQuestionnaire,
  avecUnProfessionnel,
  choisir,
  cocher,
  page,
} from "../formulaire-du-modele";

describe("les panneaux de Q1.3", () => {
  it.each([
    [ALD, Q13B],
    [DIALYSE, Q13A],
    [TIERS, DATE],
  ])("%s ouvre son panneau juste sous elle", async (cas, precision) => {
    const user = await surQ13();
    await cocher(user, cas);
    await precisionDe(precision);

    expect(panneauSous(cas)).not.toBeNull();
    expect(panneauSous(cas)?.textContent).toMatch(precision);
    expect(panneaux()).toHaveLength(1);
  });

  it("les trois cochées : un panneau chacune, et la liste reprend après", async () => {
    const user = await surQ13();
    for (const cas of [ALD, DIALYSE, TIERS]) await cocher(user, cas);
    await precisionDe(DATE);

    expect(panneaux()).toHaveLength(3);
    for (const cas of [ALD, DIALYSE, TIERS])
      expect(panneauSous(cas)).not.toBeNull();
    expect(
      panneauSous(ALD)?.nextElementSibling?.classList.contains(
        "fr-checkbox-group",
      ),
    ).toBe(true);
  });

  it("répondre dans le panneau ne décoche pas la case", async () => {
    const user = await surQ13();
    await cocher(user, ALD);
    await page(Q13B);

    await choisir(user, LIEN_DIRECT);

    expect(screen.getByRole("checkbox", { name: ALD })).toBeChecked();
    expect(panneauSous(ALD)).not.toBeNull();
  });

  it("la case décochée ferme le panneau : ni fond, ni champ", async () => {
    const user = await surQ13();
    await cocher(user, ALD);
    await page(Q13B);

    await cocher(user, ALD);

    expect(panneaux()).toHaveLength(0);
    expect(screen.queryByRole("group", { name: Q13B })).toBeNull();
  });
});

// ---- implémentation ----

const ALD = /^Le patient est en Affection Longue Durée/;
const DIALYSE = /^Ce déplacement concerne une séance de dialyse/;
const TIERS =
  /^Ce transport est en rapport avec un accident causé par un tiers/;
const Q13A = /^La séance prévue est-elle une séance d’hémodialyse/;
const Q13B = /^Précisez le lien entre le transport et l'Affection/;
const DATE = /^À quelle date cet accident a-t-il eu lieu/;
const LIEN_DIRECT = /^Soin ou examen directement lié/;

// Une précision : un groupe de choix, ou le champ de la date.
const precisionDe = (precision: RegExp) =>
  precision === DATE ? screen.findByLabelText(DATE) : page(precision);

const surQ13 = async () => {
  const user = afficherLeQuestionnaire();
  await avecUnProfessionnel(user, [/^Nécessite un brancardage/]);
  return user;
};

// La carte d'une case : son groupe, hors duquel vient le panneau.
const carteDe = (cas: RegExp) =>
  screen.getByRole("checkbox", { name: cas }).closest(".fr-checkbox-group");

const panneauSous = (cas: RegExp) => {
  const suivant = carteDe(cas)?.nextElementSibling;
  return suivant?.classList.contains("socle-conditional-panel")
    ? suivant
    : null;
};

const panneaux = () =>
  Array.from(document.querySelectorAll(".socle-conditional-panel"));
