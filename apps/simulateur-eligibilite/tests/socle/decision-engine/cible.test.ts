// Une cible des règles : une valeur, sans objet ou inconnue. C'est un objet
// valeur : immuable, égal à toute cible de même valeur, et lu par ses méthodes.

import { describe, expect, it } from "vitest";
import { Cible, cibleValues } from "../../../core/socle";

const lecture = (cible: Cible<boolean>) => [
  cible.isOui(),
  cible.isNon(),
  cible.isInconnue(),
  cible.isSansObjet(),
];

describe("une cible « oui ou non »", () => {
  it("se lit par sa valeur", () => {
    expect(lecture(Cible.of(true))).toEqual([true, false, false, false]);
    expect(lecture(Cible.of(false))).toEqual([false, true, false, false]);
  });

  it("inconnue ou sans objet, n'est jamais un « non »", () => {
    expect(lecture(Cible.of<boolean>(undefined))).toEqual([
      false,
      false,
      true,
      false,
    ]);
    expect(lecture(Cible.of<boolean>(null))).toEqual([
      false,
      false,
      false,
      true,
    ]);
  });
});

describe("une cible à constantes", () => {
  const table = (valeur: "GRANDE" | "PETITE" | null | undefined) =>
    Cible.of(valeur);

  it("vaut sa constante, et aucune autre", () => {
    expect(table("GRANDE").is("GRANDE")).toBe(true);
    expect(table("GRANDE").is("PETITE")).toBe(false);
  });

  it("ne vaut aucune constante, inconnue ou sans objet", () => {
    expect(table(undefined).is("GRANDE")).toBe(false);
    expect(table(null).is("GRANDE")).toBe(false);
    expect(table(undefined).isInconnue()).toBe(true);
    expect(table(null).isSansObjet()).toBe(true);
  });

  it("refuse, au typage, une lecture qui n'est pas la sienne", () => {
    // @ts-expect-error une cible à constantes n'est pas « oui ou non ».
    table("GRANDE").isOui();
    // @ts-expect-error « MOYENNE » n'est pas une constante de la table.
    table("GRANDE").is("MOYENNE");
    // @ts-expect-error une cible « oui ou non » n'a pas de constantes.
    Cible.of(true).is(true);
  });
});

describe("un objet valeur", () => {
  it("est égal à toute cible de même valeur", () => {
    expect(Cible.of("GRANDE")).toEqual(Cible.of("GRANDE"));
    expect(Cible.of(true)).not.toEqual(Cible.of(false));
    expect(Cible.of(null)).not.toEqual(Cible.of(undefined));
  });

  it("ne se modifie pas", () => {
    const cible = Cible.of(true);
    expect(Object.isFrozen(cible)).toBe(true);
    expect(() => {
      (cible as { value: unknown }).value = false;
    }).toThrow(TypeError);
  });

  it("passe en JSON par sa valeur", () => {
    expect(
      JSON.parse(JSON.stringify({ table: Cible.of("GRANDE"), abri: null })),
    ).toEqual({ table: "GRANDE", abri: null });
  });
});

describe("la valeur de chaque cible", () => {
  it("est celle que les règles donnent, inconnue comprise", () => {
    expect(
      cibleValues({
        abri: Cible.of(true),
        table: Cible.of("PETITE"),
        parapluie: Cible.of<boolean>(undefined),
      }),
    ).toEqual({ abri: true, table: "PETITE", parapluie: undefined });
  });
});
