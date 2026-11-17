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
// Le référentiel est le snapshot, qui n'enregistre rien, ou un double qui
// enregistre la saisie libre et donne les ids qu'il crée.
function setup(referentiel: Referentiel = snapshotReferentiel) {
  const user = userEvent.setup();
  render(<App models={seulModele(modeleDeTest)} referentiel={referentiel} />);
  return { user };
}

// Un référentiel qui enregistre la saisie libre quand le test le décide.
function referentielQuiEnregistre() {
  const enregistrements: RattachementSaisi[] = [];
  let repondre = () => {};
  const referentiel: Referentiel = {
    ...snapshotReferentiel,
    enrichirDepuisSaisie(saisie) {
      enregistrements.push(saisie);
      const ids = { etabId: saisie.etabId || "e_cree", serviceId: "s_cree" };
      return new Promise((resolve) => {
        repondre = () => resolve(ids);
      });
    },
  };
  return { referentiel, enregistrements, repondre: () => repondre() };
}

const saisir = (
  user: ReturnType<typeof userEvent.setup>,
  champ: string,
  texte: string,
) => user.type(screen.getByRole("textbox", { name: champ }), texte);

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
    setup();

    await choisir(/Établissement/, "CHU Grenoble Alpes");
    await choisir(/Nom du service/, "Cardiologie");

    // Le simulateur est monté : une question de la partie 1 apparaît.
    expect(await simulateurMonte()).toBeInTheDocument();
    expect(rattachementEnSession()).toMatchObject({
      etabId: "e_chu_grenoble",
      serviceId: "s_grenoble_cardio",
    });
  });

  it("service « Autre » : attend que le référentiel crée le service, puis entre avec son id", async () => {
    const { referentiel, enregistrements, repondre } =
      referentielQuiEnregistre();
    const { user } = setup(referentiel);

    await choisir(/Établissement/, "CHU Grenoble Alpes");
    await choisir(/Nom du service/, "Autre");
    await saisir(user, "Renseignez le nom de votre service", "Néphrologie");
    await acceder(user);

    // L'attente se lit sur le bouton, sans autre écran.
    expect(
      screen.getByRole("button", { name: "Ouverture du simulateur…" }),
    ).toBeDisabled();
    expect(screen.queryByRole("group", PREMIERE_QUESTION)).toBeNull();
    repondre();

    expect(await simulateurMonte()).toBeInTheDocument();
    expect(enregistrements).toEqual([
      {
        etabId: "e_chu_grenoble",
        serviceId: "s_grenoble_autre",
        serviceEstAutre: true,
        serviceLibre: "Néphrologie",
      },
    ]);
    expect(rattachementEnSession()).toMatchObject({
      etabId: "e_chu_grenoble",
      serviceId: "s_cree",
    });
  });

  it("« Autre établissement » : entre avec l'établissement et le service créés", async () => {
    const { referentiel, repondre } = referentielQuiEnregistre();
    const { user } = setup(referentiel);

    await choisir(/Établissement/, "Autre établissement");
    await saisir(
      user,
      "Renseignez le nom de votre établissement",
      "CH de Voiron",
    );
    await saisir(user, "Renseignez le nom de votre service", "Urgences");
    await acceder(user);
    repondre();

    expect(await simulateurMonte()).toBeInTheDocument();
    expect(rattachementEnSession()).toMatchObject({
      etabId: "e_cree",
      serviceId: "s_cree",
    });
  });

  it("référentiel muet : la saisie libre entre quand même, sans id", async () => {
    const { user } = setup();

    await choisir(/Établissement/, "Autre établissement");
    await saisir(
      user,
      "Renseignez le nom de votre établissement",
      "CH de Voiron",
    );
    await saisir(user, "Renseignez le nom de votre service", "Urgences");
    await acceder(user);

    expect(await simulateurMonte()).toBeInTheDocument();
    expect(rattachementEnSession()?.etabId).toBeUndefined();
    expect(rattachementEnSession()?.serviceId).toBeUndefined();
  });

  it("référentiel indisponible : entre quand même, sans rattachement de repli", async () => {
    const { user } = setup({
      ...snapshotReferentiel,
      listerEtablissements: async () => {
        throw new Error("Grist indisponible");
      },
    });

    await screen.findByText(/momentanément indisponible/);
    await acceder(user);

    expect(await simulateurMonte()).toBeInTheDocument();
    expect(rattachementEnSession()?.etabId).toBeUndefined();
    expect(rattachementEnSession()?.serviceId).toBeUndefined();
  });
});
