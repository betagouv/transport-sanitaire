// @vitest-environment node
//
// La couverture de la collecte (ADR-15) : chaque heure, le serveur écrit dans
// le journal un signe de vie. Une heure sans lui ressort « indisponible »,
// pas « zéro ».

import { afterEach, describe, expect, it } from "vitest";
import { GristApiClient } from "../../../server/grist/grist-api.client.ts";
import { GristJournal } from "../../../server/journal/grist-journal.adapter.ts";
import type { Journal } from "../../../server/journal/journal.port.ts";
import { MemoryJournal } from "../../../server/journal/memory-journal.adapter.ts";
import { ReportAlive } from "../../../server/journal/report-alive.usecase.ts";
import { demarrerGrist, type GristDeTest } from "../server/grist-de-test.ts";
import { BUILD } from "./evenements.ts";

const a = (heure: string) => new Date(`2026-11-13T${heure}:00.000Z`);

const signeDeVie = (journal: Journal, build = BUILD) =>
  new ReportAlive(journal, build, "simulateur");

describe("le signe de vie de la collecte", () => {
  it("dit l'heure, la version et le commit de l'app servie", async () => {
    const journal = new MemoryJournal();

    await signeDeVie(journal).execute(a("14:20"));

    const entree = await journal.find("alive:2026-11-13T14:0.8.0:f30aafe");
    expect(entree?.event).toEqual({
      event_id: "alive:2026-11-13T14:0.8.0:f30aafe",
      type: "alive",
      occurred_at: "2026-11-13T14:20:00.000Z",
      app_version: "0.8.0",
      commit_sha: "f30aafe",
    });
    expect(entree?.environment).toBe("simulateur");
  });

  it("deux serveurs de la même version n'en écrivent qu'un par heure", async () => {
    const journal = new MemoryJournal();
    await signeDeVie(journal).execute(a("14:20"));

    await signeDeVie(journal).execute(a("14:50"));

    const entree = await journal.find("alive:2026-11-13T14:0.8.0:f30aafe");
    expect(entree?.event.occurred_at).toBe("2026-11-13T14:20:00.000Z");
    expect(journal.collisions).toEqual([]);
  });

  it("une version déployée en cours d'heure a le sien, même sans simulation", async () => {
    const journal = new MemoryJournal();
    await signeDeVie(journal).execute(a("14:20"));
    const nouvelle = { app_version: "0.9.0", commit_sha: "a1b2c3d" };

    await signeDeVie(journal, nouvelle).execute(a("14:40"));

    expect(
      await journal.find("alive:2026-11-13T14:0.8.0:f30aafe"),
    ).toBeTruthy();
    expect(
      await journal.find("alive:2026-11-13T14:0.9.0:a1b2c3d"),
    ).toBeTruthy();
  });

  it("l'heure suivante a le sien", async () => {
    const journal = new MemoryJournal();
    await signeDeVie(journal).execute(a("14:20"));

    await signeDeVie(journal).execute(a("15:00"));

    expect(
      await journal.find("alive:2026-11-13T15:0.8.0:f30aafe"),
    ).toBeTruthy();
  });
});

describe("le signe de vie dans Grist", () => {
  let grist: GristDeTest;
  afterEach(() => grist.close());

  const journalSur = ({ docUrl }: GristDeTest) =>
    new GristJournal(new GristApiClient({ docUrl, cleApi: "test" }));

  it("s'écrit dans la table des événements, sans simulation", async () => {
    grist = await demarrerGrist({});

    await signeDeVie(journalSur(grist)).execute(a("14:20"));

    expect(grist.tables.Evenements?.map((l) => l.fields)).toEqual([
      expect.objectContaining({
        event_id: "alive:2026-11-13T14:0.8.0:f30aafe",
        type: "alive",
        simulation_id: null,
        sequence: null,
      }),
    ]);
  });

  it("manque quand le journal n'écrit plus", async () => {
    grist = await demarrerGrist({});
    const journal = journalSur(grist);
    await grist.close();

    await expect(signeDeVie(journal).execute(a("14:20"))).rejects.toThrow();

    grist = await demarrerGrist({});
  });
});
