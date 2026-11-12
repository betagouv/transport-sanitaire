// L'envoi d'un événement au journal des parcours, contre le vrai serveur de
// test. Son journal peut être indisponible : la route répond alors 503, comme
// quand Grist ne répond pas. Voir docs/knowledge/adr/analytics.md, ADR-6.

import { afterEach, describe, expect, it } from "vitest";
import { sendToTheJournal } from "../../../front/socle/analytics/send-to-the-journal";
import type { Journal } from "../../../server/journal/journal.ts";
import { memoryJournal } from "../../../server/journal/memory-journal.ts";
import type { AnalyticsEvent } from "../../../shared/analytics/analytics-event.ts";
import { snapshotReferentiel } from "../../../shared/referentiel.ts";
import { simulationStarted } from "../journal/evenements.ts";
import { type AppDeTest, demarrer } from "../server/serveur-de-test.ts";

let app: AppDeTest;
afterEach(async () => {
  await app.close();
  document.body.innerHTML = "";
});

const evenement = simulationStarted;

// La page de test passe sur l'origine du serveur, comme l'app servie par lui :
// happy-dom applique la règle de même origine à `fetch`.
async function journalDuServeur(journal: Journal = memoryJournal()) {
  app = await demarrer(snapshotReferentiel, { journal });
  (window as unknown as HappyDomWindow).happyDOM.setURL(app.base);
  return journal;
}

type HappyDomWindow = { happyDOM: { setURL: (url: string) => void } };

// Un journal qui échoue à ses `fois` premières écritures.
function indisponible(journal: Journal, fois: number): Journal {
  let echecs = fois;
  return {
    ...journal,
    append: async (recorded) => {
      if (echecs-- > 0) throw new Error("Grist ne répond pas");
      return journal.append(recorded);
    },
  };
}

describe("envoi au journal des parcours", () => {
  it("réessaie quand le journal ne répond pas, puis l'écrit", async () => {
    const journal = await journalDuServeur(indisponible(memoryJournal(), 2));

    await sendToTheJournal({ delays: [0, 0, 0, 0] })(evenement);

    expect((await journal.find("s-1:1"))?.event).toEqual(evenement);
  });

  it("ne réessaie pas un événement que le contrat refuse", async () => {
    const journal = await journalDuServeur();
    const horsContrat = { ...evenement, reponse: "domicile" } as AnalyticsEvent;

    // Une seule nouvelle tentative ferait attendre une minute.
    await sendToTheJournal({ delays: [60_000] })(horsContrat);

    expect(await journal.find("s-1:1")).toBeUndefined();
  });

  it("n'envoie rien quand le prescripteur s'oppose à la mesure", async () => {
    const journal = await journalDuServeur();
    const parent = pageQuiRefuse();

    await sendToTheJournal({ parent })(evenement);

    expect(await journal.find("s-1:1")).toBeUndefined();
  });
});

// La page du CMS, dans une vraie iframe : elle répond « refus » à la demande.
function pageQuiRefuse(): Window {
  const iframe = document.createElement("iframe");
  document.body.appendChild(iframe);
  const parent = iframe.contentWindow as Window;
  parent.addEventListener("message", () =>
    window.dispatchEvent(
      new MessageEvent("message", {
        data: { type: "statistiques-simulateur:choix", suivi: false },
        source: parent,
      }),
    ),
  );
  return parent;
}
