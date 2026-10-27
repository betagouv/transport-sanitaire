// Le constructeur d'un fait : ses règles s'appliquent dans l'ordre, la
// première qui l'établit l'emporte, et `sinon` dit la provenance d'un fait
// qu'aucune n'établit. `selon` et `citant` citent les questions et leurs
// réponses ; `selonCase` et `nonSiEcartee` lisent une case proposée.

import { describe, expect, it } from "vitest";
import { citant, Fait, unFait } from "../../../core/socle";
import { ValidatedAnswers } from "../../../core/socle/questionnaire-engine/validated-answers";

type Questions = {
  boisson: "the" | "cafe" | "eau";
  sucre: "oui" | "non" | "ne-sait-pas";
  accompagnements: readonly ("lait" | "citron")[];
};

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

const chaude = (reponses: Partial<Questions>) =>
  unFait()
    .selon(validees(reponses).question("boisson"), {
      the: "oui",
      cafe: "oui",
      eau: "non",
    })
    .sinon("La boisson n'est pas encore choisie.");

const avec = (cochees: Questions["accompagnements"]) =>
  validees(
    { accompagnements: cochees },
    { accompagnements: ["lait", "citron"] },
  ).question("accompagnements");

describe("un fait selon une réponse", () => {
  it("vaut l'état que la table donne à la réponse, et cite la question", () => {
    expect(chaude({ boisson: "the" })).toEqual(Fait.oui("boisson : « the »."));
    expect(chaude({ boisson: "eau" })).toEqual(Fait.non("boisson : « eau »."));
  });

  it("reste inconnu, avec la provenance de `sinon`, sans réponse", () => {
    expect(chaude({})).toEqual(
      Fait.inconnu("La boisson n'est pas encore choisie."),
    );
  });

  it("peut rester inconnu par la réponse elle-même", () => {
    const sucre = validees({ sucre: "ne-sait-pas" }).question("sucre");
    expect(
      unFait()
        .selon(sucre, { oui: "oui", non: "non", "ne-sait-pas": "inconnu" })
        .sinon("Le sucre n'est pas encore demandé."),
    ).toEqual(Fait.inconnu("sucre : « ne-sait-pas »."));
  });

  it("laisse la main aux règles suivantes pour une valeur hors de la table", () => {
    const boisson = validees({ boisson: "eau" }).question("boisson");
    expect(
      unFait()
        .selon(boisson, { the: "oui" })
        .nonSi(boisson.is("eau"), "De l'eau, servie fraîche.")
        .sinon("La boisson n'est pas encore choisie."),
    ).toEqual(Fait.non("De l'eau, servie fraîche."));
  });
});

describe("un fait selon une case", () => {
  const lait = (cochees: Questions["accompagnements"]) =>
    unFait().selonCase(avec(cochees), "lait").sinon("Pas encore validé.");

  it("vaut « oui » cochée, « non » proposée sans être cochée", () => {
    expect(lait(["lait"])).toEqual(
      Fait.oui("accompagnements : « lait » cochée."),
    );
    expect(lait(["citron"])).toEqual(
      Fait.non("accompagnements : « lait » proposée, non cochée."),
    );
  });

  it("laisse la main quand la case ne se proposait pas", () => {
    expect(
      unFait()
        .selonCase(validees({}).question("accompagnements"), "lait")
        .sinon("Pas encore validé."),
    ).toEqual(Fait.inconnu("Pas encore validé."));
  });

  it("vaut « non » écartée, et seulement écartée", () => {
    const citron = (cochees: Questions["accompagnements"]) =>
      unFait()
        .nonSiEcartee(avec(cochees), "citron", "Pas de citron.")
        .sinon("À voir au service.");
    expect(citron(["lait"])).toEqual(Fait.non("Pas de citron."));
    expect(citron(["citron"])).toEqual(Fait.inconnu("À voir au service."));
    expect(
      unFait()
        .nonSiEcartee(avec(["lait"]), "citron")
        .sinon("À voir."),
    ).toEqual(Fait.non("accompagnements : « citron » proposée, non cochée."));
  });
});

describe("les règles d'un fait", () => {
  it("s'appliquent dans l'ordre : la première qui l'établit l'emporte", () => {
    expect(
      unFait().ouiSi(true, "D'abord.").nonSi(true, "Ensuite.").sinon("Jamais."),
    ).toEqual(Fait.oui("D'abord."));
  });

  it("laissent le fait inconnu quand aucune ne l'établit", () => {
    expect(
      unFait()
        .ouiSi(false, "Sucré.")
        .nonSi(false, "Pas sucré.")
        .sinon("Rien ne le dit."),
    ).toEqual(Fait.inconnu("Rien ne le dit."));
  });

  it("ne s'appliquent pas si la condition de `seulementSi` ne tient pas", () => {
    const sucre = validees({ sucre: "oui" }).question("sucre");
    const sucree = (boisson: Questions["boisson"]) =>
      unFait()
        .seulementSi(boisson !== "eau")
        .selon(sucre, { oui: "oui", non: "non" })
        .sinon("On ne sucre pas l'eau.");
    expect(sucree("the")).toEqual(Fait.oui("sucre : « oui »."));
    expect(sucree("eau")).toEqual(Fait.inconnu("On ne sucre pas l'eau."));
  });

  it("s'arrêtent sur un inconnu de `inconnuSi`", () => {
    expect(
      unFait()
        .inconnuSi(true, "Le service le dira.")
        .ouiSi(true, "Trop tard.")
        .sinon("Jamais."),
    ).toEqual(Fait.inconnu("Le service le dira."));
  });

  it("retiennent un fait établi ailleurs, même inconnu", () => {
    expect(
      unFait().retient(undefined).ouiSi(true, "Ensuite.").sinon("Jamais."),
    ).toEqual(Fait.oui("Ensuite."));
    expect(
      unFait()
        .retient(Fait.inconnu("Ailleurs."))
        .ouiSi(true, "Ensuite.")
        .sinon("Jamais."),
    ).toEqual(Fait.inconnu("Ailleurs."));
  });

  it("valent le fait que `sinon` reçoit, quand aucune ne l'établit", () => {
    const servie = Fait.oui("Servie d'office.");
    expect(unFait().ouiSi(false, "Demandée.").sinon(servie)).toBe(servie);
    expect(unFait().ouiSi(true, "Demandée.").sinon(servie)).toEqual(
      Fait.oui("Demandée."),
    );
  });

  it("refusent, au typage, une option inconnue", () => {
    const boisson = validees({}).question("boisson");
    // @ts-expect-error « chocolat » n'est pas une boisson.
    unFait().selon(boisson, { chocolat: "oui" });
    // @ts-expect-error « sucre » n'est pas un accompagnement.
    unFait().selonCase(avec([]), "sucre");
  });
});

describe("une provenance qui cite les réponses", () => {
  it("cite chaque réponse donnée, et passe les autres", () => {
    const reponses = validees({ boisson: "the", accompagnements: ["lait"] });
    expect(
      citant(
        reponses.question("boisson"),
        reponses.question("sucre"),
        reponses.question("accompagnements"),
      ),
    ).toBe("boisson : « the », accompagnements : « lait ».");
  });
});
