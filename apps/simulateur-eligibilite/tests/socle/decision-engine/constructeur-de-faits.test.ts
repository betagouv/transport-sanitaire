// Le constructeur d'un fait : ses règles s'appliquent dans l'ordre, la
// première qui l'établit l'emporte, et `sinon` dit la provenance d'un fait
// qu'aucune n'établit. Une règle cite ce que lit sa condition, puis sa raison ;
// `uneRegle()` en écrit une qu'un fait place avec `applique`.

import { describe, expect, it } from "vitest";
import {
  Fait,
  FaitCatalogue,
  type FaitDeclare,
  givenOf,
  uneRegle,
  unFait,
} from "../../../core/socle";
import { ValidatedAnswers } from "../../../core/socle/questionnaire-engine/validated-answers";

type Questions = {
  boisson: "the" | "cafe" | "eau";
  sucre: "oui" | "non" | "ne-sait-pas";
  accompagnements: readonly ("lait" | "citron")[];
};
type Faits = { readonly chaude: Fait; readonly servie: Fait };

const given = givenOf<Questions, Faits>();
const BOISSON = given.question("boisson").answer();
const SUCRE = given.question("sucre").answer();
const ACCOMPAGNEMENTS = given.question("accompagnements").answer();

const validees = (
  reponses: Partial<Questions>,
  proposees: Partial<Record<keyof Questions, readonly string[]>> = {},
) =>
  new ValidatedAnswers<Questions>(
    Object.fromEntries(
      Object.entries(reponses).map(([id, answer]) => [
        id,
        { offered: proposees[id as keyof Questions] ?? [], answer },
      ]),
    ),
  );

// Le fait, lu seul sur ces réponses validées.
const lu = (
  fait: FaitDeclare<"chaude", unknown>,
  reponses: Partial<Questions> = {},
  proposees: Partial<Record<keyof Questions, readonly string[]>> = {},
) =>
  new FaitCatalogue<{ chaude: unknown }>(["chaude"], [fait]).read(
    validees(reponses, proposees),
  ).chaude;

const CHAUDE = unFait("chaude")
  .ouiSi(BOISSON.isOneOf("the", "cafe"))
  .nonSi(BOISSON.is("eau"), "Servie fraîche.")
  .sinon("La boisson n'est pas encore choisie.");

describe("un fait", () => {
  it("vaut l'état de la première règle qui tient, et cite ce qu'elle lit", () => {
    expect(lu(CHAUDE, { boisson: "the" })).toEqual(
      Fait.oui("boisson : « the »."),
    );
    expect(lu(CHAUDE, { boisson: "eau" })).toEqual(
      Fait.non("boisson : « eau ». Servie fraîche."),
    );
  });

  it("reste inconnu, avec la raison de `sinon`, quand aucune ne tient", () => {
    expect(lu(CHAUDE)).toEqual(
      Fait.inconnu("La boisson n'est pas encore choisie."),
    );
  });

  it("cite une réponse absente, et les deux côtés d'un « ou »", () => {
    const fait = unFait("chaude")
      .nonSi(SUCRE.isMissing().and(BOISSON.is("eau").or(BOISSON.is("the"))))
      .sinon("Jamais.");
    expect(lu(fait, { boisson: "eau" })).toEqual(
      Fait.non("sucre : sans réponse, boisson : « eau »."),
    );
  });

  it("s'arrête sur un inconnu de `inconnuSi`", () => {
    const fait = unFait("chaude")
      .inconnuSi(SUCRE.is("ne-sait-pas"), "Le service le dira.")
      .ouiSi(SUCRE.isPresent())
      .sinon("Jamais.");
    expect(lu(fait, { sucre: "ne-sait-pas" })).toEqual(
      Fait.inconnu("sucre : « ne-sait-pas ». Le service le dira."),
    );
  });

  it("vaut une valeur qui n'est pas un état, avec `vaut`", () => {
    const fait = unFait("chaude").vaut(
      BOISSON.compute((answer) => answer.value ?? null),
    );
    expect(lu(fait, { boisson: "cafe" })).toBe("cafe");
  });

  it("refuse, au typage, une option inconnue", () => {
    // @ts-expect-error « chocolat » n'est pas une boisson.
    BOISSON.is("chocolat");
    // @ts-expect-error « sucre » n'est pas un accompagnement.
    unFait("chaude").nonSiEcartee(ACCOMPAGNEMENTS, "sucre");
  });
});

describe("une case", () => {
  const LAIT = unFait("chaude")
    .ouiSi(ACCOMPAGNEMENTS.checked("lait"))
    .nonSiEcartee(ACCOMPAGNEMENTS, "lait")
    .sinon("Pas encore validé.");
  const avec = (cochees: Questions["accompagnements"]) =>
    lu(
      LAIT,
      { accompagnements: cochees },
      { accompagnements: ["lait", "citron"] },
    );

  it("vaut « oui » cochée, « non » proposée sans être cochée", () => {
    expect(avec(["lait"])).toEqual(Fait.oui("accompagnements : « lait »."));
    expect(avec(["citron"])).toEqual(
      Fait.non("accompagnements : « citron ». « lait » proposée, non cochée."),
    );
    expect(avec([])).toEqual(
      Fait.non(
        "accompagnements : aucune case cochée. « lait » proposée, non cochée.",
      ),
    );
  });

  it("laisse la main quand elle ne se proposait pas", () => {
    expect(lu(LAIT)).toEqual(Fait.inconnu("Pas encore validé."));
  });
});

describe("une règle", () => {
  const UNE_EAU_SE_SERT_FROIDE = uneRegle().nonSi(
    BOISSON.is("eau"),
    "Une eau se sert froide.",
  );

  it("se place dans un fait avec `applique`, à son rang", () => {
    const fait = unFait("chaude")
      .applique(UNE_EAU_SE_SERT_FROIDE)
      .ouiSi(BOISSON.isPresent())
      .sinon("Jamais.");
    expect(lu(fait, { boisson: "eau" })).toEqual(
      Fait.non("boisson : « eau ». Une eau se sert froide."),
    );
    expect(lu(fait, { boisson: "the" })).toEqual(
      Fait.oui("boisson : « the »."),
    );
  });

  it("ne porte qu'une règle, au typage", () => {
    const enchainee = () =>
      // @ts-expect-error Une règle ne s'enchaîne pas.
      UNE_EAU_SE_SERT_FROIDE.ouiSi(BOISSON.is("the"));
    expect(enchainee).toThrow();
  });
});
