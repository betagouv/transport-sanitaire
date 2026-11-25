// Démarre une app Express sur un référentiel et un journal injectés, sans
// mock : les tests l'interrogent par de vraies requêtes HTTP, sur un port
// éphémère.

import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import type { WriteLimits } from "../../../server/api-guard.middleware.ts";
import { creerApp } from "../../../server/app.ts";
import { createContainer } from "../../../server/container.ts";
import type { Journal } from "../../../server/journal/journal.port.ts";
import type { JournalPages } from "../../../server/journal/journal-pages.port.ts";
import { MemoryJournal } from "../../../server/journal/memory-journal.adapter.ts";
import type { Referentiel } from "../../../shared/referentiel.port.ts";
import { BUILD } from "../journal/evenements.ts";

export type AppDeTest = { base: string; close: () => Promise<void> };

export async function demarrer(
  referentiel: Referentiel,
  {
    journal = new MemoryJournal(),
    journalReadToken,
    writeLimits,
  }: {
    journal?: Journal & JournalPages;
    journalReadToken?: string;
    writeLimits?: WriteLimits;
  } = {},
): Promise<AppDeTest> {
  const app = creerApp(
    createContainer({
      referentiel,
      journal,
      journalReadToken,
      environment: "test",
      build: BUILD,
    }),
    { writeLimits },
  );
  const srv = await new Promise<Server>((resolve) => {
    // Express 5 passe une éventuelle erreur au callback. `resolve` n'en veut pas.
    const s = app.listen(0, () => resolve(s));
  });
  const { port } = srv.address() as AddressInfo;
  return {
    base: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise<void>((resolve, reject) =>
        srv.close((err) => (err ? reject(err) : resolve())),
      ),
  };
}

export async function postTo(
  base: string,
  path: string,
  body: unknown,
  headers: Record<string, string> = {},
) {
  const res = await fetch(base + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await corpsJson(res) };
}

export async function getFrom(
  base: string,
  path: string,
  headers: Record<string, string> = {},
) {
  const res = await fetch(base + path, { headers });
  return { status: res.status, body: await res.json() };
}

// Une réponse 204 n'a pas de corps : `res.json()` y lèverait.
async function corpsJson(res: Response) {
  const texte = await res.text();
  return texte ? JSON.parse(texte) : undefined;
}
