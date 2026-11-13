import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { audienceDeTest, nomsEtValeurs } from "../analytics/audience-de-test";
import { journalDeTest } from "../analytics/journal-de-test";
import {
  ACCOMPAGNEMENTS,
  allerAuResultat,
  bouton,
  ouvrirLeSimulateur,
  QUANTITE,
  question,
} from "./questionnaire";

// Ce que le questionnaire compte dans la mesure d'audience : son début, ses
// étapes, sa fin.

let mesure: ReturnType<typeof audienceDeTest>;
const evenements = () => nomsEtValeurs(mesure.mesures);
const ouvrir = () => ouvrirLeSimulateur({ audience: mesure.audience });

beforeEach(() => {
  mesure = audienceDeTest();
});

describe("suivi du parcours", () => {
  it("émet le début, chaque étape franchie et la conclusion", async () => {
    const user = await ouvrir();

    await allerAuResultat(user);

    expect(evenements()).toEqual([
      "simulation_start",
      ["simulation_step", 2],
      "simulation_complete",
    ]);
  });

  it("ne réémet pas de début au retour depuis le résultat", async () => {
    const user = await ouvrir();
    await allerAuResultat(user);

    await user.click(bouton("Précédent"));
    await question(ACCOMPAGNEMENTS);

    expect(
      evenements().filter((evenement) => evenement === "simulation_start"),
    ).toHaveLength(1);
  });

  it("envoie au journal un seul début, avec l'établissement et le service", async () => {
    const { journal, envoyes } = journalDeTest();
    const user = await ouvrirLeSimulateur({ journal });
    await allerAuResultat(user);

    await user.click(bouton("Précédent"));
    await question(ACCOMPAGNEMENTS);

    expect(envoyes).toEqual([
      expect.objectContaining({
        type: "simulation_started",
        sequence: 1,
        screen: "P0",
        version: "10.1.7",
        establishment_id: "e_chu_grenoble",
        service_id: "s_grenoble_cardio",
        is_test: false,
      }),
    ]);
  });

  it("n'émet rien dans le complément", async () => {
    const user = await ouvrir();
    await allerAuResultat(user);
    const avant = evenements();

    await user.click(bouton("Compléter la commande"));
    await user.type(screen.getByRole("spinbutton", QUANTITE), "2");
    await user.click(bouton("Terminer"));

    expect(evenements()).toEqual(avant);
  });
});
