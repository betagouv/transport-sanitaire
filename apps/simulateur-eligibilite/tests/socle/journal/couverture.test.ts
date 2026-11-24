// @vitest-environment node
//
// La couverture de la collecte : chaque heure, le serveur écrit dans le journal
// un signe de vie. Une heure sans lui ressort « indisponible », pas « zéro ».
// Une sonde externe demande au serveur s'il y est.

import { PGlite } from "@electric-sql/pglite";
import { afterEach, describe, expect, it } from "vitest";
import type { Journal } from "../../../server/journal/journal.port.ts";
import { MemoryJournal } from "../../../server/journal/memory-journal.adapter.ts";
import { PostgresJournal } from "../../../server/journal/postgres-journal.adapter.ts";
import { ReportAlive } from "../../../server/journal/report-alive.usecase.ts";
import { snapshotReferentiel } from "../../../shared/referentiel.ts";
import {
  type AppDeTest,
  demarrer,
  getFrom,
} from "../server/serveur-de-test.ts";
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

describe("le signe de vie dans PostgreSQL", () => {
  let base: PGlite;
  afterEach(async () => {
    if (!base.closed) await base.close();
  });

  it("s'écrit dans la table des événements, sans simulation", async () => {
    base = new PGlite();

    await signeDeVie(new PostgresJournal(base)).execute(a("14:20"));

    const { rows } = await base.query(
      "SELECT event_id, type, simulation_id, sequence FROM journal_events",
    );
    expect(rows).toEqual([
      {
        event_id: "alive:2026-11-13T14:0.8.0:f30aafe",
        type: "alive",
        simulation_id: null,
        sequence: null,
      },
    ]);
  });

  it("manque quand le journal n'écrit plus", async () => {
    base = new PGlite();
    const journal = new PostgresJournal(base);
    await base.close();

    await expect(signeDeVie(journal).execute(a("14:20"))).rejects.toThrow();
  });
});

describe("la sonde du signe de vie", () => {
  let app: AppDeTest;
  afterEach(() => app.close());

  const HEURE = 60 * 60 * 1000;
  const ilYA = (heures: number) => new Date(Date.now() - heures * HEURE);

  // Le serveur de test tourne sur `BUILD`, dans l'environnement « test ».
  async function sonde(journal: MemoryJournal) {
    app = await demarrer(snapshotReferentiel, { journal });
    return getFrom(app.base, "/api/journal/v1/alive");
  }

  it("répond 200 quand le signe de vie de l'heure est écrit", async () => {
    const journal = new MemoryJournal();
    await signeDeVie(journal).execute(new Date());

    expect(await sonde(journal)).toEqual({
      status: 200,
      body: { alive: true },
    });
  });

  it("se contente du signe de vie de l'heure d'avant", async () => {
    const journal = new MemoryJournal();
    await signeDeVie(journal).execute(ilYA(1));

    expect((await sonde(journal)).status).toBe(200);
  });

  it("répond 503 quand le dernier signe de vie a deux heures", async () => {
    const journal = new MemoryJournal();
    await signeDeVie(journal).execute(ilYA(2));

    expect(await sonde(journal)).toEqual({
      status: 503,
      body: { alive: false },
    });
  });

  it("répond 503 quand le journal ne répond pas", async () => {
    class JournalMuet extends MemoryJournal {
      override async find(): Promise<never> {
        throw new Error("la base ne répond pas");
      }
    }

    expect((await sonde(new JournalMuet())).status).toBe(503);
  });
});
