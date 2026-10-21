// Les blocs qu'un modèle place dans le corps d'un résultat : l'encadré, nommé
// par son titre, le bloc dépliable, et les cartes numérotées.

import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Disclosure, NumberedCards, Panel } from "../../../front/socle";

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
