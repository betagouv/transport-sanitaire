// Un Grist en mémoire, servi en HTTP sur un port éphémère : la partie de l'API
// REST que `lignes-grist.ts` utilise (lire des lignes, filtrées ou non, et en
// créer). Les tests de la source Grist y lisent ce qui a été écrit.

import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import express from "express";

export type Ligne = { id: number; fields: Record<string, unknown> };

export type GristDeTest = {
  docUrl: string;
  tables: Record<string, Ligne[]>;
  close: () => Promise<void>;
};

export async function demarrerGrist(
  tables: Record<string, Ligne[]>,
): Promise<GristDeTest> {
  const app = express();
  app.use(express.json());
  app.get("/tables/:table/records", (req, res) => {
    const filtre = String(req.query.filter ?? "");
    res.json({ records: filtrer(tables[req.params.table] ?? [], filtre) });
  });
  app.post("/tables/:table/records", (req, res) => {
    const table = tables[req.params.table] ?? [];
    tables[req.params.table] = table;
    const { records } = req.body as {
      records: Array<{ fields: Ligne["fields"] }>;
    };
    const creees = records.map(({ fields }) => {
      const ligne = { id: prochainRowId(table), fields };
      table.push(ligne);
      return { id: ligne.id };
    });
    res.json({ records: creees });
  });

  const srv = await new Promise<Server>((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const { port } = srv.address() as AddressInfo;
  return {
    docUrl: `http://127.0.0.1:${port}`,
    tables,
    close: () =>
      new Promise<void>((resolve, reject) =>
        srv.close((err) => (err ? reject(err) : resolve())),
      ),
  };
}

// ---- implémentation ----

// Le filtre Grist : `{ colonne: [valeurs acceptées] }`, toutes les colonnes à la fois.
function filtrer(lignes: Ligne[], filtre: string): Ligne[] {
  if (!filtre) return lignes;
  const criteres = JSON.parse(filtre) as Record<string, unknown[]>;
  return lignes.filter((l) =>
    Object.entries(criteres).every(([col, valeurs]) =>
      valeurs.includes(l.fields[col]),
    ),
  );
}

function prochainRowId(table: Ligne[]): number {
  return table.reduce((m, l) => Math.max(m, l.id), 0) + 1;
}
