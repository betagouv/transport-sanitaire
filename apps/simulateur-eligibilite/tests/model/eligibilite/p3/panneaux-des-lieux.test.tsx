// Les panneaux de P3 à l'écran (`12_INVENTAIRE_PANNEAUX_10_2_1.md`) : le nombre
// de trajets sous le sens choisi, les champs d'un lieu sous sa catégorie,
// l'adresse hors du panneau. Une catégorie que P2 fixe ne se choisit pas : ses
// champs se posent à leur rang, sans choix coché.

import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { model } from "../../../../core/models/eligibilite";
import type { Answers } from "../../../../core/socle/questionnaire-engine";
import { afficher } from "../../../socle/questionnaire/afficher";
import { declencheurDe } from "../../../socle/questionnaire/panneaux";
import { ciblesValant } from "../r2/traces-du-prescripteur";

const LIEU_DE_DEPART = { name: "Quel est le lieu de départ ?" };
const NOM_DE_LA_STRUCTURE = { name: /^Nom de la structure/ };
const SERVICE = { name: /^Service concerné/ };
const NATURE = { name: /^Nature du lieu/ };
const NOM_DU_LIEU = { name: /^Nom du lieu/ };

describe("le nombre de trajets", () => {
  it("s'insère sous le sens choisi", async () => {
    const { user } = afficherP3();

    await user.click(screen.getByLabelText("Aller simple"));

    expect(declencheurDe(screen.getByRole("spinbutton"))).toBe(
      screen.getByLabelText("Aller simple"),
    );
  });
});

describe("les champs du lieu de départ", () => {
  it("d'une structure de soins, son nom et son service sous la catégorie", async () => {
    const user = await jusquAuDepart();

    await user.selectOptions(liste(), "2_STRUCTURE_DE_SOINS");

    expect(
      declencheurDe(screen.getByRole("textbox", NOM_DE_LA_STRUCTURE)),
    ).toBe(liste());
    expect(declencheurDe(screen.getByRole("textbox", SERVICE))).toBe(liste());
  });

  it("d'un autre lieu, sa nature et son nom sous la catégorie, sans service", async () => {
    const user = await jusquAuDepart();

    await user.selectOptions(liste(), "2_STRUCTURE_DE_SOINS");
    await user.selectOptions(liste(), "3_AUTRE_LIEU");

    expect(declencheurDe(screen.getByRole("textbox", NATURE))).toBe(liste());
    expect(declencheurDe(screen.getByRole("textbox", NOM_DU_LIEU))).toBe(
      liste(),
    );
    expect(screen.queryByRole("textbox", SERVICE)).toBeNull();
  });

  it("garde l'adresse hors du panneau", async () => {
    const user = await jusquAuDepart();

    await user.selectOptions(liste(), "2_STRUCTURE_DE_SOINS");

    expect(
      declencheurDe(screen.getByRole("textbox", { name: "Commune" })),
    ).toBe(undefined);
  });

  it("fixé par P2, se pose à son rang, sans choix coché", async () => {
    await jusquAuDepart({
      "Q2.5": "1_TRANSFERT",
      "Q2.6": ["8_RADIOTHERAPIE"],
    });

    const nom = await screen.findByRole("textbox", NOM_DE_LA_STRUCTURE);
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(declencheurDe(nom)).toBeUndefined();
    expect(document.querySelectorAll("input:checked")).toHaveLength(0);
  });
});

// ---- implémentation ----

const liste = () => screen.getByRole("combobox", LIEU_DE_DEPART);

// P3 après le verrou, sur ces réponses de P2, pour un document de transport.
function afficherP3(p2: Answers = {}) {
  return afficher(model.complement.pages, {
    lockedAnswers: p2,
    cibles: ciblesValant({ cible_support_id: "S3138g" }),
  });
}

// Un aller simple, puis la page du départ.
async function jusquAuDepart(p2?: Answers) {
  const { user } = afficherP3(p2);
  await user.click(screen.getByLabelText("Aller simple"));
  await user.type(screen.getByRole("spinbutton"), "1");
  await user.click(screen.getByRole("button", { name: "Suivant" }));
  await screen.findByRole("group", { name: /^Adresse du lieu de départ/ });
  return user;
}
