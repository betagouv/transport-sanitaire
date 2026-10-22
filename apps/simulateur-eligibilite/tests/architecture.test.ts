// Les invariants d'architecture, rendus exécutables.
//
// AGENTS.md et `docs/knowledge/adr/` énoncent des règles. Ce fichier les vérifie.
//
// Chaque règle donne son pourquoi dans son message d'échec, le second argument
// d'`expect`. Un commentaire ne s'affiche pas quand le test rougit.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  franchissements,
  racine,
  sources,
  texteDe,
} from "./inspection-des-sources";

const commencePar = (prefixe: string) => (cible: string) =>
  cible.startsWith(prefixe);
const dedans = (cible: string) => (dossier: string) =>
  cible === dossier || cible.startsWith(`${dossier}/`);

// Ce qui pose les questions : le parcours et le moteur de questionnaire.
const PARCOURS = [
  "front/socle/simulateur",
  "front/socle/questionnaire-engine",
  "core/socle/questionnaire-engine",
];

// Le socle, à l'écran et dans le métier.
const SOCLE = ["front/socle", "core/socle"];

const dansLeSocle = (cible: string) =>
  SOCLE.some((dossier) => cible.startsWith(dossier));

// Ce que le modèle a le droit d'importer du socle : ses deux points d'entrée,
// celui de l'écran et celui du métier, et le moteur de décision, qui amènerait
// publicodes dans le chunk d'entrée s'il passait par un point d'entrée.
const OUVERT_AU_MODELE = [
  "front/socle",
  "core/socle",
  "core/socle/index",
  "core/socle/decision-engine/publicodes",
];

// Un nom par modèle : celui de l'éditeur, et le modèle de démonstration. Son
// métier est dans `core/models/<nom>/`, son écran dans `front/models/<nom>/`.
const NOMS = readdirSync(join(racine, "front/models"));
const dossiersDu = (nom: string) =>
  [`core/models/${nom}`, `front/models/${nom}`].filter((dossier) =>
    existsSync(join(racine, dossier)),
  );
const MODELES = NOMS.flatMap(dossiersDu);
const unModele = (cible: string) => /^(core|front)\/models\//.test(cible);

// Le seul fichier par lequel les tests du socle prennent leur modèle, et le
// dossier où ce modèle est écrit.
const MODELE_DE_TEST = "tests/socle/modele-de-test.ts";
const MODELE_FACTICE = "tests/socle/fixtures/modele-factice";

describe("le socle et le modèle", () => {
  it("le socle n'importe rien du modèle", () => {
    expect(
      franchissements(SOCLE, unModele),
      "Le socle ne dépend d'aucune version du modèle : il reçoit le sien en " +
        "prop, depuis `front/main.tsx`. Un import direct lierait le parcours, " +
        "les seeds ou les developer tools au questionnaire du moment, et " +
        "livrer un nouveau modèle obligerait à toucher au socle.",
    ).toEqual([]);
  });

  it("le modèle n'importe du socle que son point d'entrée", () => {
    expect(
      franchissements(
        ["front/models", "core/models"],
        (cible) =>
          dansLeSocle(cible) &&
          !OUVERT_AU_MODELE.includes(cible.replace(/\.tsx?$/, "")),
      ),
      "`front/socle/index.ts` et `core/socle/index.ts` disent ce que le " +
        "socle promet au modèle. Un import " +
        "plus profond lie le modèle à un détail du socle, qui ne peut plus " +
        "changer sans le casser. S'il manque quelque chose, ajoute-le au " +
        "point d'entrée.",
    ).toEqual([]);
  });
});

describe("la déclaration des questions", () => {
  it("un modèle déclare ses questions par ses constructeurs", () => {
    const litterales = sources(...MODELES, MODELE_FACTICE).filter((f) =>
      /\bkind: "(single choice|multiple choice|number|text|long text|date|datetime|checkbox|address)"/.test(
        texteDe(f),
      ),
    );
    expect(
      litterales,
      "Une question écrite en objet redit sa sorte et ses options, et ses " +
        "conditions reçoivent trois arguments positionnels. Son constructeur " +
        "(`questionsOf`) prend les options dans le catalogue et passe un seul " +
        "objet, faits compris.",
    ).toEqual([]);
  });
});

describe("les modèles entre eux", () => {
  it("un modèle n'importe rien d'un autre", () => {
    const croisements = NOMS.flatMap((nom) =>
      franchissements(
        dossiersDu(nom),
        (cible) => unModele(cible) && !dossiersDu(nom).some(dedans(cible)),
      ),
    );
    expect(
      croisements,
      "Chaque modèle se charge seul, à la demande. Un import de l'un vers " +
        "l'autre ferait télécharger les deux, et lierait le modèle de " +
        "l'éditeur au modèle de démonstration.",
    ).toEqual([]);
  });
});

describe("les tests et le modèle", () => {
  it("seuls les tests du modèle importent le modèle livré", () => {
    const autres = franchissements(["tests"], unModele).filter(
      (couple) => !couple.startsWith("tests/model/"),
    );
    expect(
      autres,
      "Les tests du socle tournent sur un modèle factice, écrit pour eux : " +
        "ils ne changent pas quand l'éditeur livre une version. Ce qui " +
        "vérifie le modèle livré va dans `tests/model/`.",
    ).toEqual([]);
  });

  it("les tests du socle ne prennent leur modèle que par un seul fichier", () => {
    const autres = franchissements(
      ["tests"],
      commencePar(MODELE_FACTICE),
    ).filter(
      (couple) =>
        !couple.startsWith(`${MODELE_DE_TEST} →`) &&
        !couple.startsWith(`${MODELE_FACTICE}/`),
    );
    expect(
      autres,
      `Les tests du socle prennent tous leur modèle dans \`${MODELE_DE_TEST}\` : ` +
        "changer de modèle de test ne touche alors qu'un fichier.",
    ).toEqual([]);
  });
});

