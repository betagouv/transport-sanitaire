// La page du premier résultat, que le socle compose : le stepper et ce qui
// suit, le titre, l'introduction et le corps que le modèle donne, puis les
// boutons sous le corps. Un résultat qui charge ses textes garde tout le reste.

import { act, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { FirstResult, Model } from "../../../front/socle/model";
import { modeleDeTest } from "../modele-de-test";
import {
  ACCOMPAGNEMENTS,
  allerAuResultat,
  BOISSON,
  bouton,
  caseACocher,
  ouvrirLeSimulateur,
  question,
  radio,
} from "./questionnaire";

describe("le premier résultat", () => {
  it("a pour titre celui que le modèle donne, sous le stepper du parcours", async () => {
    const user = await ouvrirLeSimulateur();
    await allerAuResultat(user);

    expect(
      screen.getByRole("heading", { name: "Résultat Étape 1 sur 2" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Votre commande" }),
    ).toBeInTheDocument();
  });

  it("annonce l'étape suivante quand un cerfa suit", async () => {
    const user = await ouvrirLeSimulateur();
    await allerAuResultat(user);

    expect(detailsDuStepper()).toBe("Étape suivante : Compléter la commande");
  });

  it("dit que l'évaluation est terminée quand rien ne suit", async () => {
    const user = await ouvrirLeSimulateur();
    await question(BOISSON);
    await user.click(radio("Rien"));

    await screen.findByText("Commande : aucune");
    expect(detailsDuStepper()).toBe("Évaluation terminée.");
  });

  it("place les boutons sous le corps", async () => {
    const user = await ouvrirLeSimulateur();
    await allerAuResultat(user);

    const corps = screen.getByText("Commande : thé, lait");
    for (const libelle of ["Précédent", "Compléter la commande"]) {
      expect(avant(corps, bouton(libelle))).toBe(true);
    }
  });

  it("n'imprime ni les boutons ni le stepper", async () => {
    const user = await ouvrirLeSimulateur();
    await allerAuResultat(user);

    expect(pasImprime(screen.getByText("Commande : thé, lait"))).toBe(false);
    expect(pasImprime(bouton("Précédent"))).toBe(true);
    expect(pasImprime(bouton("Compléter la commande"))).toBe(true);
    expect(
      pasImprime(screen.getByRole("heading", { name: /Étape 1 sur 2/ })),
    ).toBe(true);
  });
});

describe("un résultat qui charge ses textes", () => {
  it("garde le stepper et les boutons, puis donne son titre et son corps", async () => {
    let charger: (result: FirstResult) => void = () => {};
    const chargement = new Promise<FirstResult>((resolve) => {
      charger = resolve;
    });
    const user = await ouvrirLeSimulateur({ modele: qui(() => chargement) });
    await repondreJusquAuResultat(user);

    expect(await screen.findByText("Chargement du résultat…")).toBeVisible();
    expect(bouton("Précédent")).toBeInTheDocument();
    expect(detailsDuStepper()).toBe("Étape suivante : Compléter la commande");

    await act(async () =>
      charger({
        title: "Textes chargés",
        intro: "Une intro",
        body: "Un corps",
      }),
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Textes chargés" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Une intro")).toBeInTheDocument();
    expect(screen.getByText("Un corps")).toBeInTheDocument();
  });
});

// ---- implémentation ----

type User = Awaited<ReturnType<typeof ouvrirLeSimulateur>>;

// Le modèle de test, dont le premier résultat est celui donné.
function qui(result: () => Promise<FirstResult>): Model {
  return {
    ...modeleDeTest,
    transportAndEligibility: {
      ...modeleDeTest.transportAndEligibility,
      result,
    },
  };
}

// Le chemin d'`allerAuResultat`, sans attendre le titre : il charge.
async function repondreJusquAuResultat(user: User) {
  await question(BOISSON);
  await user.click(radio("Un thé"));
  await question(ACCOMPAGNEMENTS);
  await user.click(caseACocher("Du lait"));
  await user.click(bouton("Voir le résultat"));
}

function detailsDuStepper() {
  return document.querySelector(".fr-stepper__details")?.textContent;
}

function avant(premier: HTMLElement, second: HTMLElement) {
  return (
    (premier.compareDocumentPosition(second) &
      Node.DOCUMENT_POSITION_FOLLOWING) !==
    0
  );
}

function pasImprime(element: HTMLElement) {
  return element.closest(".fr-no-print") !== null;
}
