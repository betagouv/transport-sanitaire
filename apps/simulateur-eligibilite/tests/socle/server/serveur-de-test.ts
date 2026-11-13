// Démarre une app Express sur un référentiel et un journal injectés, sans
// mock : les tests l'interrogent par de vraies requêtes HTTP, sur un port
// éphémère.

import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { creerApp } from "../../../server/app.ts";
import { createContainer } from "../../../server/container.ts";
import type { Journal } from "../../../server/journal/journal.port.ts";
import { MemoryJournal } from "../../../server/journal/memory-journal.adapter.ts";
import type { Referentiel } from "../../../shared/referentiel.ts";
import { BUILD } from "../journal/evenements.ts";

export type AppDeTest = { base: string; close: () => Promise<void> };

export async function demarrer(
  referentiel: Referentiel,
  { journal = new MemoryJournal() }: { journal?: Journal } = {},
): Promise<AppDeTest> {
  const app = creerApp(
    createContainer({
      referentiel,
      journal,
      environment: "test",
      build: BUILD,
    }),
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

export async function postTo(base: string, path: string, body: unknown) {
  const res = await fetch(base + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await corpsJson(res) };
}

export async function getFrom(base: string, path: string) {
  const res = await fetch(base + path);
  return { status: res.status, body: await res.json() };
}

// Une réponse 204 n'a pas de corps : `res.json()` y lèverait.
async function corpsJson(res: Response) {
  const texte = await res.text();
  return texte ? JSON.parse(texte) : undefined;
}
