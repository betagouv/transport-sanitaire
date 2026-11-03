import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Simulation } from "../../../core/socle/simulation/simulation";
import { modeleDeTest } from "../modele-de-test";
import {
  ACCOMPAGNEMENTS,
  allerAuResultat,
  BOISSON,
  bouton,
  caseACocher,
  ouvrirLeSimulateur,
  QUANTITE,
  question,
  qui,
  radio,
  repondreJusquAuResultat,
  sansBouton,
} from "./questionnaire";

// Le résultat reste ouvert tant que son action principale n'est pas choisie.
// Cette action verrouille : le complément ne repose aucune question déjà posée,
// et on ne peut plus revenir en arrière. Imprimer ou télécharger la feuille
// du premier résultat ne la choisit pas.

const saisie = () => screen.getByRole("spinbutton", QUANTITE);

describe("avant le verrou", () => {
  it("« Précédent » rouvre le questionnaire sur sa dernière page", async () => {
    const user = await ouvrirLeSimulateur();
    await allerAuResultat(user);
    expect(screen.getByText("Commande : thé, lait")).toBeInTheDocument();

    await user.click(bouton("Précédent"));

    await question(ACCOMPAGNEMENTS);
    expect(caseACocher("Du lait")).toBeChecked();
  });

  it("le résultat garde le stepper sur sa partie", async () => {
    const user = await ouvrirLeSimulateur();
    await allerAuResultat(user);

    expect(
      screen.getByRole("heading", { name: "Résultat Étape 1 sur 2" }),
    ).toBeInTheDocument();
  });

  it("sans rien à compléter, le résultat est le dernier écran", async () => {
    const user = await ouvrirLeSimulateur();
    await question(BOISSON);

    await user.click(radio("Rien"));

    expect(await screen.findByText("Commande : aucune")).toBeInTheDocument();
    expect(sansBouton("Compléter la commande")).toBe(true);
    expect(
      screen.getByRole("heading", { name: "Résultat Étape 1 sur 1" }),
    ).toBeInTheDocument();
  });

  it("une réponse corrigée change le résultat", async () => {
    const user = await ouvrirLeSimulateur();
    await allerAuResultat(user);
    await user.click(bouton("Précédent"));

    await user.click(caseACocher("Du sucre"));
    await user.click(bouton("Voir le résultat"));

    expect(
      await screen.findByText("Commande : thé, lait et sucre"),
    ).toBeInTheDocument();
  });
});

describe("une feuille imprimée ou téléchargée", () => {
  afterEach(() => {
    Reflect.deleteProperty(window, "print");
  });

  it("laisse « Précédent » rouvrir le questionnaire sur sa dernière page", async () => {
    // Le dialogue d'impression, que happy-dom n'a pas, ouvert puis fermé.
    let impressions = 0;
    window.print = () => {
      impressions++;
      window.dispatchEvent(new Event("beforeprint"));
      window.dispatchEvent(new Event("afterprint"));
    };
    const user = await avecUneFeuille();

    await user.click(bouton("Imprimer"));
    await waitFor(() => expect(impressions).toBe(1));
    // Le navigateur de test ne met pas en page : le PDF de la feuille y échoue.
    await user.click(bouton("Télécharger"));
    await screen.findByText(
      "Le téléchargement a échoué. Réessayez ou utilisez « Imprimer ».",
    );
    await user.click(bouton("Précédent"));

    await question(ACCOMPAGNEMENTS);
    expect(caseACocher("Du lait")).toBeChecked();
  });
});

describe("après le verrou", () => {
  it("le complément s'ouvre sans « Précédent »", async () => {
    const user = await ouvrirLeSimulateur();
    await allerAuResultat(user);

    await user.click(bouton("Compléter la commande"));

    expect(saisie()).toBeInTheDocument();
    expect(sansBouton("Précédent")).toBe(true);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Compléter la commande Étape 2 sur 2",
      }),
    ).toBeInTheDocument();
  });

  it("une saisie refusée retient la page, et dit pourquoi", async () => {
    const user = await ouvrirLeSimulateur();
    await allerAuResultat(user);
    await user.click(bouton("Compléter la commande"));
    expect(bouton("Suivant")).toBeDisabled();

    await user.type(saisie(), "0");

    expect(
      screen.getByText("Indiquez un nombre d’au moins 1."),
    ).toBeInTheDocument();
    expect(bouton("Suivant")).toBeDisabled();
  });

  it("« Précédent » revient au complément, jamais en deçà", async () => {
    const user = await ouvrirLeSimulateur();
    await allerAuResultat(user);
    await user.click(bouton("Compléter la commande"));
    await user.type(saisie(), "2");
    await user.click(bouton("Terminer"));
    expect(
      await screen.findByText("Commande : thé, lait, 2 tasses"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: /Étape 2 sur 2$/ }),
    ).toBeInTheDocument();

    await user.click(bouton("Précédent"));

    expect(saisie()).toHaveValue(2);
    expect(sansBouton("Précédent")).toBe(true);
  });

  it("une nouvelle simulation repart d'un parcours vierge", async () => {
    const user = await ouvrirLeSimulateur();
    await allerAuResultat(user);

    await user.click(bouton("Faire une nouvelle simulation"));

    await question(BOISSON);
    expect(radio("Un thé")).not.toBeChecked();
  });
});

describe("ce que le verrou fige", () => {
  it("une réponse laissée sans objet par un retour en arrière ne passe pas le verrou", () => {
    const locked = Simulation.of(modeleDeTest.core, {
      boisson: "rien",
      accompagnements: ["lait"],
    }).lock();

    expect(locked.answers).toEqual({ boisson: "rien" });
  });
});

// ---- implémentation ----

// Le premier résultat, avec une feuille à remettre.
async function avecUneFeuille() {
  const user = await ouvrirLeSimulateur({
    modele: qui(async () => ({
      title: "Le résultat",
      sheet: { title: "Votre commande", body: "Un contenu" },
    })),
  });
  await repondreJusquAuResultat(user);
  await screen.findByRole("heading", { level: 1, name: "Le résultat" });
  return user;
}
