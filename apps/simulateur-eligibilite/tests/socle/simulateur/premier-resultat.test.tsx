// La page du premier résultat, que le socle compose : le stepper et ce qui
// suit, le titre, l'introduction et le corps que le modèle donne, puis les
// boutons sous le corps. Avec une feuille à remettre, les boutons passent
// au-dessus d'elle, et seule la feuille s'imprime, passée en papier le temps
// de l'impression. Un résultat qui charge ses textes garde le stepper et les
// boutons secondaires : la complétion attend qu'il soit chargé.

import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { FirstResult } from "../../../front/socle/model";
import {
  allerAuResultat,
  BOISSON,
  bouton,
  detailsDuStepper,
  ouvrirLeSimulateur,
  question,
  qui,
  radio,
  repondreJusquAuResultat,
  sansBouton,
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
  it("garde le stepper et les boutons secondaires, puis donne son titre et son corps", async () => {
    let charger: (result: FirstResult) => void = () => {};
    const chargement = new Promise<FirstResult>((resolve) => {
      charger = resolve;
    });
    const user = await ouvrirLeSimulateur({ modele: qui(() => chargement) });
    await repondreJusquAuResultat(user);

    expect(await screen.findByText("Chargement du résultat…")).toBeVisible();
    expect(bouton("Précédent")).toBeInTheDocument();
    expect(bouton("Faire une nouvelle simulation")).toBeInTheDocument();

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

  it("ne promet pas la complétion tant qu'il charge : une étape de plus, sans ligne ni bouton", async () => {
    const user = await ouvrirLeSimulateur({
      modele: qui(() => new Promise<FirstResult>(() => {})),
    });
    await repondreJusquAuResultat(user);

    expect(await screen.findByText("Chargement du résultat…")).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Résultat Étape 1 sur 2" }),
    ).toBeInTheDocument();
    expect(detailsDuStepper()).toBeUndefined();
    expect(sansBouton("Compléter la commande")).toBe(true);
  });

  it("offre la complétion une fois chargé", async () => {
    const user = await ouvrirLeSimulateur({
      modele: qui(async () => ({ title: "Textes chargés" })),
    });
    await repondreJusquAuResultat(user);

    await screen.findByRole("heading", { level: 1, name: "Textes chargés" });
    expect(detailsDuStepper()).toBe("Étape suivante : Compléter la commande");
    expect(bouton("Compléter la commande")).toBeInTheDocument();
  });
});

describe("un résultat terminal", () => {
  it("ne propose rien à compléter, même quand l'issue le permettrait", async () => {
    const user = await ouvrirLeSimulateur({
      modele: qui(async () => ({ title: "Sans conclusion", terminal: true })),
    });
    await repondreJusquAuResultat(user);

    await screen.findByRole("heading", { level: 1, name: "Sans conclusion" });
    expect(sansBouton("Compléter la commande")).toBe(true);
    expect(
      screen.getByRole("heading", { name: "Résultat Étape 1 sur 1" }),
    ).toBeInTheDocument();
    expect(detailsDuStepper()).toBe("Évaluation terminée.");
  });
});

describe("un résultat avec une feuille", () => {
  afterEach(() => {
    Reflect.deleteProperty(window, "print");
  });

  it("la pose dans sa visionneuse, sous les logos, avec son titre et sa raison", async () => {
    await avecUneFeuille();

    const feuille = within(laFeuille());
    expect(
      feuille.getByRole("img", { name: /^Ministère de la Santé/ }),
    ).toBeInTheDocument();
    expect(
      feuille.getByRole("img", { name: "L’Assurance Maladie" }),
    ).toBeInTheDocument();
    expect(
      feuille.getByRole("heading", { level: 2, name: "Votre commande" }),
    ).toBeInTheDocument();
    expect(feuille.getByText("Une raison")).toBeInTheDocument();
    expect(feuille.getByText("Un contenu")).toBeInTheDocument();
  });

  it("place les boutons entre l'introduction et la visionneuse", async () => {
    await avecUneFeuille();

    const visionneuse = screen.getByRole("region", {
      name: "Aperçu de la fiche patient",
    });
    for (const libelle of ["Précédent", "Compléter la commande"]) {
      expect(avant(screen.getByText("Une intro"), bouton(libelle))).toBe(true);
      expect(avant(bouton(libelle), visionneuse)).toBe(true);
    }
  });

  it("n'imprime que la feuille", async () => {
    await avecUneFeuille();

    expect(pasImprime(screen.getByRole("heading", { level: 1 }))).toBe(true);
    expect(pasImprime(screen.getByText("Une intro"))).toBe(true);
    expect(pasImprime(bouton("Précédent"))).toBe(true);
    expect(pasImprime(bouton("Imprimer"))).toBe(true);
    expect(pasImprime(laFeuille())).toBe(false);
  });

  it("passe en papier le temps d'une impression lancée par le navigateur", async () => {
    await avecUneFeuille();
    expect(laFeuille()).not.toHaveAttribute("data-paper");

    act(() => window.dispatchEvent(new Event("beforeprint")));
    expect(laFeuille()).toHaveAttribute("data-paper");
    // Sans moteur de mise en page, la feuille mesure zéro : une page.
    expect(laFeuille()).toHaveAttribute("data-print-layout", "one-page");

    act(() => window.dispatchEvent(new Event("afterprint")));
    expect(laFeuille()).not.toHaveAttribute("data-paper");
    expect(laFeuille()).not.toHaveAttribute("data-print-layout");
  });

  it("ouvre le dialogue d'impression sur la feuille déjà en papier", async () => {
    const ouvertures = dialogueDImpression();
    await avecUneFeuille();

    fireEvent.click(bouton("Imprimer"));

    await waitFor(() => expect(ouvertures).toEqual(["one-page"]));
    expect(laFeuille()).not.toHaveAttribute("data-paper");
  });

  it("laisse son nom à un logo qui ne se charge pas", async () => {
    await avecUneFeuille();

    fireEvent.error(screen.getByRole("img", { name: "L’Assurance Maladie" }));

    expect(
      within(laFeuille()).getByText("L’Assurance Maladie"),
    ).toBeInTheDocument();
  });
});

// ---- implémentation ----

// Le premier résultat, avec une feuille.
async function avecUneFeuille() {
  const user = await ouvrirLeSimulateur({
    modele: qui(async () => ({
      title: "Le résultat",
      intro: "Une intro",
      sheet: {
        title: "Votre commande",
        intro: "Une raison",
        body: "Un contenu",
      },
    })),
  });
  await repondreJusquAuResultat(user);
  await screen.findByRole("heading", { level: 1, name: "Le résultat" });
}

function laFeuille() {
  return screen.getByRole("article", { name: "Fiche explicative patient" });
}

function avant(premier: HTMLElement, second: HTMLElement) {
  return (
    (premier.compareDocumentPosition(second) &
      Node.DOCUMENT_POSITION_FOLLOWING) !==
    0
  );
}

// Le dialogue d'impression, que happy-dom n'a pas, ouvert comme un
// navigateur l'ouvre : `beforeprint`, puis `afterprint` à sa fermeture. Il
// note la mise en page que la feuille porte à son ouverture.
function dialogueDImpression() {
  const ouvertures: (string | undefined)[] = [];
  window.print = () => {
    window.dispatchEvent(new Event("beforeprint"));
    ouvertures.push(laFeuille().dataset.printLayout);
    window.dispatchEvent(new Event("afterprint"));
  };
  return ouvertures;
}

function pasImprime(element: HTMLElement) {
  return element.closest(".fr-no-print") !== null;
}
