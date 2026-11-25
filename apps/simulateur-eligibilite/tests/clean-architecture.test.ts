// La clean architecture, rendue exécutable (ARCH-004) : le sens des
// dépendances, puis le journal des parcours et la mesure d'audience.
// Comme dans `architecture.test.ts`, chaque règle donne son pourquoi dans son
// message d'échec.

import { dirname, join, relative, resolve } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import {
  astDe,
  importsDe,
  racine,
  sources,
  texteDe,
} from "./inspection-des-sources";

// Le journal, côté serveur et côté écran, et la mesure d'audience.
const JOURNAL = ["server/journal", "front/socle/analytics"];

// Son domaine : les entités, les objets-valeurs, les use cases et les ports.
const duDomaine = (cible: string) =>
  /\.(entity|vo|usecase|port)(\.ts)?$/.test(cible);

// Exemption : le domaine du journal peut lire un type du métier, par un
// `import type` d'un `.types.ts` de `core/`. Il traduit ce que le modèle dit
// (une intention) dans les mots du journal : avec le type du métier, une valeur
// ajoutée au modèle casse la traduction à la compilation. Un import de valeur
// reste refusé, et tout autre fichier de `core/` aussi.
const estUnTypeDuMetier = (fichier: string, cible: string) =>
  /^core\/.*\.types(\.ts)?$/.test(cible) &&
  importsDeTypeDe(fichier).includes(cible);

function importsDeTypeDe(fichier: string): string[] {
  return astDe(fichier)
    .statements.filter(ts.isImportDeclaration)
    .filter((instruction) => instruction.importClause?.isTypeOnly === true)
    .map((instruction) => instruction.moduleSpecifier)
    .filter(ts.isStringLiteral)
    .map((specificateur) =>
      relative(
        racine,
        resolve(dirname(join(racine, fichier)), specificateur.text),
      ),
    );
}

// Les racines où le domaine n'importe aucun adaptateur.
const RACINES = ["core", "front", "server", "shared"];

// Où seul un adaptateur importe un paquet. Dans `core/`, tout fichier qui n'est
// pas un adaptateur. Ailleurs, le domaine seulement : un fichier qui porte un
// rôle du domaine par son suffixe. Les autres rôles sont exemptés, chacun pour
// sa raison : un composant (`.tsx`) importe React et le DSFR, un hook
// (`.hook.ts`) est l'adaptateur de l'écran, un contrôleur (`.controller.ts`)
// importe Express et zod à la porte du serveur, un middleware (`.middleware.ts`)
// importe Express et ses greffons, un client (`.client.ts`) est
// l'accès à l'extérieur, une validation (`.schema.ts`) importe zod, et lui
// seul. Un fichier sans suffixe hors de `core/` n'a pas de
// rôle (QUAL-018 ne vaut que pour certains dossiers) : il n'est pas jugé.
const SANS_PAQUET_PARTOUT = ["core"];
const SANS_PAQUET_DANS_LE_DOMAINE = ["front", "server", "shared"];

// Exemption : le domaine de `server/` peut importer un module `node:*`. C'est la
// bibliothèque standard de l'environnement, pas une infrastructure qu'on
// remplacerait. Le risque accepté : qu'un import comme `node:http` s'y glisse.
// `core/`, `front/` et `shared/` tournent aussi dans le navigateur, où un import
// `node:*` casserait l'écran : ils restent sous la règle.
const estUnModuleNodeDuServeur = (
  fichier: string,
  paquet: string | undefined,
) => fichier.startsWith("server/") && paquet?.startsWith("node:");

const dansLeDomaine = (fichier: string) =>
  /\.(entity|vo|service|usecase|port|error|factory|types|constants|fait|question)\.ts$/.test(
    fichier,
  );

const estUneValidation = (fichier: string) => fichier.endsWith(".schema.ts");

// Exemption : une validation (`.schema.ts`) importe `zod`, et aucun autre
// paquet. Elle est jugée comme le domaine, zod mis à part : sans cela, un
// `.schema.ts` de `front/`, `server/` ou `shared/` ne serait pas jugé du tout.
const estUnImportDeZodDUneValidation = (
  fichier: string,
  paquet: string | undefined,
) => estUneValidation(fichier) && paquet === "zod";

// Exemption : dans `front/`, un `.types.ts` peut faire un `import type` de
// `react`, parce que le contrat du modèle porte des composants React. Un import
// de valeur reste refusé, et `import { type X } from "react"` aussi : sous
// `verbatimModuleSyntax` il laisse un import dans le code compilé. Un seul
// import de `react` qui n'est pas un `import type` refuse tous ceux du fichier.
const estUnImportTypeDeReactDuFront = (
  fichier: string,
  paquet: string | undefined,
) =>
  fichier.startsWith("front/") &&
  fichier.endsWith(".types.ts") &&
  paquet === "react" &&
  tousLesImportsDeReactSontDesTypes(fichier);

function tousLesImportsDeReactSontDesTypes(fichier: string): boolean {
  const importsDeType = astDe(fichier).statements.filter(
    (instruction) =>
      ts.isImportDeclaration(instruction) &&
      ts.isStringLiteral(instruction.moduleSpecifier) &&
      instruction.moduleSpecifier.text === "react" &&
      instruction.importClause?.isTypeOnly === true,
  );
  return importsDeType.length === paquetsDe(fichier).filter(estReact).length;
}

const estReact = (paquet: string | undefined) => paquet === "react";

const estUnAdaptateur = (fichier: string) => /\.adapter(\.ts)?$/.test(fichier);

