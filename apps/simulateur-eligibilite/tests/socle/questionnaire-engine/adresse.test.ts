// Une adresse : un objet valeur. Elle lit une réponse en JSON, se modifie
// champ par champ sans changer, et se garde en JSON.

import { describe, expect, it } from "vitest";
import { Address } from "../../../core/socle/questionnaire-engine";

describe("une adresse", () => {
  it("se lit dans une réponse en objet, et dans elle seule", () => {
    const adresse = Address.of({ street: "3 rue des Lilas", city: "Paris" });
    expect(adresse?.field("city")).toBe("Paris");
    expect(adresse?.field("postalCode")).toBeUndefined();
    expect(Address.of("Paris")).toBeUndefined();
    expect(Address.of(["Paris"])).toBeUndefined();
    expect(Address.of(undefined)).toBeUndefined();
  });

  it("donne une nouvelle adresse quand un champ est saisi", () => {
    const vide = Address.empty();
    const saisie = vide.withField("city", "Lyon");
    expect(saisie?.toJSON()).toEqual({ street: "", city: "Lyon" });
    expect(vide.toJSON()).toEqual({ street: "", city: "" });
  });

  it("n'est plus une réponse une fois vidée", () => {
    const adresse = Address.empty().withField("city", "Lyon");
    expect(adresse?.withField("city", "")).toBeUndefined();
  });
});