describe("invariants métier", () => {
  it("le simulateur ignore qui prescrit", () => {
    expect(
      franchissements(
        [...PARCOURS, "front/models"],
        commencePar("front/socle/rattachement/"),
      ),
      "Le moteur d'éligibilité raisonne sur une situation médicale, jamais " +
        "sur une identité (docs/knowledge/adr/identification.md). L'analytics, " +
        "lui, est admis : il lit le rattachement en session de son côté, sans " +
        "le faire transiter ici.",
    ).toEqual([]);
  });

  it("les seeds et les developer tools se greffent sur le simulateur, jamais l'inverse", () => {
    expect(
      franchissements(
        PARCOURS,
        (cible) =>
          cible.startsWith("front/socle/developer-tools/") ||
          cible.startsWith("front/socle/seeds/"),
      ),
      "L'écran des seeds rejoue des seeds dans la décision du simulateur : les " +
        "seeds et les developer tools sont bâtis **sur** le socle. Le socle, " +
        "lui, n'a pas à les connaître : il reçoit d'`App` du contenu déjà " +
        "composé (`developerToolsPanel`). Fais de même plutôt que d'importer.",
    ).toEqual([]);
  });

  it("seul le moteur de décision importe publicodes", () => {
    const fautifs = sources("front", "core").filter(
      (f) =>
        !f.startsWith("core/socle/decision-engine/") &&
        /^import (?!type ).*from "publicodes";$/m.test(texteDe(f)),
    );
    expect(
      fautifs,
      "publicodes est l'outil du socle pour décider, derrière un seul " +
        "fichier : `core/socle/decision-engine/publicodes.ts`. Le reste du " +
        "socle et le modèle passent par lui. Un autre import lie du code au " +
        "moteur, et rend son remplacement plus cher.",
    ).toEqual([]);
  });

  it("le CERFA ne dépend que de lui-même", () => {
    expect(
      franchissements(
        ["front/socle/cerfa"],
        (cible) => !cible.startsWith("front/socle/cerfa/"),
      ),
      "Remplir un cerfa ne dépend pas du simulateur : il reçoit ses données, " +
        "d'où qu'elles viennent, et un mapping qui les lit. Le simulateur " +
        "branche le cerfa, jamais l'inverse. Passe ce qui lui manque en " +
        "paramètre, ou rends le type générique.",
    ).toEqual([]);
  });

  it("le CERFA n'adresse jamais le backend", () => {
    const fautifs = sources("front/socle/cerfa").filter((f) =>
      texteDe(f).includes("/api"),
    );
    expect(
      fautifs,
      "Le prescripteur y complète des données de santé nominatives : elles ne " +
        "doivent pas quitter le navigateur. Le module ne charge qu'un gabarit " +
        "vierge, servi comme un asset — aucune route `/api` ne doit y apparaître.",
    ).toEqual([]);
  });

  it("les règles publicodes ne portent que de l'éligibilité", () => {
    const regles = reglesPubliees().toLowerCase();
    const interdits = [
      "prescripteur . nom",
      "prescripteur . prenom",
      "etablissement . id",
      "matomo",
      "analytics",
      "pseudonym",
    ].filter((terme) => regles.includes(terme));
    expect(
      interdits,
      "Ni identification, ni analytics dans `front/models/*/rules/*.publicodes` : le moteur " +
        "reste une transcription de la réglementation, rejouable hors de " +
        "l'application.",
    ).toEqual([]);
  });
});

// Biome a les mêmes deux limites, mais il compte des lignes logiques : un bloc
// JSX ou une chaîne multiligne y vaut une seule ligne. Il reste utile dans
// l'éditeur. Ce fichier fait foi, en lignes réelles.
describe("chaîne d'outillage", () => {
  it("pnpm lance les scripts pre et post", () => {
    const workspace = readFileSync(
      join(racine, "..", "..", "pnpm-workspace.yaml"),
      "utf-8",
    );
    expect(
      /^enablePrePostScripts:\s*true\s*$/m.test(workspace),
      "npm lance `prebuild` et `postbuild` autour de `build` ; pnpm ne le " +
        "fait que si `enablePrePostScripts` est vrai dans le " +
        "`pnpm-workspace.yaml` de la racine. Sans lui, `prebuild` " +
        "(régénération des icônes DSFR) et `postbuild` " +
        "(`scripts/verifier-bundle.ts`) disparaissent **sans rien dire** : le " +
        "`verifier` reste vert en ayant sauté une porte, et le bundle part en " +
        "production sans avoir été vérifié.",
    ).toBe(true);
  });
});

// Le texte de toutes les règles livrées, tous modèles confondus. Vide quand
// aucun modèle n'a de dossier `rules/`.
function reglesPubliees(): string {
  return MODELES.flatMap((modele) => {
    const dossier = `${modele}/rules`;
    if (!existsSync(join(racine, dossier))) return [];
    return readdirSync(join(racine, dossier))
      .filter((fichier) => fichier.endsWith(".publicodes"))
      .map((fichier) => texteDe(`${dossier}/${fichier}`));
  }).join("\n");
}
