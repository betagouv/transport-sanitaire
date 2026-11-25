// Le compteur de Q3.5 (T06, R04) : la précision de l'urgence se mesure dès sa
// saisie, sur le cerfa où elle s'écrira, en 8 pt sur une ligne. Le compteur dit
// « saisis / maximum caractères ». Trop longue, elle a le message de l'éditeur,
// sans bloquer la page : R3 la fera raccourcir. Blanche, elle se dit avec la
// phrase de l'éditeur.

import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { SEEDS } from "../../../../core/models/eligibilite/seeds-catalogue";
import { model } from "../../../../front/models/eligibilite";
import { RattachementSessionService } from "../../../../front/socle/rattachement";
import { ouvrirLeSimulateur } from "../../../socle/simulateur/questionnaire";
import { completerP3 } from "../completer-p3";
import { MODELE_AUX_GABARITS_DU_DISQUE } from "../modele-aux-gabarits-du-disque";

await model.core.seeds();

const Q3_5 = { name: /^Quelle précision faut-il apporter sur l’urgence/ };
const DEBORDE =
  "Raccourcissez la précision sur l’urgence pour pouvoir imprimer ou télécharger le document.";
const COMPTEUR = /^(\d+) \/ (\d+) caractères$/;

beforeEach(() => RattachementSessionService.ranger(null));

describe("la précision de l'urgence, en P3", () => {
  it("compte ce qui est saisi contre le maximum mesuré sur la DAP", async () => {
    const user = await jusquAQ35();
    const champ = screen.getByRole("textbox", Q3_5);

    await user.type(champ, "Douleur thoracique");

    const [saisis, maximum] = await compteur();
    expect(saisis).toBe(18);
    expect(maximum).toBeGreaterThan(18);
    expect(champ).not.toHaveAttribute("maxlength");
    expect(screen.queryByText(DEBORDE)).toBeNull();
  });

  it("trop longue, a le message de l'éditeur, et la page se valide quand même", async () => {
    const user = await jusquAQ35();
    const champ = screen.getByRole("textbox", Q3_5);

    await user.type(champ, "Douleur thoracique aiguë ".repeat(4));

    expect(await screen.findByText(DEBORDE)).toBeInTheDocument();
    const [saisis, maximum] = await compteur();
    expect(saisis).toBeGreaterThan(maximum);
    expect(screen.getByRole("button", { name: "Suivant" })).toBeEnabled();
  });

  it("coupée d'un retour à la ligne, ne tient pas", async () => {
    const user = await jusquAQ35();

    await user.type(screen.getByRole("textbox", Q3_5), "Douleur{Enter}aiguë");

    expect(await screen.findByText(DEBORDE)).toBeInTheDocument();
  });

  it("blanche, se dit avec la phrase de l'éditeur", async () => {
    const user = await jusquAQ35();

    await user.type(screen.getByRole("textbox", Q3_5), "   ");

    expect(await screen.findByText("Précisez l’urgence.")).toBeInTheDocument();
  });
});

// ---- implémentation ----

const SEED = SEEDS.filter(({ id }) => id === "issue-dap-urgence-attestee");

// La seed d'une urgence attestée hors Centre 15, menée par P3 jusqu'à Q3.5.
async function jusquAQ35() {
  const user = await ouvrirLeSimulateur({
    modele: MODELE_AUX_GABARITS_DU_DISQUE,
    seeds: SEED,
  });
  await user.click(await screen.findByRole("button", { name: "Seeds" }));
  await user.click(
    await screen.findByRole("button", { name: `Ouvrir : ${SEED[0]?.label}` }),
  );
  await user.click(
    await screen.findByRole("button", {
      name: "Compléter la demande d’accord préalable",
    }),
  );
  await completerP3(user, () => screen.queryByRole("textbox", Q3_5) !== null);
  return user;
}

// « saisis / maximum », sous le champ, une fois la mesure chargée.
async function compteur(): Promise<[number, number]> {
  const texte = await waitFor(() => {
    const trouve = screen.getByText(COMPTEUR).textContent ?? "";
    return trouve;
  });
  const [, saisis, maximum] = texte.match(COMPTEUR) ?? [];
  return [Number(saisis), Number(maximum)];
}
