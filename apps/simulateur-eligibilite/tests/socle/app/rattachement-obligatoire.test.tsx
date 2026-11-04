import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "../../../front/socle/app/App";
import {
  rangerRattachement,
  rattachementEnSession,
} from "../../../front/socle/rattachement";
import type { RattachementSaisi } from "../../../shared/rattachement-saisi";
import {
  type Referentiel,
  snapshotReferentiel,
} from "../../../shared/referentiel";
import { modeleDeTest, seulModele } from "../modele-de-test";

// L'écran de rattachement : on n'atteint pas le simulateur sans s'être rattaché.
// Le référentiel est le snapshot. La déclaration capture ce qui partirait au
// serveur : il n'y a pas de backend en test.
function setup(referentiel: Referentiel = snapshotReferentiel) {
  const user = userEvent.setup();
  const declarations: RattachementSaisi[] = [];
  render(
    <App
      models={seulModele(modeleDeTest)}
      referentiel={referentiel}
      declarer={(saisie) => declarations.push(saisie)}
    />,
  );
  return { user, declarations };
}

async function choisir(labelSelect: RegExp, optionLabel: string) {
  const select = screen.getByRole("combobox", { name: labelSelect });
  await within(select).findByRole("option", { name: optionLabel });
  await userEvent.selectOptions(select, optionLabel);
}

const acceder = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: "Accéder au simulateur" }));

const PREMIERE_QUESTION = { name: /^quelle boisson souhaitez-vous/i };

const simulateurMonte = () => screen.findByRole("group", PREMIERE_QUESTION);

beforeEach(() => rangerRattachement(null));

describe("écran de rattachement", () => {
  it("affiche le rattachement d'abord, pas le formulaire", () => {
    setup();
    // L'app n'a pas de titre. L'écran de rattachement se reconnaît à son premier
    // champ, et le simulateur est absent.
    expect(
      screen.getByRole("combobox", { name: /Établissement/ }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("group", PREMIERE_QUESTION)).toBeNull();
  });

  it("passe au simulateur dès l'établissement et le service choisis", async () => {
    const { declarations } = setup();

    await choisir(/Établissement/, "CHU Grenoble Alpes");
    await choisir(/Nom du service/, "Cardiologie");

    // Le simulateur est monté : une question de la partie 1 apparaît.
    expect(await simulateurMonte()).toBeInTheDocument();
    // Le service part tel quel à l'analytics. Le référentiel n'apprend rien.
    expect(rattachementEnSession()).toEqual({
      etabId: "e_chu_grenoble",
      serviceId: "s_grenoble_cardio",
    });
    expect(declarations).toEqual([]);
  });

  it("service « Autre » : déclare le service saisi au serveur, sans attendre sa réponse", async () => {
    const { user, declarations } = setup();

    await choisir(/Établissement/, "CHU Grenoble Alpes");
    await choisir(/Nom du service/, "Autre");
    await user.type(
      screen.getByRole("textbox", {
        name: "Renseignez le nom de votre service",
      }),
      "Néphrologie",
    );
    await acceder(user);

    expect(await simulateurMonte()).toBeInTheDocument();
    expect(declarations).toEqual([
      {
        etabId: "e_chu_grenoble",
        serviceId: "s_grenoble_autre",
        serviceEstAutre: true,
        serviceLibre: "Néphrologie",
      },
    ]);
    expect(rattachementEnSession()?.serviceId).toBe("s_grenoble_autre");
  });

  it("« Autre établissement » : déclare l'établissement et son service, sans attendre", async () => {
    const { user, declarations } = setup();

    await choisir(/Établissement/, "Autre établissement");
    await user.type(
      screen.getByRole("textbox", {
        name: "Renseignez le nom de votre établissement",
      }),
      "CH de Voiron",
    );
    await user.type(
      screen.getByRole("textbox", {
        name: "Renseignez le nom de votre service",
      }),
      "Urgences",
    );
    await acceder(user);

    expect(await simulateurMonte()).toBeInTheDocument();
    const saisie = {
      etabId: "",
      etabEstAutre: true,
      etabLibre: "CH de Voiron",
      serviceLibre: "Urgences",
    };
    expect(declarations).toEqual([saisie]);
    // Rien n'identifie le service à Matomo : l'événement part sans nom.
    expect(rattachementEnSession()).toEqual(saisie);
  });

  it("référentiel indisponible : entre quand même, rattaché à « Autre / Autre »", async () => {
    const { user, declarations } = setup({
      ...snapshotReferentiel,
      listerEtablissements: async () => {
        throw new Error("Grist indisponible");
      },
    });

    await screen.findByText(/momentanément indisponible/);
    await acceder(user);

    expect(await simulateurMonte()).toBeInTheDocument();
    expect(rattachementEnSession()).toEqual({
      etabId: "autre",
      serviceId: "autre",
    });
    expect(declarations).toEqual([]);
  });
});
