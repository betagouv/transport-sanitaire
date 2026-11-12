import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RattachementForm } from "../../../front/socle/rattachement/RattachementForm";
import {
  type Referentiel,
  snapshotReferentiel,
} from "../../../shared/referentiel";

// L'écran est testé par ce que voit l'utilisateur : choisir, lire le champ
// suivant, constater l'entrée dans le simulateur (`onValide`).

async function choisir(labelSelect: RegExp, optionLabel: string) {
  const select = screen.getByRole("combobox", { name: labelSelect });
  await within(select).findByRole("option", { name: optionLabel });
  await userEvent.selectOptions(select, optionLabel);
}

const ACCEDER = { name: "Accéder au simulateur" } as const;

const valider = () => userEvent.click(screen.getByRole("button", ACCEDER));

const saisir = (label: string, texte: string) =>
  userEvent.type(screen.getByRole("textbox", { name: label }), texte);

async function optionsDeLaPremiereListe() {
  const select = screen.getByRole("combobox", { name: /Établissement/ });
  await within(select).findByRole("option", { name: "CHU Grenoble Alpes" });
  return within(select).getAllByRole("option");
}

describe("l'écran de rattachement", () => {
  it("annonce la simulation, la phase expérimentale, puis demande l'établissement", () => {
    render(<RattachementForm onValide={vi.fn()} />);

    expect(
      screen.getByRole("heading", {
        name: "Faites une simulation pour prescrire le transport adapté",
      }),
    ).toBeInTheDocument();
    // L'emoji est décoratif : il est masqué aux lecteurs d'écran.
    expect(screen.getByText("🙏")).toHaveAttribute("aria-hidden", "true");
    expect(
      screen.getByText(
        "Phase expérimentale : partagez vos retours via le bouton orange « Faire une remarque », à droite ou « Donner mon avis » en haut de l'écran",
        { exact: false },
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Établissement" }),
    ).toHaveDisplayValue("Sélectionnez un établissement");
  });

  it("liste les établissements, puis sous un trait « Autre établissement » et les structures", async () => {
    render(<RattachementForm onValide={vi.fn()} />);

    const options = await optionsDeLaPremiereListe();
    expect(options.map((o) => o.textContent)).toEqual([
      "Centre hospitalier de Chambéry",
      "CHU Grenoble Alpes",
      "Clinique Belledonne",
      "──────────",
      "Autre établissement",
      "Libéral",
      "Assurance Maladie",
      "Autre",
    ]);
    // Le trait ne se choisit pas. L'établissement fourre-tout ne s'affiche pas.
    expect(options[3]).toBeDisabled();
  });

  it("établissement → un service de la liste ouvre le simulateur sans bouton", async () => {
    const onValide = vi.fn();
    render(<RattachementForm onValide={onValide} />);

    await choisir(/Établissement/, "CHU Grenoble Alpes");
    expect(screen.queryByRole("button", ACCEDER)).toBeNull();
    await choisir(/Nom du service/, "Cardiologie");

    expect(onValide).toHaveBeenCalledWith(
      {
        etabId: "e_chu_grenoble",
        serviceId: "s_grenoble_cardio",
      },
      null,
    );
  });

  it("une structure ouvre le simulateur, rattachée au service du fourre-tout", async () => {
    const onValide = vi.fn();
    render(<RattachementForm onValide={onValide} />);

    await choisir(/Établissement/, "Libéral");

    expect(onValide).toHaveBeenCalledWith(
      {
        etabId: "e_liberal_cnam",
        serviceId: "s_liberal",
      },
      "Libéral",
    );
  });

  it("la structure « Autre » ouvre le simulateur sans rien demander", async () => {
    const onValide = vi.fn();
    render(<RattachementForm onValide={onValide} />);

    await choisir(/Établissement/, "Autre");

    expect(screen.queryByRole("textbox")).toBeNull();
    expect(onValide).toHaveBeenCalledWith(
      {
        etabId: "e_liberal_cnam",
        serviceId: "s_liberal_autre",
      },
      "Autre",
    );
  });

  it("service « Autre » → le nom du vrai service, puis un bouton", async () => {
    const onValide = vi.fn();
    render(<RattachementForm onValide={onValide} />);

    await choisir(/Établissement/, "CHU Grenoble Alpes");
    await choisir(/Nom du service/, "Autre");
    expect(onValide).not.toHaveBeenCalled();
    // Service réel encore vide → bouton désactivé.
    expect(screen.getByRole("button", ACCEDER)).toBeDisabled();

    await saisir("Renseignez le nom de votre service", "Néphrologie");
    expect(screen.getByRole("button", ACCEDER)).toBeEnabled();
    await valider();

    expect(onValide).toHaveBeenCalledWith(
      {
        etabId: "e_chu_grenoble",
        serviceId: "s_grenoble_autre",
        serviceEstAutre: true,
        serviceLibre: "Néphrologie",
      },
      null,
    );
  });

  it("« Autre établissement » → son nom et celui du service, puis un bouton", async () => {
    const onValide = vi.fn();
    render(<RattachementForm onValide={onValide} />);

    await choisir(/Établissement/, "Autre établissement");
    expect(
      screen.queryByRole("combobox", { name: /Nom du service/ }),
    ).toBeNull();
    expect(screen.getByRole("button", ACCEDER)).toBeDisabled();

    await saisir("Renseignez le nom de votre établissement", "CH de Voiron");
    expect(screen.getByRole("button", ACCEDER)).toBeDisabled();
    await saisir("Renseignez le nom de votre service", "Urgences");
    expect(screen.getByRole("button", ACCEDER)).toBeEnabled();
    await valider();

    expect(onValide).toHaveBeenCalledWith(
      {
        etabId: "",
        etabEstAutre: true,
        etabLibre: "CH de Voiron",
        serviceLibre: "Urgences",
      },
      null,
    );
  });

  it("changer le premier choix efface ce qui en découlait", async () => {
    render(<RattachementForm onValide={vi.fn()} />);

    await choisir(/Établissement/, "Autre établissement");
    await saisir("Renseignez le nom de votre établissement", "CH de Voiron");
    await choisir(/Établissement/, "CHU Grenoble Alpes");
    await choisir(/Nom du service/, "Autre");
    await choisir(/Établissement/, "Autre établissement");

    expect(
      screen.getByRole("textbox", {
        name: "Renseignez le nom de votre établissement",
      }),
    ).toHaveValue("");
  });

  it("trie les services par ordre alphabétique, « Autre » en dernier", async () => {
    render(<RattachementForm onValide={vi.fn()} />);

    // Le référentiel fournit « Urgences » avant « Médecine interne ».
    await choisir(/Établissement/, "Centre hospitalier de Chambéry");
    const select = screen.getByRole("combobox", { name: /Nom du service/ });
    await within(select).findByRole("option", { name: "Urgences" });

    expect(
      within(select)
        .getAllByRole("option")
        .map((o) => o.textContent),
    ).toEqual(["Médecine interne", "Urgences", "Autre"]);
  });
});

describe("référentiel indisponible : rattachement dégradé « Autre / Autre »", () => {
  const enPanne = async () => {
    throw new Error("référentiel indisponible");
  };

  it("laisse entrer sans établissement ni service quand la liste des établissements ne charge pas", async () => {
    const onValide = vi.fn();
    const referentiel: Referentiel = {
      ...snapshotReferentiel,
      listerEtablissements: enPanne,
    };
    render(<RattachementForm referentiel={referentiel} onValide={onValide} />);

    expect(
      await screen.findByText(/momentanément indisponible/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("combobox", { name: /Établissement/ }),
    ).toBeNull();
    await valider();

    expect(onValide).toHaveBeenCalledWith(
      {
        etabId: "autre",
        serviceId: "autre",
      },
      null,
    );
  });

  it("bascule aussi quand les services (donc les structures) ne chargent pas", async () => {
    const onValide = vi.fn();
    const referentiel: Referentiel = {
      ...snapshotReferentiel,
      listerServices: enPanne,
    };
    render(<RattachementForm referentiel={referentiel} onValide={onValide} />);

    expect(
      await screen.findByText(/momentanément indisponible/),
    ).toBeInTheDocument();
    await valider();

    expect(onValide).toHaveBeenCalledWith(
      {
        etabId: "autre",
        serviceId: "autre",
      },
      null,
    );
  });
});
