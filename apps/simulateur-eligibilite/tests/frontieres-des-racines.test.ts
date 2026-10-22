// Les frontières entre les racines de l'app, rendues exécutables : le métier
// (`core/`), le navigateur (`front/`), le backend (`server/`) et leur contrat
// (`shared/`).
//
// Comme dans `architecture.test.ts`, chaque règle donne son pourquoi dans son
// message d'échec.

import { describe, expect, it } from "vitest";
import { franchissements, sources, texteDe } from "./inspection-des-sources";

const commencePar = (prefixe: string) => (cible: string) =>
  cible.startsWith(prefixe);

describe("frontières de runtime", () => {
  it("le front n'importe rien du serveur", () => {
    expect(
      franchissements(["front"], commencePar("server/")),
      "Le serveur détient la clé Grist. Un seul import suffirait à la " +
        "faire entrer dans le bundle servi au navigateur. Passe par une " +
        "route `/api`.",
    ).toEqual([]);
  });

  it("le serveur n'importe rien du front", () => {
    expect(
      franchissements(["server"], commencePar("front/")),
      "Le backend tourne sous Node sans DOM : importer du front y ferait " +
        "entrer du JSX et des API navigateur qui n'existent pas à " +
        "l'exécution. Ce qui doit être partagé va dans `shared/`.",
    ).toEqual([]);
  });

  it("le métier n'importe ni le front, ni le serveur", () => {
    expect(
      franchissements(
        ["core"],
        (cible) => cible.startsWith("front/") || cible.startsWith("server/"),
      ),
      "`core/` porte le métier : les moteurs et la logique des modèles. Le " +
        "front et le serveur l'importent, jamais l'inverse : le serveur doit " +
        "pouvoir charger un modèle sans l'écran, pour l'exposer par une API.",
    ).toEqual([]);
  });

  it("le métier n'importe ni React, ni le DSFR, ni une feuille de style", () => {
    const fautifs = sources("core").filter((f) =>
      /from "(react|react-dom|@codegouvfr\/[^"]*)(\/[^"]*)?"|\.css"/.test(
        texteDe(f),
      ),
    );
    expect(
      fautifs,
      "Node échoue au premier import de CSS, et React n'a rien à faire dans " +
        "une règle métier. Ce qui s'affiche reste dans `front/` : le métier " +
        "dit un fait (une question facultative, une borne dépassée), l'écran " +
        "écrit la phrase.",
    ).toEqual([]);
  });

  it("le contrat partagé ne dépend d'aucune des deux racines", () => {
    expect(
      franchissements(
        ["shared"],
        (cible) => cible.startsWith("front/") || cible.startsWith("server/"),
      ),
      "`shared/` est chargé des deux côtés : il ne peut dépendre que de " +
        "lui-même. Ce qui a besoin du front ou du serveur n'est pas du contrat.",
    ).toEqual([]);
  });
});
