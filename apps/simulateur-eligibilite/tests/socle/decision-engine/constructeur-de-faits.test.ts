// Le constructeur d'un fait : ses règles s'appliquent dans l'ordre, la
// première qui l'établit l'emporte, et `sinon` dit la provenance d'un fait
// qu'aucune n'établit. `selon` cite la question et sa réponse.

import { describe, expect, it } from "vitest";
import { Fait } from "../../../core/socle/decision-engine/fait";
import { faitsOf } from "../../../front/socle/decision-engine/fait-builder";
import { ValidatedAnswers } from "../../../front/socle/questionnaire-engine/validated-answers";

type Questions = {
  boisson: "the" | "cafe" | "eau";
  sucre: "oui" | "non" | "ne-sait-pas";
  quantite: number;
};

type Faits = {
  readonly fait_chaude: Fait;
  readonly fait_sucree: Fait;
  readonly fait_tasses: Fait<number>;
};

const fait = faitsOf<Faits>();

const validees = (reponses: Partial<Questions>) =>
  new ValidatedAnswers<Questions>(
    Object.fromEntries(
      Object.entries(reponses).map(([id, answer]) => [
        id,
        { offered: [], answer },
      ]),
    ),
  );

const chaude = (reponses: Partial<Questions>) => {
  const boisson = validees(reponses).question("boisson");
  return fait("fait_chaude")
    .selon(boisson, { the: "oui", cafe: "oui", eau: "non" })
    .sinon("La boisson n'est pas encore choisie.");
};

describe("un fait selon une réponse", () => {
  it("vaut l'état que la table donne à la réponse, et cite la question", () => {
    expect(chaude({ boisson: "the" })).toEqual({
      fait_chaude: Fait.oui("boisson : « the »."),
    });
    expect(chaude({ boisson: "eau" })).toEqual({
      fait_chaude: Fait.non("boisson : « eau »."),
    });
  });

  it("reste inconnu, avec la provenance de `sinon`, sans réponse", () => {
    expect(chaude({})).toEqual({
      fait_chaude: Fait.inconnu("La boisson n'est pas encore choisie."),
    });
  });

  it("peut rester inconnu par la réponse elle-même", () => {
    const sucre = validees({ sucre: "ne-sait-pas" }).question("sucre");
    expect(
      fait("fait_sucree")
        .selon(sucre, { oui: "oui", non: "non", "ne-sait-pas": "inconnu" })
        .sinon("Le sucre n'est pas encore demandé."),
    ).toEqual({ fait_sucree: Fait.inconnu("sucre : « ne-sait-pas ».") });
  });

  it("laisse la main aux règles suivantes pour une valeur hors de la table", () => {
    const boisson = validees({ boisson: "eau" }).question("boisson");
    expect(
      fait("fait_chaude")
        .selon(boisson, { the: "oui" })
        .nonSi(boisson.is("eau"), "De l'eau, servie fraîche.")
        .sinon("La boisson n'est pas encore choisie."),
    ).toEqual({ fait_chaude: Fait.non("De l'eau, servie fraîche.") });
  });
});

describe("les règles d'un fait", () => {
  it("s'appliquent dans l'ordre : la première qui l'établit l'emporte", () => {
    expect(
      fait("fait_sucree")
        .ouiSi(true, "D'abord.")
        .nonSi(true, "Ensuite.")
        .sinon("Jamais."),
    ).toEqual({ fait_sucree: Fait.oui("D'abord.") });
  });

  it("laissent le fait inconnu quand aucune ne l'établit", () => {
    expect(
      fait("fait_sucree")
        .ouiSi(false, "Sucré.")
        .nonSi(false, "Pas sucré.")
        .sinon("Rien ne le dit."),
    ).toEqual({ fait_sucree: Fait.inconnu("Rien ne le dit.") });
  });

  it("ne s'appliquent pas si la condition de `seulementSi` ne tient pas", () => {
    const sucre = validees({ sucre: "oui" }).question("sucre");
    const sucree = (boisson: Questions["boisson"]) =>
      fait("fait_sucree")
        .seulementSi(boisson !== "eau")
        .selon(sucre, { oui: "oui", non: "non" })
        .sinon("On ne sucre pas l'eau.");
    expect(sucree("the")).toEqual({
      fait_sucree: Fait.oui("sucre : « oui »."),
    });
    expect(sucree("eau")).toEqual({
      fait_sucree: Fait.inconnu("On ne sucre pas l'eau."),
    });
  });

  it("refusent, au typage, un fait inconnu, non booléen, ou une option inconnue", () => {
    const boisson = validees({}).question("boisson");
    // @ts-expect-error « fait_froide » n'est pas un fait du modèle.
    fait("fait_froide");
    // @ts-expect-error « fait_tasses » ne vaut pas « oui » ou « non ».
    fait("fait_tasses");
    // @ts-expect-error « chocolat » n'est pas une boisson.
    fait("fait_chaude").selon(boisson, { chocolat: "oui" });
  });
});
