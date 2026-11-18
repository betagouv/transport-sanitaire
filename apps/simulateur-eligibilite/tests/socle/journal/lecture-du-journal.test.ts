// @vitest-environment node
//
// La lecture du journal (#521), sur le vrai serveur : le tableau de bord lit
// les entrées page par page, avec le jeton partagé. Sans jeton configuré, la
// route n'existe pas.

import { afterEach, describe, expect, it } from "vitest";
import { JournalEntry } from "../../../server/journal/journal-entry.entity.ts";
import { MemoryJournal } from "../../../server/journal/memory-journal.adapter.ts";
import { snapshotReferentiel } from "../../../shared/referentiel.ts";
import {
  type AppDeTest,
  demarrer,
  getFrom,
} from "../server/serveur-de-test.ts";
import { simulationStarted } from "./evenements.ts";

let app: AppDeTest;
afterEach(() => app.close());

const JETON = "un-jeton-de-test-d-au-moins-32-caracteres";
const AVEC_JETON = { authorization: `Bearer ${JETON}` };

const entree = (n: number) =>
  new JournalEntry(
    { ...simulationStarted, event_id: `s-1:${n}`, sequence: n },
    "2026-11-18T09:00:00.000Z",
    "production",
    "f30aafe",
  );

async function journalDe(n: number, journalReadToken: string | undefined) {
  const journal = new MemoryJournal();
  for (let i = 1; i <= n; i++) await journal.append(entree(i));
  app = await demarrer(snapshotReferentiel, { journal, journalReadToken });
}

const lire = (query: string, headers: Record<string, string> = AVEC_JETON) =>
  getFrom(app.base, `/api/journal/v1/events${query}`, headers);

const ids = (body: { entries: { event: { event_id: string } }[] }) =>
  body.entries.map((e) => e.event.event_id);

describe("la lecture du journal", () => {
  it("donne les entrées page par page, sans trou ni doublon", async () => {
    await journalDe(5, JETON);

    const premiere = await lire("?limit=2");
    const deuxieme = await lire(`?limit=2&after=${premiere.body.next}`);
    const derniere = await lire(`?limit=2&after=${deuxieme.body.next}`);

    expect([premiere, deuxieme, derniere].map(({ body }) => ids(body))).toEqual(
      [["s-1:1", "s-1:2"], ["s-1:3", "s-1:4"], ["s-1:5"]],
    );
    expect(derniere.body.next).toBeNull();
  });

  it("donne chaque entrée avec ce que le serveur a noté à sa réception", async () => {
    await journalDe(1, JETON);

    expect((await lire("")).body.entries).toEqual([
      {
        received_at: "2026-11-18T09:00:00.000Z",
        environment: "production",
        commit_sha: "f30aafe",
        schema_version: entree(1).schemaVersion,
        event: entree(1).event,
      },
    ]);
  });

  it("refuse une lecture sans le bon jeton", async () => {
    await journalDe(1, JETON);

    expect((await lire("", {})).status).toBe(401);
    expect((await lire("", { authorization: "Bearer autre" })).status).toBe(
      401,
    );
    expect((await lire("", { authorization: JETON })).status).toBe(401);
  });

  it("refuse un curseur ou une taille de page hors des bornes", async () => {
    await journalDe(1, JETON);

    expect((await lire("?after=abc")).status).toBe(400);
    expect((await lire("?limit=0")).status).toBe(400);
    expect((await lire("?limit=1001")).status).toBe(400);
  });

  it("n'existe pas sans jeton configuré", async () => {
    await journalDe(1, undefined);

    expect((await lire("")).status).toBe(404);
  });
});
