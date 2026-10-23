// Le choix du modèle : quand l'app a plusieurs modèles, les developer tools
// proposent d'en changer, chacun sous le nom que l'app lui donne. Un modèle ne
// se charge qu'à son ouverture, et le rattachement reste.

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { page, questionsOf } from "../../../core/socle";
import { App } from "../../../front/socle/app/App";
import type { Model } from "../../../front/socle/model";
import { rangerRattachement } from "../../../front/socle/rattachement/session";
import { snapshotReferentiel } from "../../../shared/referentiel";
import { modeleDeTest } from "../modele-de-test";
import { seRattacher, seRattacherProduit } from "../se-rattacher";

type User = ReturnType<typeof userEvent.setup>;

const ENCADRE = { name: "Developer tools" };
const BOISSON = { name: /^quelle boisson souhaitez-vous/i };
const DESSERT = { name: /^quel dessert souhaitez-vous/i };
const FROMAGE = { name: /^quel fromage souhaitez-vous/i };
const CARTE_DES_BOISSONS = "Carte des boissons";
const CARTE_DES_DESSERTS = "Carte des desserts";
const CARTE_DES_FROMAGES = "Carte des fromages";

// Les deux autres modèles ne posent qu'une question, celle de leur mets.
type Questions = { dessert: "maison"; fromage: "maison" };

const OPTIONS = {
  dessert: { maison: "Celui de la maison" },
  fromage: { maison: "Celui de la maison" },
} as const;

const question = questionsOf<Questions>({ options: OPTIONS });

const desserts = modeleQuiDemande("dessert");
const fromages = modeleQuiDemande("fromage");

// Monte l'app avec trois modèles et compte les chargements du deuxième.
function monter(source: () => Model | Promise<Model> = () => desserts) {
  const chargements = { nombre: 0 };
  const user = userEvent.setup();
  const charger = () => {
    chargements.nombre++;
    return source();
  };
  render(
    <App
      models={[
        { label: CARTE_DES_BOISSONS, load: () => modeleDeTest },
        { label: CARTE_DES_DESSERTS, load: charger },
        { label: CARTE_DES_FROMAGES, load: () => fromages },
      ]}
      referentiel={snapshotReferentiel}
      declarer={() => {}}
    />,
  );
  return { user, chargements };
}

const choix = (name: string, pressed = false) =>
  screen.findByRole("button", { name, pressed });

const ouvrirLesDesserts = async (user: User) =>
  user.click(await choix(CARTE_DES_DESSERTS));

beforeEach(() => rangerRattachement(null));

describe("le choix du modèle", () => {
  it("n'est pas proposé à un service ordinaire", async () => {
    const { user } = monter();

    await seRattacher(user);

    await screen.findByRole("group", BOISSON);
    expect(
      screen.queryByRole("button", { name: CARTE_DES_DESSERTS }),
    ).toBeNull();
  });

  it("ouvre le premier modèle, sans charger les autres d'avance", async () => {
    const { user, chargements } = monter();

    await seRattacherProduit(user);

    expect(await screen.findByRole("group", BOISSON)).toBeInTheDocument();
    expect(chargements.nombre).toBe(0);
  });

  it("propose chaque modèle sous son nom au service n° 4", async () => {
    const { user } = monter();

    await seRattacherProduit(user);

    const encadre = await screen.findByRole("region", ENCADRE);
    const noms = (pressed: boolean) =>
      within(encadre)
        .getAllByRole("button", { pressed })
        .map((bouton) => bouton.textContent);
    expect(noms(true)).toEqual([CARTE_DES_BOISSONS]);
    expect(noms(false)).toEqual([CARTE_DES_DESSERTS, CARTE_DES_FROMAGES]);
  });

  it("remplace le modèle ouvert, sans redemander le rattachement", async () => {
    const { user, chargements } = monter();
    await seRattacherProduit(user);

    await ouvrirLesDesserts(user);

    expect(await screen.findByRole("group", DESSERT)).toBeInTheDocument();
    expect(screen.queryByRole("group", BOISSON)).toBeNull();
    expect(await choix(CARTE_DES_DESSERTS, true)).toBeInTheDocument();
    expect(await choix(CARTE_DES_BOISSONS)).toBeInTheDocument();
    expect(chargements.nombre).toBe(1);
  });

  it("attend le chargement du modèle choisi, puis l'ouvre", async () => {
    let arriver: (model: Model) => void = () => {};
    const { user } = monter(
      () =>
        new Promise<Model>((tenir) => {
          arriver = tenir;
        }),
    );
    await seRattacherProduit(user);

    await ouvrirLesDesserts(user);
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Chargement du simulateur…",
    );
    expect(screen.queryByRole("group", BOISSON)).toBeNull();

    arriver(desserts);
    expect(await screen.findByRole("group", DESSERT)).toBeInTheDocument();
  });

  it("passe d'un modèle à l'autre, premier compris", async () => {
    const { user } = monter();
    await seRattacherProduit(user);
    await ouvrirLesDesserts(user);

    await user.click(await choix(CARTE_DES_FROMAGES));
    expect(await screen.findByRole("group", FROMAGE)).toBeInTheDocument();

    await user.click(await choix(CARTE_DES_BOISSONS));
    expect(await screen.findByRole("group", BOISSON)).toBeInTheDocument();
  });

  it("repart d'une simulation vierge à chaque changement", async () => {
    const { user } = monter();
    await seRattacherProduit(user);
    await user.click(await screen.findByRole("radio", { name: "Un thé" }));
    await screen.findByRole("group", { name: /^avec quoi/i });

    await ouvrirLesDesserts(user);
    await user.click(await choix(CARTE_DES_BOISSONS));

    await screen.findByRole("group", BOISSON);
    expect(screen.getByRole("radio", { name: "Un thé" })).not.toBeChecked();
  });

  it("garde la simulation quand on choisit le modèle déjà ouvert", async () => {
    const { user } = monter();
    await seRattacherProduit(user);
    await user.click(await screen.findByRole("radio", { name: "Un thé" }));
    await screen.findByRole("group", { name: /^avec quoi/i });

    await user.click(await choix(CARTE_DES_BOISSONS, true));

    expect(screen.getByRole("group", { name: /^avec quoi/i })).toBeVisible();
  });
});

// ---- implémentation ----

// Un autre modèle, reconnaissable à sa première question.
function modeleQuiDemande(mets: keyof Questions): Model {
  return {
    ...modeleDeTest,
    core: {
      ...modeleDeTest.core,
      questionnaire: [
        {
          id: mets,
          title: mets,
          pages: [
            page(
              mets,
              question.singleChoice(mets, `Quel ${mets} souhaitez-vous ?`),
            ),
          ],
        },
      ],
    },
  };
}
