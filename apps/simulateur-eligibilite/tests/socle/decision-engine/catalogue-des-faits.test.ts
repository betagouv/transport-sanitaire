// Le catalogue des faits : la liste des faits du modèle. Il refuse un doublon,
// un oubli et un fait hors du modèle, calcule chaque fait à sa première
// lecture, et arrête net un fait qui se lit lui-même.

import { describe, expect, it } from "vitest";
import {
  Fait,
  FaitCatalogue,
  type FaitDeclare,
  givenOf,
  unFait,
} from "../../../core/socle";
import { ValidatedAnswers } from "../../../core/socle/questionnaire-engine/validated-answers";

type Questions = { boisson: "the" | "cafe" | "eau" };
type Faits = { readonly chaude: Fait; readonly servie: Fait };

const NOMS = ["chaude", "servie"] as const;
const given = givenOf<Questions, Faits>();

let calculs: string[] = [];

// Le fait, qui note chacun de ses calculs.
const compte = <Nom extends keyof Faits>(fait: FaitDeclare<Nom, Fait>) =>
  unFait(fait.nom).vaut(
    fait.compute((valeur) => {
      calculs.push(fait.nom);
      return valeur;
    }),
  );

const CHAUDE = compte(
  unFait("chaude")
    .ouiSi(given.question("boisson").answer().isOneOf("the", "cafe"))
    .nonSi(given.question("boisson").answer().is("eau"))
    .sinon("Pas encore de boisson."),
);
const SERVIE = compte(
  unFait("servie")
    .ouiSi(given.fait("chaude").isOui(), "Une boisson chaude se sert.")
    .sinon("Rien à servir."),
);

const lus = (catalogue: FaitCatalogue<Faits>, boisson?: Questions["boisson"]) =>
  catalogue.read(
    new ValidatedAnswers<Questions>(
      boisson ? { boisson: { offered: [], answer: boisson } } : {},
    ),
  );

describe("le catalogue des faits", () => {
  const catalogue = new FaitCatalogue<Faits>(NOMS, [CHAUDE, SERVIE]);

  it("donne chaque fait par sa déclaration, qui peut lire un autre fait", () => {
    const faits = lus(catalogue, "the");
    expect(faits.chaude).toEqual(Fait.oui("boisson : « the »."));
    expect(faits.servie).toEqual(
      Fait.oui("chaude : « oui ». Une boisson chaude se sert."),
    );
    expect(Object.keys(faits)).toEqual(["chaude", "servie"]);
  });

  it("calcule un fait à sa première lecture, une seule fois", () => {
    calculs = [];
    const faits = lus(catalogue, "eau");
    expect(calculs).toEqual([]);
    expect(faits.chaude.isNon()).toBe(true);
    expect(faits.chaude.isNon()).toBe(true);
    expect(calculs).toEqual(["chaude"]);
  });

  it("garde un fait imposé, sans le calculer", () => {
    calculs = [];
    const faits = catalogue.read(new ValidatedAnswers<Questions>({}), {
      chaude: Fait.oui("Imposé."),
    });
    expect(faits.servie.isOui()).toBe(true);
    expect(calculs).toEqual(["servie"]);
  });

  it("refuse un fait déclaré deux fois", () => {
    expect(
      () => new FaitCatalogue<Faits>(NOMS, [CHAUDE, CHAUDE, SERVIE]),
    ).toThrow("« chaude » se déclare deux fois.");
  });

  it("refuse un fait oublié", () => {
    expect(() => new FaitCatalogue<Faits>(NOMS, [CHAUDE])).toThrow(
      "Ces faits ne sont pas déclarés : servie.",
    );
  });

  it("refuse un fait qui n'est pas du modèle", () => {
    const hors = unFait("froide").sinon("…") as unknown as typeof CHAUDE;
    expect(
      () => new FaitCatalogue<Faits>(NOMS, [CHAUDE, SERVIE, hors]),
    ).toThrow("« froide » n'est pas un fait du modèle.");
  });

  it("refuse qu'un fait lise une cible", () => {
    const cible = givenOf<Questions, Faits, { cible_x: Fait }>().cible(
      "cible_x",
    );
    const lit = new FaitCatalogue<Faits>(NOMS, [
      unFait("chaude").ouiSi(cible.isOui()).sinon("…"),
      SERVIE,
    ]);
    expect(() => lus(lit).chaude).toThrow("Un fait ne lit pas de cible.");
  });
});

describe("un fait qui se lit lui-même", () => {
  it("s'arrête net, par d'autres faits", () => {
    const boucle = new FaitCatalogue<Faits>(NOMS, [
      unFait("chaude").ouiSi(given.fait("servie").isOui()).sinon("…"),
      unFait("servie").ouiSi(given.fait("chaude").isOui()).sinon("…"),
    ]);
    expect(() => lus(boucle).chaude).toThrow(
      "« chaude » se lit lui-même : chaude → servie → chaude.",
    );
  });
});
