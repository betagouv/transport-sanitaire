// La clean architecture, rendue exécutable (ARCH-004) : le sens des
// dépendances, puis le journal des parcours et la mesure d'audience.
// Comme dans `architecture.test.ts`, chaque règle donne son pourquoi dans son
// message d'échec.

import { describe, expect, it } from "vitest";
import { importsDe, sources, texteDe } from "./inspection-des-sources";

// Le journal, côté serveur et côté écran, et la mesure d'audience.
const JOURNAL = ["server/journal", "front/socle/analytics"];

// Son domaine : les entités, les objets-valeurs, les use cases et les ports.
const duDomaine = (cible: string) =>
  /\.(entity|vo|usecase|port)(\.ts)?$/.test(cible);

// Les racines où le domaine n'importe aucun adaptateur.
const RACINES = ["core", "front", "server", "shared"];

// Où seul un adaptateur importe un paquet. Dans `core/`, tout fichier qui n'est
// pas un adaptateur. Ailleurs, le domaine seulement : un fichier qui porte un
// rôle du domaine par son suffixe. Les autres rôles sont exemptés, chacun pour
// sa raison : un composant (`.tsx`) importe React et le DSFR, un hook
// (`.hook.ts`) est l'adaptateur de l'écran, un contrôleur (`.controller.ts`)
// importe Express et zod à la porte du serveur, un client (`.client.ts`) est
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
  /\.(entity|vo|service|usecase|port|error|factory|types|constants)\.ts$/.test(
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

const estUnAdaptateur = (fichier: string) => /\.adapter(\.ts)?$/.test(fichier);

// Un index dit ce que son module promet : il peut exporter un adaptateur. Un
// conteneur assemble les classes d'une racine : il les choisit et les branche.
const assemble = (fichier: string) =>
  fichier.endsWith("/index.ts") || /(^|\/)container\.ts$/.test(fichier);

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
        .map((paquet) => `${f} → ${paquet}`),
    );
    expect(
      fautifs,
      "Seul un adaptateur (`.adapter.ts`) importe un paquet (ARCH-004), sauf " +
        "`zod` dans un `.schema.ts` : le " +
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
          .map((cible) => `${f} → ${cible}`),
      );
    expect(
      fautifs,
      "Entités, objets-valeurs, use cases et ports (`.entity.ts`, `.vo.ts`, " +
        "`.usecase.ts`, `.port.ts`) " +
        "forment le domaine du journal et de la mesure d'audience (ARCH-004). " +
        "Ils ne connaissent ni HTTP, ni Grist, ni l'écran : un adaptateur " +
        "(`.adapter.ts`) les relie à l'extérieur. Passe ce qui manque en " +
        "paramètre, ou déclare-le dans un port.",
    ).toEqual([]);
  });
});
