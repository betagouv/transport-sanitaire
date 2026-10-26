// Ce que les tests du questionnaire partagent : entrer dans le simulateur par
// l'écran de rattachement, puis répondre comme un prescripteur.

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Seed } from "../../../core/socle/seeds/seed";
import { App } from "../../../front/socle/app/App";
import type { FirstResult, Model } from "../../../front/socle/model";
import { snapshotReferentiel } from "../../../shared/referentiel";
import { modeleDeTest, seulModele } from "../modele-de-test";
import { seRattacher, seRattacherProduit } from "../se-rattacher";

type User = ReturnType<typeof userEvent.setup>;

/** Monte l'application et franchit l'écran de rattachement. `produit` : service n° 4. */
export async function ouvrirLeSimulateur(
  options: { produit?: boolean; seeds?: readonly Seed[]; modele?: Model } = {},
): Promise<User> {
  const user = userEvent.setup();
  render(
    <App
      models={seulModele(modeleAvec(options.seeds, options.modele))}
      referentiel={snapshotReferentiel}
      declarer={() => {}}
    />,
  );
  await (options.produit ? seRattacherProduit(user) : seRattacher(user));
  return user;
}

// Le modèle de test, ou celui donné, avec ces seeds à la place de son catalogue.
function modeleAvec(seeds?: readonly Seed[], modele: Model = modeleDeTest) {
  return seeds
    ? { ...modele, core: { ...modele.core, seeds: async () => seeds } }
    : modele;
}

export const BOISSON = { name: /^quelle boisson souhaitez-vous/i };
export const ACCOMPAGNEMENTS = { name: /^avec quoi/i };
export const QUANTITE = { name: /^combien de tasses/i };

/** La question affichée, attendue le temps d'un avancement automatique. */
export const question = (nom: { name: RegExp }) =>
  screen.findByRole("group", nom);

export const radio = (libelle: string) =>
  screen.getByRole("radio", { name: libelle });

export const caseACocher = (libelle: string) =>
  screen.getByRole("checkbox", { name: libelle });

export const bouton = (libelle: string) =>
  screen.getByRole("button", { name: libelle });

export const sansBouton = (libelle: string) =>
  screen.queryByRole("button", { name: libelle }) === null;

/** Répond « Un thé », puis « Du lait », et s'arrête sur le résultat. */
export async function allerAuResultat(user: User) {
  await repondreJusquAuResultat(user);
  await screen.findByRole("heading", { level: 1, name: "Votre commande" });
}

/** Va jusqu'au second résultat : une commande de deux tasses de thé au lait. */
export async function allerAuCerfa(user: User) {
  await allerAuResultat(user);
  await user.click(bouton("Compléter la commande"));
  await user.type(screen.getByRole("spinbutton", QUANTITE), "2");
  await user.click(bouton("Terminer"));
  await screen.findByText("Commande : thé, lait, 2 tasses");
}

/** Le chemin d'`allerAuResultat`, sans attendre le titre : il peut charger. */
export async function repondreJusquAuResultat(user: User) {
  await question(BOISSON);
  await user.click(radio("Un thé"));
  await question(ACCOMPAGNEMENTS);
  await user.click(caseACocher("Du lait"));
  await user.click(bouton("Voir le résultat"));
}

/** Le modèle de test, dont le premier résultat est celui donné. */
export function qui(result: () => Promise<FirstResult>): Model {
  return {
    ...modeleDeTest,
    result: { ...modeleDeTest.result, content: result },
  };
}

/** La ligne sous la barre du stepper, s'il y en a une. */
export function detailsDuStepper() {
  return document.querySelector(".fr-stepper__details")?.textContent;
}
