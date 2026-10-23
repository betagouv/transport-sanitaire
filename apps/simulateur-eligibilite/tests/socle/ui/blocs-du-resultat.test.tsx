// Les blocs qu'un modèle place dans le corps d'un résultat : l'encadré, nommé
// par son titre ou, sans titre, par son label, le bloc dépliable, les cartes
// numérotées, les étapes à pastille et les cartes illustrées.

import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Disclosure,
  IllustratedCards,
  NumberedCards,
  NumberedSteps,
  Panel,
} from "../../../front/socle";

describe("l'encadré", () => {
  it("est une région nommée par son titre", () => {
    render(
      <Panel variant="grey" title="Pourquoi ce résultat ?" divided>
        <p>Un élément</p>
      </Panel>,
    );

    const encadre = screen.getByRole("region", {
      name: "Pourquoi ce résultat ?",
    });
    expect(within(encadre).getByText("Un élément")).toBeInTheDocument();
  });

  it("prend le niveau de titre donné, sous celui de sa section", () => {
    render(
      <Panel variant="white" title="À propos des frais" titleLevel={3}>
        <p>Un texte</p>
      </Panel>,
    );

    expect(
      screen.getByRole("heading", { level: 3, name: "À propos des frais" }),
    ).toBeInTheDocument();
  });

  it("sans titre, est un aparté nommé par son label", () => {
    render(
      <Panel variant="outlined" label="Information importante">
        <p>Un conseil</p>
      </Panel>,
    );

    const encadre = screen.getByRole("complementary", {
      name: "Information importante",
    });
    expect(within(encadre).getByText("Un conseil")).toBeInTheDocument();
  });
});

describe("le bloc dépliable", () => {
  it("montre son contenu à l'arrivée, sous son résumé", () => {
    render(
      <Disclosure summary="Éléments pris en compte">
        <p>Un élément</p>
      </Disclosure>,
    );

    const resume = screen.getByText("Éléments pris en compte");
    expect(resume.tagName).toBe("SUMMARY");
    expect(resume.closest("details")).toHaveAttribute("open");
    expect(screen.getByText("Un élément")).toBeVisible();
  });

  it("se replie d'un clic sur son résumé", () => {
    render(
      <Disclosure summary="Éléments pris en compte">
        <p>Un élément</p>
      </Disclosure>,
    );

    fireEvent.click(screen.getByText("Éléments pris en compte"));

    expect(screen.getByRole("group")).not.toHaveAttribute("open");
  });
});

describe("les cartes numérotées", () => {
  it("sont une liste ordonnée, sous leur titre", () => {
    render(
      <NumberedCards title="Que faire ?" items={["Un", "Deux", "Trois"]} />,
    );

    const section = screen.getByRole("region", { name: "Que faire ?" });
    const cartes = within(section).getAllByRole("listitem");
    expect(cartes.map((carte) => carte.textContent)).toEqual([
      "Un",
      "Deux",
      "Trois",
    ]);
  });

  it("se rangent sur deux colonnes quand il n'y en a que deux", () => {
    render(<NumberedCards title="Que faire ?" items={["Un", "Deux"]} />);

    expect(screen.getByRole("list")).toHaveClass("socle-numbered-cards--two");
  });

  it("ne s'affichent pas sans carte", () => {
    render(<NumberedCards title="Que faire ?" items={[]} />);

    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });
});

describe("les étapes à pastille", () => {
  const ETAPES = [
    { title: "Réserver", content: <p>Appelez le transporteur.</p> },
    { title: "Partir", content: <p>Emportez la prescription.</p> },
  ];

  it("se lisent par leur numéro et leur titre, au niveau demandé", () => {
    render(<NumberedSteps steps={ETAPES} titleLevel={4} />);

    expect(
      screen.getByRole("heading", { level: 4, name: "1. Réserver" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 4, name: "2. Partir" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Emportez la prescription.")).toBeInTheDocument();
  });

  it("portent chacune sa pastille, que le lecteur d'écran ne relit pas", () => {
    render(<NumberedSteps steps={ETAPES} />);

    const pastilles = screen
      .getAllByRole("heading")
      .map((titre) => titre.querySelector("[aria-hidden='true']"));
    expect(pastilles.map((pastille) => pastille?.textContent)).toEqual([
      "1",
      "2",
    ]);
  });

  it("ne s'affichent pas sans étape", () => {
    const { container } = render(<NumberedSteps steps={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});

describe("les cartes illustrées", () => {
  const UNE = { title: "Une", text: "La première", image: "/une.webp" };
  const DEUX = { title: "Deux", text: "La deuxième", image: "/deux.webp" };
  const CARTES = [UNE, DEUX];

  it("sont une liste, chaque carte avec son titre au niveau demandé", () => {
    render(<IllustratedCards cards={CARTES} titleLevel={4} />);

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(
      screen.getByRole("heading", { level: 4, name: "Deux" }),
    ).toBeInTheDocument();
    expect(screen.getByText("La deuxième")).toBeInTheDocument();
  });

  it("ont des dessins décoratifs, que le lecteur d'écran ignore", () => {
    render(<IllustratedCards cards={CARTES} />);

    const dessins = screen.getAllByRole("presentation", { hidden: true });
    expect(dessins.map((dessin) => dessin.getAttribute("src"))).toEqual([
      "/une.webp",
      "/deux.webp",
    ]);
    expect(dessins.map((dessin) => dessin.getAttribute("alt"))).toEqual([
      "",
      "",
    ]);
  });

  it("masquent le dessin qui se charge, et disent qu'il se charge", () => {
    render(<IllustratedCards cards={[UNE]} />);

    expect(
      screen.getByRole("presentation", { hidden: true }),
    ).not.toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent(
      "En cours de chargement",
    );
  });

  it("montrent le dessin chargé, sans le texte de chargement", () => {
    render(<IllustratedCards cards={[UNE]} />);

    fireEvent.load(screen.getByRole("presentation", { hidden: true }));

    expect(screen.getByRole("presentation")).toBeVisible();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("gardent la zone d'un dessin qui ne se charge pas, vide, sans texte de chargement", () => {
    const { container } = render(<IllustratedCards cards={[UNE]} />);

    fireEvent.error(screen.getByRole("presentation", { hidden: true }));

    expect(
      container.querySelector(".socle-illustrated-cards__media"),
    ).toBeEmptyDOMElement();
  });

  it("marquent la carte retenue de son badge, comme l'élément courant", () => {
    render(
      <IllustratedCards
        cards={[UNE, { ...DEUX, selected: true }]}
        selectedLabel="Votre choix"
      />,
    );

    const retenue = screen.getByRole("listitem", { current: true });
    expect(within(retenue).getByText("Votre choix")).toBeInTheDocument();
    expect(within(retenue).getByRole("heading")).toHaveTextContent("Deux");
    expect(screen.getAllByText("Votre choix")).toHaveLength(1);
  });

  it("ne s'affichent pas sans carte", () => {
    render(<IllustratedCards cards={[]} />);

    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
