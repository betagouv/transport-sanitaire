// Ce qu'un lecteur déclare lire, et rien d'autre (#196). Le compilateur refuse
// un nom non déclaré ; à l'exécution, sa lecture lève une erreur qui nomme le
// lecteur.

import { describe, expect, it } from "vitest";
import { ValidatedAnswers } from "../../core/socle/questionnaire-engine/validated-answers";
import {
  type DeclaredAnswers,
  DeclaredReads,
  forConcept,
} from "../../front/socle";

type Questions = {
  boisson: "the" | "cafe";
  quantite: "un" | "deux";
};

const validees = new ValidatedAnswers<Questions>({
  boisson: { offered: ["the", "cafe"], answer: "the" },
  quantite: { offered: ["un", "deux"], answer: "deux" },
});

const lecteur = new DeclaredReads("Le service du thé", ["boisson", "sucre"]);
const lues: DeclaredAnswers<Questions, "boisson"> = lecteur.answers(validees);

describe("des questions lues après déclaration", () => {
  it("se lisent comme les questions validées", () => {
    expect(lues.question("boisson").is("the")).toBe(true);
  });

  it("refusent une question non déclarée, en nommant le lecteur", () => {
    // @ts-expect-error `quantite` n'est pas déclarée.
    expect(() => lues.question("quantite")).toThrow(
      "Le service du thé lit quantite sans le déclarer.",
    );
  });

  it("passent à un concept, que la garde suit encore", () => {
    const concept = forConcept(lues);
    expect(concept.question("boisson").is("the")).toBe(true);
    expect(() => concept.question("quantite")).toThrow(
      "Le service du thé lit quantite sans le déclarer.",
    );
  });

  it("gardent les autres méthodes liées à leur instance", () => {
    expect(forConcept(lues).toJSON()).toEqual(validees.toJSON());
  });
});

describe("des valeurs lues après déclaration", () => {
  const faits = { sucre: 2, lait: 0 };

  it("se lisent si elles sont déclarées", () => {
    expect(lecteur.record(faits).sucre).toBe(2);
  });

  it("refusent une clé présente non déclarée", () => {
    expect(() => lecteur.record(faits).lait).toThrow(
      "Le service du thé lit lait sans le déclarer.",
    );
  });

  it("refusent un nom connu, même absent", () => {
    const precisions: { citron?: true } = {};
    expect(() => lecteur.record(precisions, ["citron"]).citron).toThrow(
      "Le service du thé lit citron sans le déclarer.",
    );
  });

  it("gardent la liste des noms déclarés", () => {
    expect(lecteur.reads).toEqual(["boisson", "sucre"]);
  });
});
