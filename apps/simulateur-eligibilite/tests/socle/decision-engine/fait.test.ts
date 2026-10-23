// Un fait : oui, non ou inconnu, avec sa provenance. C'est un objet valeur :
// immuable, égal à tout fait de même valeur et de même provenance.

import { describe, expect, it } from "vitest";
import { Fait } from "../../../core/socle";

describe("un fait", () => {
  it("se lit par son état", () => {
    const oui = Fait.oui("coché");
    const non = Fait.non("écarté");
    const inconnu = Fait.inconnu("pas encore validé");
    expect([oui.isOui(), oui.isNon(), oui.isInconnu()]).toEqual([
      true,
      false,
      false,
    ]);
    expect([non.isOui(), non.isNon(), non.isInconnu()]).toEqual([
      false,
      true,
      false,
    ]);
    expect([inconnu.isOui(), inconnu.isNon(), inconnu.isInconnu()]).toEqual([
      false,
      false,
      true,
    ]);
  });

  it("inconnu, n'a pas de valeur : ce n'est pas un « non »", () => {
    expect(Fait.inconnu("pas encore validé").value).toBeUndefined();
    expect(Fait.non("écarté").value).toBe(false);
  });

  it("garde sa provenance, et passe en JSON tel quel", () => {
    expect(JSON.parse(JSON.stringify(Fait.oui("coché")))).toEqual({
      value: true,
      provenance: "coché",
    });
    expect(JSON.parse(JSON.stringify(Fait.inconnu("absent")))).toEqual({
      provenance: "absent",
    });
  });

  it("peut valoir un nombre", () => {
    expect(Fait.valant(8, "dit par l'hôte").value).toBe(8);
  });

  it("est égal à un fait de même valeur et de même provenance", () => {
    expect(Fait.oui("coché").equals(Fait.oui("coché"))).toBe(true);
    expect(Fait.oui("coché").equals(Fait.non("coché"))).toBe(false);
    expect(Fait.oui("coché").equals(Fait.oui("dit"))).toBe(false);
  });

  it("change de provenance sans changer de valeur", () => {
    const repris = Fait.non("écarté").avecProvenance("Q1.3 : écarté.");
    expect(repris.equals(Fait.non("Q1.3 : écarté."))).toBe(true);
  });

  it("ne se modifie pas", () => {
    const fait = Fait.oui("coché");
    expect(() => {
      (fait as { value: unknown }).value = false;
    }).toThrow(TypeError);
  });

  it("refuse, au typage, de lire « oui » ou « non » sur un nombre", () => {
    // @ts-expect-error un nombre ne vaut ni « oui » ni « non ».
    Fait.valant(8, "dit par l'hôte").isOui();
  });
});
