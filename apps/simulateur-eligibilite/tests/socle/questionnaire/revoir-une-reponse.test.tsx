import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { constant, givenOf, page, questionsOf } from "../../../core/socle";
import { afficher } from "./afficher";

// L'alerte d'une incohérence offre un lien vers chaque réponse d'avant à
// revoir (ADR-30). Le lien rouvre sa page, le focus sur sa question ; pendant
// la correction, un choix seul n'avance pas, et « Suivant » ramène à la page de
// l'alerte. Les pages sont écrites ici ; `correction.test.ts` dit où « Suivant »
// reprend.

type Questions = {
  remarque: string;
  livraison: "domicile" | "relais";
  mode: "carte" | "especes";
  debut: string;
};

const question = questionsOf<Questions>();
const given = givenOf<Questions>();

const MESSAGE = "Les espèces ne se paient pas à la livraison.";

const LIVRAISON = question
  .singleChoice("livraison", "Comment livrer ?")
  .options({ domicile: "À domicile", relais: "En point relais" });

const SUITE = [
  page(
    "mode",
    question
      .singleChoice("mode", "Comment payer ?")
      .options({ carte: "Par carte", especes: "En espèces" })
      .inconsistentWhen(
        given
          .question("livraison")
          .answer()
          .is("domicile")
          .and(given.question("mode").answer().is("especes")),
        MESSAGE,
        {
          revisit: constant([
            { label: "Revoir la livraison", question: "livraison" },
          ]),
        },
      ),
  ),
  page("debut", question.datetime("debut", "Début du créneau")),
];

const COMMANDE = [page("livraison", LIVRAISON), ...SUITE];

// La livraison n'est plus la première question de sa page.
const AVEC_REMARQUE = [
  page(
    "livraison",
    question.text("remarque", "Une remarque ?").optional(),
    LIVRAISON,
  ),
  ...SUITE,
];

const LIVRER = { name: /^Comment livrer/ };
const PAYER = { name: /^Comment payer/ };
const lien = () => screen.getByRole("link", { name: "Revoir la livraison" });
const unInstant = () => new Promise((fini) => setTimeout(fini, 300));

// La livraison à domicile, puis les espèces : l'alerte s'affiche.
async function contredire() {
  const rendu = afficher(COMMANDE);
  await rendu.user.click(screen.getByLabelText("À domicile"));
  await rendu.user.click(await screen.findByLabelText("En espèces"));
  return rendu;
}

// Le lien suivi : la page de la livraison, rouverte pour la revoir.
async function revoirLaLivraison() {
  const rendu = await contredire();
  await rendu.user.click(lien());
  await screen.findByRole("group", LIVRER);
  return rendu;
}

describe("le lien d'une alerte", () => {
  it("est une adresse : la page de la réponse, puis celle de l'alerte", async () => {
    await contredire();

    expect(screen.getByText(MESSAGE)).toBeInTheDocument();
    expect(lien()).toHaveAttribute("href", "#/etape/1?retour=2");
  });

  it("rouvre la page de la réponse, la réponse cochée", async () => {
    await revoirLaLivraison();

    expect(screen.getByLabelText("À domicile")).toBeChecked();
  });

  it("donne le focus à la question revue, même après une autre", async () => {
    const { user } = afficher(AVEC_REMARQUE);
    await user.click(screen.getByLabelText("À domicile"));
    await user.click(screen.getByRole("button", { name: "Suivant" }));
    await user.click(await screen.findByLabelText("En espèces"));

    await user.click(lien());

    await screen.findByRole("group", LIVRER);
    expect(document.activeElement).toHaveTextContent(/^Comment livrer/);
  });
});

describe("pendant la correction", () => {
  it("un choix seul n'avance pas : « Suivant » l'attend", async () => {
    const { user } = await revoirLaLivraison();

    await user.click(screen.getByLabelText("En point relais"));
    await unInstant();

    expect(screen.getByRole("group", LIVRER)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Suivant" })).toBeEnabled();
  });

  it("« Suivant » ramène à la page de l'alerte, son brouillon retrouvé", async () => {
    const { user } = await revoirLaLivraison();

    await user.click(screen.getByLabelText("En point relais"));
    await user.click(screen.getByRole("button", { name: "Suivant" }));

    expect(await screen.findByRole("group", PAYER)).toBeInTheDocument();
    expect(screen.getByLabelText("En espèces")).toBeChecked();
    expect(screen.queryByText(MESSAGE)).toBeNull();
  });

  it("l'alerte revient si la réponse revue ne la lève pas", async () => {
    const { user } = await revoirLaLivraison();

    await user.click(screen.getByRole("button", { name: "Suivant" }));

    expect(await screen.findByText(MESSAGE)).toBeInTheDocument();
    expect(screen.getByRole("group", PAYER)).toBeInTheDocument();
  });
});
