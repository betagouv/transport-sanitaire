// L'action qui complète le premier résultat est celle que le modèle nomme,
// pour la préconisation affichée. Un libellé `null` retire son bouton. « Compléter »
// n'est posé que si la partie suivante a de quoi s'ouvrir. Les secondaires
// sont à gauche, la complétion poussée à droite. Le titre d'un résultat avec
// feuille et complétion est vert. Les modèles ci-dessous sont écrits pour ces
// tests, sur le modèle factice.

import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { constant } from "../../../core/socle";
import type { FirstResult, Model } from "../../../front/socle/model";
import { modeleDeTest } from "../modele-de-test";
import {
  allerAuResultat,
  bouton,
  ouvrirLeSimulateur,
  QUANTITE,
  qui,
  repondreJusquAuResultat,
  sansBouton,
} from "./questionnaire";

const COMPLETER = "Compléter la commande";

const avec = (changement: {
  core?: Partial<Model["core"]>;
  second?: Partial<Model["cerfa"]>;
}): Model => ({
  ...modeleDeTest,
  core: { ...modeleDeTest.core, ...changement.core },
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

  it("rangent les secondaires d'abord, puis la complétion, poussée à droite", async () => {
    const user = await ouvrirLeSimulateur();
    await allerAuResultat(user);

    const rangee = bouton(COMPLETER).parentElement;
    expect(
      [...(rangee?.children ?? [])].map((enfant) => enfant.textContent),
    ).toEqual(["Précédent", "Faire une nouvelle simulation", COMPLETER]);
    expect(bouton(COMPLETER)).toHaveClass("socle-page-actions__completion");
  });

  it("retirent l'action qui complète quand son libellé est `null`, et le stepper s'arrête", async () => {
    const modele = avec({ second: { startLabel: constant(null) } });
    const user = await ouvrirLeSimulateur({ modele });
    await allerAuResultat(user);

    expect(sansBouton(COMPLETER)).toBe(true);
    expect(bouton("Faire une nouvelle simulation")).toBeInTheDocument();
    expect(etape(1, 1)).toBeInTheDocument();
  });

  it("ne verrouillent pas vers une partie sans page ni cerfa", async () => {
    const modele = avec({
      core: { complement: { ...modeleDeTest.core.complement, pages: [] } },
      second: { form: constant(null) },
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
  const { preconisation } = modeleDeTest.core;
  const requalifiant = avec({
    core: {
      preconisation: {
        ...preconisation,
        faits: (answers, validated) => ({
          ...preconisation.faits(answers, validated),
          ...(answers.question("quantite").hasAnswer() && {
            boisson: "chocolat",
          }),
        }),
      },
    },
  });

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

describe("la couleur du titre du premier résultat", () => {
  const FEUILLE = { title: "Votre commande", body: "Un contenu" };

  it("est verte avec une feuille et une complétion", async () => {
    expect(await titreDe({ title: "Le résultat", sheet: FEUILLE })).toHaveClass(
      VERT,
    );
  });

  it("reste noire avec une feuille, sans complétion", async () => {
    const resultat = { title: "Le résultat", sheet: FEUILLE, terminal: true };
    expect(await titreDe(resultat)).not.toHaveClass(VERT);
  });

  it("reste noire sans feuille, même avec une complétion", async () => {
    expect(await titreDe({ title: "Le résultat" })).not.toHaveClass(VERT);
  });
});

// ---- implémentation ----

const VERT = "socle-result-title--success";

// Le titre du premier résultat, une fois posé.
async function titreDe(resultat: FirstResult) {
  const user = await ouvrirLeSimulateur({ modele: qui(async () => resultat) });
  await repondreJusquAuResultat(user);
  return screen.findByRole("heading", { level: 1, name: resultat.title });
}