// Un index dit ce que son module promet : il peut exporter un adaptateur. Un
// conteneur assemble les classes d'une racine : il les choisit et les branche.
// Les fichiers de la racine que QUAL-018 nomme font de même : le point d'entrée
// du serveur et son app Express, le point d'entrée de l'écran. Ils sont nommés
// par leur chemin, pas par leur nom : un `app.ts` au fond d'un dossier n'est pas
// une racine.
const ASSEMBLEURS_DE_RACINE = [
  "server/server.ts",
  "server/app.ts",
  "front/main.tsx",
];
const assemble = (fichier: string) =>
  fichier.endsWith("/index.ts") ||
  /(^|\/)container\.ts$/.test(fichier) ||
  ASSEMBLEURS_DE_RACINE.includes(fichier);

// Le moteur de décision, que le modèle importe sans passer par un index : il
// amènerait publicodes dans le chunk d'entrée (`modules-du-socle.test.ts`).
const MOTEUR_DU_MODELE =
  "core/socle/decision-engine/publicodes-decision-engine.adapter.ts";
const leModeleChargeLeMoteur = (fichier: string, cible: string) =>
  fichier.startsWith("core/models/") && cible === MOTEUR_DU_MODELE;

// Les paquets qu'un fichier importe : tout ce qui n'est pas un chemin relatif.
const PAQUET = /(?:from|import)\s*\(?\s*["']([^."'][^"']*)["']/g;
const paquetsDe = (fichier: string) =>
  [...texteDe(fichier).matchAll(PAQUET)].map(([, paquet]) => paquet);

describe("le sens des dépendances", () => {
  it("le domaine n'importe pas un adaptateur", () => {
    const fautifs = sources(...RACINES)
      .filter((f) => !estUnAdaptateur(f) && !assemble(f))
      .flatMap((f) =>
        importsDe(f)
          .filter((cible) => estUnAdaptateur(cible))
          .filter((cible) => !leModeleChargeLeMoteur(f, cible))
          .map((cible) => `${f} → ${cible}`),
      );
    expect(
      fautifs,
      "Un adaptateur (`.adapter.ts`) dépend du domaine, jamais l'inverse " +
        "(ARCH-004). Déclare ce que tu attends dans un port (`.port.ts`), et " +
        "reçois l'adaptateur en paramètre.",
    ).toEqual([]);
  });

  it("une bibliothèque externe reste derrière un port", () => {
    const fautifs = [
      ...sources(...SANS_PAQUET_PARTOUT).filter((f) => !estUnAdaptateur(f)),
      ...sources(...SANS_PAQUET_DANS_LE_DOMAINE).filter(
        (f) => dansLeDomaine(f) || estUneValidation(f),
      ),
    ].flatMap((f) =>
      paquetsDe(f)
        .filter((paquet) => !estUnModuleNodeDuServeur(f, paquet))
        .filter((paquet) => !estUnImportDeZodDUneValidation(f, paquet))
        .filter((paquet) => !estUnImportTypeDeReactDuFront(f, paquet))
        .map((paquet) => `${f} → ${paquet}`),
    );
    expect(
      fautifs,
      "Seul un adaptateur (`.adapter.ts`) importe un paquet (ARCH-004), sauf " +
        "`zod` dans un `.schema.ts` et `import type` de `react` dans un " +
        "`.types.ts` de `front/` : le " +
        "domaine tient sans lui, et en changer ne touche qu'un fichier. Passe " +
        "par le port de l'adaptateur, ou écris-en un.",
    ).toEqual([]);
  });
});

describe("le journal des parcours", () => {
  it("seul l'adaptateur PostgreSQL du journal connaît la base", () => {
    const fautifs = sources("server/journal").filter(
      (f) =>
        f !== "server/journal/postgres-journal.adapter.ts" &&
        importsDe(f).some(
          (cible) =>
            cible.startsWith("server/postgres/") ||
            cible.startsWith("server/grist/"),
        ),
    );
    expect(
      fautifs,
      "Le journal des parcours est derrière un port, `server/journal/journal.port.ts` " +
        "(ARCH-004) : PostgreSQL n'est que son adaptateur du moment, après " +
        "Grist. Le reste du journal ne connaît ni la base ni ses types : passe " +
        "par le port, ou ajoute ce qui manque à l'adaptateur.",
    ).toEqual([]);
  });

  it("seul le client PostgreSQL importe le pilote de la base", () => {
    const fautifs = sources("server")
      .filter((f) => f !== "server/postgres/postgres.client.ts")
      .filter((f) => paquetsDe(f).some((paquet) => paquet === "pg"));
    expect(
      fautifs,
      "Le pilote `pg` reste derrière `server/postgres/postgres.client.ts`, " +
        "comme Grist derrière son client : un adaptateur reçoit `Sql`, que " +
        "la base des tests (PGlite) remplit aussi.",
    ).toEqual([]);
  });

  it("le domaine du journal et de la mesure d'audience ne dépend que de lui-même et du contrat", () => {
    const fautifs = sources(...JOURNAL)
      .filter(duDomaine)
      .flatMap((f) =>
        importsDe(f)
          .filter((cible) => !duDomaine(cible) && !cible.startsWith("shared/"))
          .filter((cible) => !estUnTypeDuMetier(f, cible))
          .map((cible) => `${f} → ${cible}`),
      );
    expect(
      fautifs,
      "Entités, objets-valeurs, use cases et ports (`.entity.ts`, `.vo.ts`, " +
        "`.usecase.ts`, `.port.ts`) " +
        "forment le domaine du journal et de la mesure d'audience (ARCH-004). " +
        "Ils ne connaissent ni HTTP, ni Grist, ni l'écran : un adaptateur " +
        "(`.adapter.ts`) les relie à l'extérieur. Passe ce qui manque en " +
        "paramètre, ou déclare-le dans un port. Seul un type du métier se " +
        "lit, par un `import type` d'un `.types.ts` de `core/`.",
    ).toEqual([]);
  });
});
