// La clean architecture, rendue exécutable : le sens des dépendances du socle
// (ADR-0052), puis le journal des parcours et la mesure d'audience (ADR-0043).
// Comme dans `architecture.test.ts`, chaque règle donne son pourquoi dans son
// message d'échec.

import { describe, expect, it } from "vitest";
import { importsDe, sources, texteDe } from "./inspection-des-sources";

// Le journal, côté serveur et côté écran, et la mesure d'audience.
const JOURNAL = ["server/journal", "front/socle/analytics"];

// Son domaine : les entités, les use cases et les ports.
const duDomaine = (cible: string) =>
  /\.(entity|usecase|port)(\.ts)?$/.test(cible);

// Ce que le sens des dépendances garde aujourd'hui.
const GARDES = ["core/socle"];

const estUnAdaptateur = (fichier: string) => /\.adapter(\.ts)?$/.test(fichier);

// Un index dit ce que son module promet : il peut exporter un adaptateur.
const estUnIndex = (fichier: string) => fichier.endsWith("/index.ts");

// Les paquets qu'un fichier importe : tout ce qui n'est pas un chemin relatif.
const PAQUET = /(?:from|import)\s*\(?\s*["']([^."'][^"']*)["']/g;
const paquetsDe = (fichier: string) =>
  [...texteDe(fichier).matchAll(PAQUET)].map(([, paquet]) => paquet);

describe("le sens des dépendances", () => {
  it("le domaine n'importe pas un adaptateur", () => {
    const fautifs = sources(...GARDES)
      .filter((f) => !estUnAdaptateur(f) && !estUnIndex(f))
      .flatMap((f) =>
        importsDe(f)
          .filter(estUnAdaptateur)
          .map((cible) => `${f} → ${cible}`),
      );
    expect(
      fautifs,
      "Un adaptateur (`.adapter.ts`) dépend du domaine, jamais l'inverse " +
        "(ADR-0052). Déclare ce que tu attends dans un port (`.port.ts`), et " +
        "reçois l'adaptateur en paramètre.",
    ).toEqual([]);
  });

  it("une bibliothèque externe reste derrière un port", () => {
    const fautifs = sources(...GARDES)
      .filter((f) => !estUnAdaptateur(f))
      .flatMap((f) => paquetsDe(f).map((paquet) => `${f} → ${paquet}`));
    expect(
      fautifs,
      "Seul un adaptateur (`.adapter.ts`) importe un paquet (ADR-0052) : le " +
        "domaine tient sans lui, et en changer ne touche qu'un fichier. Passe " +
        "par le port de l'adaptateur, ou écris-en un.",
    ).toEqual([]);
  });
});

describe("le journal des parcours", () => {
  it("seul l'adaptateur Grist du journal connaît Grist", () => {
    const fautifs = sources("server/journal").filter(
      (f) =>
        f !== "server/journal/grist-journal.adapter.ts" &&
        importsDe(f).some((cible) => cible.startsWith("server/grist/")),
    );
    expect(
      fautifs,
      "Le journal des parcours est derrière un port, `server/journal/journal.port.ts` " +
        "(ADR-0043) : Grist n'est que son premier " +
        "adaptateur, et changera. Le reste du journal ne connaît ni Grist ni ses " +
        "types : passe par le port, ou ajoute ce qui manque à l'adaptateur.",
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
      "Entités, use cases et ports (`.entity.ts`, `.usecase.ts`, `.port.ts`) " +
        "forment le domaine du journal et de la mesure d'audience (ADR-0043). " +
        "Ils ne connaissent ni HTTP, ni Grist, ni l'écran : un adaptateur " +
        "(`.adapter.ts`) les relie à l'extérieur. Passe ce qui manque en " +
        "paramètre, ou déclare-le dans un port.",
    ).toEqual([]);
  });
});
