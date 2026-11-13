// L'envoi d'un événement au journal des parcours, contre le vrai serveur de
// test. Son journal peut être indisponible : la route répond alors 503, comme
// quand Grist ne répond pas. Voir docs/knowledge/adr/analytics.md, ADR-6.

import { afterEach, describe, expect, it } from "vitest";
import { ServerJournal } from "../../../front/socle/analytics/server-journal.adapter";
import type { Journal } from "../../../server/journal/journal.port.ts";
import type { JournalEntry } from "../../../server/journal/journal-entry.entity.ts";
import { MemoryJournal } from "../../../server/journal/memory-journal.adapter.ts";
import type { AnalyticsEvent } from "../../../shared/analytics/analytics-event.ts";
import { snapshotReferentiel } from "../../../shared/referentiel.ts";
import { simulationStarted } from "../journal/evenements.ts";
import { type AppDeTest, demarrer } from "../server/serveur-de-test.ts";
import { ConsentementDeTest } from "./consentement-de-test.ts";

let app: AppDeTest;
afterEach(() => app.close());

const evenement = simulationStarted;
const suivi = new ConsentementDeTest("suivi");

// La page de test passe sur l'origine du serveur, comme l'app servie par lui :
// happy-dom applique la règle de même origine à `fetch`.
async function journalDuServeur(journal: Journal = new MemoryJournal()) {
  app = await demarrer(snapshotReferentiel, { journal });
  (window as unknown as HappyDomWindow).happyDOM.setURL(app.base);
  return journal;
}

type HappyDomWindow = { happyDOM: { setURL: (url: string) => void } };

// Un journal qui échoue à ses `echecs` premières écritures.
class JournalIndisponible extends MemoryJournal {
  #echecs: number;

  constructor(echecs: number) {
    super();
    this.#echecs = echecs;
  }

  override async append(entry: JournalEntry): Promise<void> {
    if (this.#echecs-- > 0) throw new Error("Grist ne répond pas");
    return super.append(entry);
  }
}

describe("envoi au journal des parcours", () => {
  it("réessaie quand le journal ne répond pas, puis l'écrit", async () => {
    const journal = await journalDuServeur(new JournalIndisponible(2));

    await new ServerJournal(suivi, { delays: [0, 0, 0, 0] }).record(evenement);

    expect((await journal.find("s-1:1"))?.event).toEqual(evenement);
  });

  it("ne réessaie pas un événement que le contrat refuse", async () => {
    const journal = await journalDuServeur();
    const horsContrat = { ...evenement, reponse: "domicile" } as AnalyticsEvent;

    // Une seule nouvelle tentative ferait attendre une minute.
    await new ServerJournal(suivi, { delays: [60_000] }).record(horsContrat);

    expect(await journal.find("s-1:1")).toBeUndefined();
  });

  it("n'envoie rien quand le prescripteur s'oppose à la mesure", async () => {
    const journal = await journalDuServeur();
    const refus = new ConsentementDeTest("refus");

    await new ServerJournal(refus).record(evenement);

    expect(await journal.find("s-1:1")).toBeUndefined();
  });
});
