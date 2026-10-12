// Le choix du modèle : les developer tools proposent de dérouler un autre
// modèle à la place de celui de l'app, sous le nom que l'app lui donne. Il ne
// se charge qu'à ce moment-là, et le rattachement reste.

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
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
const CARTE_DES_DESSERTS = "Carte des desserts";
const CARTE_DES_FROMAGES = "Carte des fromages";

const desserts = modeleQuiDemande("dessert");
const fromages = modeleQuiDemande("fromage");

// Monte l'app avec deux autres modèles et compte les chargements du premier.
function monter(source: () => Model | Promise<Model> = () => desserts) {
  const chargements = { nombre: 0 };
  const user = userEvent.setup();
  const charger = () => {
    chargements.nombre++;
    return source();
  };
  render(
    <App
      model={modeleDeTest}
      otherModels={[
        { label: CARTE_DES_DESSERTS, load: charger },
        { label: CARTE_DES_FROMAGES, load: () => fromages },
      ]}
      referentiel={snapshotReferentiel}
      declarer={() => {}}
    />,
  );
  return { user, chargements };
}

const bascule = (name: string, pressed = false) =>
  screen.findByRole("button", { name, pressed });

const ouvrirLesDesserts = async (user: User) =>
  user.click(await bascule(CARTE_DES_DESSERTS));

beforeEach(() => rangerRattachement(null));

describe("un autre modèle", () => {
  it("n'est pas proposé à un service ordinaire", async () => {
    const { user } = monter();

    await seRattacher(user);

    await screen.findByRole("group", BOISSON);
    expect(
      screen.queryByRole("button", { name: CARTE_DES_DESSERTS }),
    ).toBeNull();
  });

  it("est proposé au service n° 4 sous son nom, sans être chargé d'avance", async () => {
    const { user, chargements } = monter();

    await seRattacherProduit(user);

    const encadre = await screen.findByRole("region", ENCADRE);
    const noms = within(encadre)
      .getAllByRole("button", { pressed: false })
      .map((bouton) => bouton.textContent);
    expect(noms).toEqual([CARTE_DES_DESSERTS, CARTE_DES_FROMAGES]);
    expect(chargements.nombre).toBe(0);
  });

  it("remplace le modèle de l'app, sans redemander le rattachement", async () => {
    const { user, chargements } = monter();
    await seRattacherProduit(user);

    await ouvrirLesDesserts(user);

    expect(await screen.findByRole("group", DESSERT)).toBeInTheDocument();
    expect(screen.queryByRole("group", BOISSON)).toBeNull();
    expect(await bascule(CARTE_DES_DESSERTS, true)).toBeInTheDocument();
    expect(chargements.nombre).toBe(1);
  });

  it("attend son chargement, puis s'ouvre", async () => {
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

  it("laisse sa place à un troisième", async () => {
    const { user } = monter();
    await seRattacherProduit(user);
    await ouvrirLesDesserts(user);

    await user.click(await bascule(CARTE_DES_FROMAGES));

    expect(await screen.findByRole("group", FROMAGE)).toBeInTheDocument();
    expect(await bascule(CARTE_DES_DESSERTS)).toBeInTheDocument();
  });

  it("se quitte pour revenir au modèle de l'app", async () => {
    const { user } = monter();
    await seRattacherProduit(user);
    await ouvrirLesDesserts(user);

    await user.click(await bascule(CARTE_DES_DESSERTS, true));

    expect(await screen.findByRole("group", BOISSON)).toBeInTheDocument();
    expect(await bascule(CARTE_DES_DESSERTS)).toBeInTheDocument();
  });

  it("repart d'une simulation vierge à chaque changement", async () => {
    const { user } = monter();
    await seRattacherProduit(user);
    await user.click(await screen.findByRole("radio", { name: "Un thé" }));
    await screen.findByRole("group", { name: /^avec quoi/i });

    await ouvrirLesDesserts(user);
    await user.click(await bascule(CARTE_DES_DESSERTS, true));

    await screen.findByRole("group", BOISSON);
    expect(screen.getByRole("radio", { name: "Un thé" })).not.toBeChecked();
  });
});

// ---- implémentation ----

// Un autre modèle, reconnaissable à sa première question.
function modeleQuiDemande(mets: string): Model {
  return {
    ...modeleDeTest,
    transportAndEligibility: {
      ...modeleDeTest.transportAndEligibility,
      parts: [
        {
          id: mets,
          title: mets,
          pages: [
            {
              id: mets,
              questions: [
                {
                  id: mets,
                  kind: "single choice",
                  label: `Quel ${mets} souhaitez-vous ?`,
                  options: [{ value: "maison", label: "Celui de la maison" }],
                },
              ],
            },
          ],
        },
      ],
    },
  };
}
