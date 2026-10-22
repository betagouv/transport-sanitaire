// L'action qui complète le premier résultat est celle que le modèle nomme,
// pour la préconisation affichée. Un libellé `null` retire son bouton. « Compléter »
// n'est posé que si la partie suivante a de quoi s'ouvrir. Les modèles
// ci-dessous sont écrits pour ces tests, sur le modèle factice.

import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Model } from "../../../front/socle/model";
import { modeleDeTest } from "../modele-de-test";
import {
  allerAuResultat,
  bouton,
  ouvrirLeSimulateur,
  QUANTITE,
  sansBouton,
} from "./questionnaire";

const COMPLETER = "Compléter la commande";

const avec = (changement: {
  premier?: Partial<Model["transportAndEligibility"]>;
  second?: Partial<Model["cerfa"]>;
}): Model => ({
  ...modeleDeTest,
  transportAndEligibility: {
    ...modeleDeTest.transportAndEligibility,
    ...changement.premier,
  },
  cerfa: { ...modeleDeTest.cerfa, ...changement.second },
});

const etape = (n: number, sur: number) =>
  screen.getByRole("heading", { name: `Résultat Étape ${n} sur ${sur}` });

describe("les boutons du premier résultat", () => {
  it("posent « Précédent », « Faire une nouvelle simulation » et l'action qui complète", async () => {
    const user = await ouvrirLeSimulateur();
    await allerAuResultat(user);

    for (const libelle of [
      "Précédent",
      "Faire une nouvelle simulation",
      COMPLETER,
    ]) {
      expect(bouton(libelle)).toBeInTheDocument();
    }
    expect(etape(1, 2)).toBeInTheDocument();
  });

  it("retirent l'action qui complète quand son libellé est `null`, et le stepper s'arrête", async () => {
    const modele = avec({ second: { startLabel: () => null } });
    const user = await ouvrirLeSimulateur({ modele });
    await allerAuResultat(user);

    expect(sansBouton(COMPLETER)).toBe(true);
    expect(bouton("Faire une nouvelle simulation")).toBeInTheDocument();
    expect(etape(1, 1)).toBeInTheDocument();
  });

  it("ne verrouillent pas vers une partie sans page ni cerfa", async () => {
    const modele = avec({
      second: {
        part: { ...modeleDeTest.cerfa.part, pages: [] },
        form: () => null,
      },
    });
    const user = await ouvrirLeSimulateur({ modele });
    await allerAuResultat(user);

    expect(sansBouton(COMPLETER)).toBe(true);
    expect(bouton("Faire une nouvelle simulation")).toBeInTheDocument();
    expect(etape(1, 1)).toBeInTheDocument();
  });
});

describe("le complément", () => {
  // Ce modèle lit la quantité, réponse d'après le verrou, dans ses faits :
  // s'il recalculait la préconisation, le second résultat changerait de boisson.
  const requalifiant: Model = {
    ...modeleDeTest,
    preconisation: {
      ...modeleDeTest.preconisation,
      faits: (answers, validated) => ({
        ...modeleDeTest.preconisation.faits(answers, validated),
        ...(answers.question("quantite").hasAnswer() && {
          boisson: "chocolat",
        }),
      }),
    },
  };

  it("ne requalifie pas le résultat : le second résultat garde la préconisation du verrou", async () => {
    const user = await ouvrirLeSimulateur({ modele: requalifiant });
    await allerAuResultat(user);
    await user.click(bouton(COMPLETER));

    await user.type(screen.getByRole("spinbutton", QUANTITE), "2");
    await user.click(bouton("Terminer"));

    expect(
      await screen.findByText("Commande : thé, lait, 2 tasses"),
    ).toBeInTheDocument();
  });
});
