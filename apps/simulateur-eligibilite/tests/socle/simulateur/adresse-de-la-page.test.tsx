import { cleanup, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { constant, givenOf, page, questionsOf } from "../../../core/socle";
import { initAnalytics } from "../../../front/socle/analytics";
import type { Model } from "../../../front/socle/model";
import { modeleDeTest } from "../modele-de-test";
import {
  ACCOMPAGNEMENTS,
  BOISSON,
  bouton,
  ouvrirLeSimulateur,
  question,
  radio,
} from "./questionnaire";

// L'adresse de la page suit la position de la simulation (ADR-30) : un rang,
// rien de ses réponses. Le bouton Retour du navigateur y revient, une adresse
// refusée revient à la page ouverte, et un rechargement recommence. Matomo n'en
// voit rien : ni page vue, ni évènement de plus. Testé par la vraie
// application, sur le questionnaire factice.

const lues = (commande: string) =>
  (window._paq as unknown[][]).filter(([nom]) => nom === commande);
const evenements = () =>
  lues("trackEvent").map(([, , nom, , valeur]) =>
    valeur === undefined ? nom : [nom, valeur],
  );
const adresse = () => window.location.hash;

beforeEach(() => {
  window._paq = [];
  initAnalytics({ enabled: true, url: "https://matomo.test/", siteId: "275" });
});

// Le thé choisi : la page des accompagnements, au rang 2.
async function choisirUnThe() {
  const user = await ouvrirLeSimulateur();
  await question(BOISSON);
  await user.click(radio("Un thé"));
  await question(ACCOMPAGNEMENTS);
  return user;
}

describe("l'adresse de la page", () => {
  it("donne le rang de la page ouverte", async () => {
    const user = await ouvrirLeSimulateur();
    await question(BOISSON);
    expect(adresse()).toBe("#/etape/1");

    await user.click(radio("Un thé"));

    await question(ACCOMPAGNEMENTS);
    expect(adresse()).toBe("#/etape/2");
  });

  it("revient en arrière, puis en avant, par les boutons du navigateur", async () => {
    await choisirUnThe();

    window.history.back();
    expect(await question(BOISSON)).toBeInTheDocument();
    expect(radio("Un thé")).toBeChecked();

    window.history.forward();
    expect(await question(ACCOMPAGNEMENTS)).toBeInTheDocument();
  });

  it("refusée, revient à la page ouverte", async () => {
    await choisirUnThe();

    window.location.hash = "#/etape/9";

    await waitFor(() => expect(adresse()).toBe("#/etape/2"));
    expect(screen.getByRole("group", ACCOMPAGNEMENTS)).toBeInTheDocument();
  });

  it("après un rechargement, recommence au début", async () => {
    await choisirUnThe();
    cleanup();

    await ouvrirLeSimulateur();

    expect(await question(BOISSON)).toBeInTheDocument();
    expect(radio("Un thé")).not.toBeChecked();
    expect(adresse()).toBe("#/etape/1");
  });

  it("n'envoie à Matomo ni page vue, ni évènement", async () => {
    await choisirUnThe();
    const vues = lues("trackPageView").length;
    const envoyes = evenements().length;

    window.history.back();
    await question(BOISSON);

    expect(lues("trackPageView")).toHaveLength(vues);
    expect(evenements()).toHaveLength(envoyes);
  });
});

describe("une correction", () => {
  it("n'est pas une étape de plus pour Matomo", async () => {
    const user = await ouvrirLeSimulateur({ modele: AVEC_UNE_ALERTE });
    await user.click(await screen.findByLabelText("À domicile"));
    await user.click(await screen.findByLabelText("En espèces"));

    await user.click(screen.getByRole("link", { name: "Revoir la livraison" }));
    expect(adresse()).toBe("#/etape/1?retour=2");
    await user.click(await screen.findByLabelText("En point relais"));
    await user.click(bouton("Suivant"));
    await user.click(await screen.findByRole("button", { name: "Suivant" }));

    expect(await screen.findByLabelText("Une note ?")).toBeInTheDocument();
    expect(evenements()).toEqual([
      "simulation_start",
      ["simulation_step", 2],
      ["simulation_step", 3],
    ]);
  });
});

// ---- implémentation ----

type Questions = {
  livraison: "domicile" | "relais";
  mode: "carte" | "especes";
  note: string;
};

const nouvelle = questionsOf<Questions>();
const given = givenOf<Questions>();

// Le modèle de test, sur un questionnaire dont la deuxième page peut
// contredire la première.
const AVEC_UNE_ALERTE: Model = {
  ...modeleDeTest,
  core: {
    ...modeleDeTest.core,
    questionnaire: [
      {
        id: "commande",
        title: "Questionnaire factice",
        pages: [
          page(
            "livraison",
            nouvelle
              .singleChoice("livraison", "Comment livrer ?")
              .options({ domicile: "À domicile", relais: "En point relais" }),
          ),
          page(
            "mode",
            nouvelle
              .singleChoice("mode", "Comment payer ?")
              .options({ carte: "Par carte", especes: "En espèces" })
              .inconsistentWhen(
                given
                  .question("livraison")
                  .answer()
                  .is("domicile")
                  .and(given.question("mode").answer().is("especes")),
                "Les espèces ne se paient pas à la livraison.",
                {
                  revisit: constant([
                    { label: "Revoir la livraison", question: "livraison" },
                  ]),
                },
              ),
          ),
          page("note", nouvelle.text("note", "Une note ?")),
        ],
      },
    ],
  } as Model["core"],
};
