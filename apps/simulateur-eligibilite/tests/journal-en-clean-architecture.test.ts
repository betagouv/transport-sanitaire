// La clean architecture du journal des parcours (ADR-7 de
// docs/knowledge/adr/analytics.md), rendue exécutable. Comme dans
// `architecture.test.ts`, chaque règle donne son pourquoi dans son message
// d'échec.

import { describe, expect, it } from "vitest";
import { importsDe, sources } from "./inspection-des-sources";

// Le journal, côté serveur et côté écran.
const JOURNAL = ["server/journal", "front/socle/analytics"];

// Son domaine : les entités, les use cases et les ports.
const duDomaine = (cible: string) =>
  /\.(entity|usecase|port)(\.ts)?$/.test(cible);

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
        "(ADR-7 de docs/knowledge/adr/analytics.md) : Grist n'est que son premier " +
        "adaptateur, et changera. Le reste du journal ne connaît ni Grist ni ses " +
        "types : passe par le port, ou ajoute ce qui manque à l'adaptateur.",
    ).toEqual([]);
  });

  it("le domaine du journal ne dépend que de lui-même et du contrat", () => {
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
        "forment le domaine du journal (ADR-7 de docs/knowledge/adr/analytics.md). " +
        "Ils ne connaissent ni HTTP, ni Grist, ni l'écran : un adaptateur " +
        "(`.adapter.ts`) les relie à l'extérieur. Passe ce qui manque en " +
        "paramètre, ou déclare-le dans un port.",
    ).toEqual([]);
  });
});
