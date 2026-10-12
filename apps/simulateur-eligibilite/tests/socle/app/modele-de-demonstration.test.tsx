// Le modèle de démonstration : les developer tools proposent de le dérouler à
// la place du modèle livré. Il ne se charge qu'à ce moment-là, et le
// rattachement reste.

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
const OUVRIR = { name: "Modèle de démonstration" };
const QUITTER = { name: "Quitter la démonstration" };

// Un second modèle, reconnaissable à sa première question.
const demonstration: Model = {
  ...modeleDeTest,
  transportAndEligibility: {
    ...modeleDeTest.transportAndEligibility,
    parts: [
      {
        id: "demonstration",
        title: "Démonstration",
        pages: [
          {
            id: "dessert",
            questions: [
              {
                id: "dessert",
                kind: "single choice",
                label: "Quel dessert souhaitez-vous ?",
                options: [{ value: "tarte", label: "Une tarte" }],
              },
            ],
          },
        ],
      },
    ],
  },
};

// Monte l'app avec les deux modèles et compte les chargements du second.
function monter(source: () => Model | Promise<Model> = () => demonstration) {
  const chargements = { nombre: 0 };
  const user = userEvent.setup();
  render(
    <App
      model={modeleDeTest}
      demonstration={() => {
        chargements.nombre++;
        return source();
      }}
      referentiel={snapshotReferentiel}
      declarer={() => {}}
    />,
  );
  return { user, chargements };
}

const ouvrirLaDemonstration = async (user: User) =>
  user.click(await screen.findByRole("button", OUVRIR));

beforeEach(() => rangerRattachement(null));

describe("le modèle de démonstration", () => {
  it("n'est pas proposé quand l'app n'en a pas", async () => {
    const user = userEvent.setup();
    render(<App model={modeleDeTest} referentiel={snapshotReferentiel} />);

    await seRattacherProduit(user);

    const encadre = await screen.findByRole("region", ENCADRE);
    expect(within(encadre).queryByRole("button", OUVRIR)).toBeNull();
  });

  it("n'est pas proposé à un service ordinaire", async () => {
    const { user } = monter();

    await seRattacher(user);

    await screen.findByRole("group", BOISSON);
    expect(screen.queryByRole("button", OUVRIR)).toBeNull();
  });

  it("est proposé au service n° 4, sans être chargé d'avance", async () => {
    const { user, chargements } = monter();

    await seRattacherProduit(user);

    const encadre = await screen.findByRole("region", ENCADRE);
    expect(within(encadre).getByRole("button", OUVRIR)).toBeInTheDocument();
    expect(chargements.nombre).toBe(0);
  });

  it("remplace le modèle livré, sans redemander le rattachement", async () => {
    const { user, chargements } = monter();
    await seRattacherProduit(user);

    await ouvrirLaDemonstration(user);

    expect(await screen.findByRole("group", DESSERT)).toBeInTheDocument();
    expect(screen.queryByRole("group", BOISSON)).toBeNull();
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

    await ouvrirLaDemonstration(user);
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Chargement du simulateur…",
    );
    expect(screen.queryByRole("group", BOISSON)).toBeNull();

    arriver(demonstration);
    expect(await screen.findByRole("group", DESSERT)).toBeInTheDocument();
  });

  it("se quitte pour revenir au modèle livré", async () => {
    const { user } = monter();
    await seRattacherProduit(user);
    await ouvrirLaDemonstration(user);

    await user.click(await screen.findByRole("button", QUITTER));

    expect(await screen.findByRole("group", BOISSON)).toBeInTheDocument();
    expect(screen.getByRole("button", OUVRIR)).toBeInTheDocument();
  });

  it("repart d'une simulation vierge à chaque changement", async () => {
    const { user } = monter();
    await seRattacherProduit(user);
    await user.click(await screen.findByRole("radio", { name: "Un thé" }));
    await screen.findByRole("group", { name: /^avec quoi/i });

    await ouvrirLaDemonstration(user);
    await user.click(await screen.findByRole("button", QUITTER));

    await screen.findByRole("group", BOISSON);
    expect(screen.getByRole("radio", { name: "Un thé" })).not.toBeChecked();
  });
});
