// La lecture du journal des parcours, montée sous `/api` pour le tableau de
// bord qui l'exploite : `GET /api/journal/v1/events?after=<curseur>&limit=<n>`.
// Le journal porte l'établissement et le service de chaque parcours : la
// lecture exige le jeton partagé, `Authorization: Bearer <jeton>`. Sans jeton
// configuré, le conteneur ne monte pas cette route.

import { createHash, timingSafeEqual } from "node:crypto";
import express, { type Request, type Response, type Router } from "express";
import { z } from "zod";
import type { JournalEntry } from "./journal-entry.entity.ts";
import type { JournalPage } from "./journal-pages.port.ts";
import { MAX_PAGE_SIZE, type ReadAPage } from "./read-a-page.usecase.ts";

export class JournalReadingController {
  readonly #readAPage: ReadAPage;
  readonly #token: Buffer;

  constructor(readAPage: ReadAPage, token: string) {
    this.#readAPage = readAPage;
    this.#token = digest(token);
  }

  /** La route de lecture, à monter sous `/api`. */
  routes(): Router {
    const router = express.Router();
    router.get("/journal/v1/events", (req, res) => this.#read(req, res));
    return router;
  }

  #read(req: Request, res: Response): void {
    if (!this.#authorized(req)) {
      res.status(401).json({ error: "jeton manquant ou invalide" });
      return;
    }
    const query = QUERY.safeParse(req.query);
    if (!query.success) {
      res.status(400).json({ error: "paramètres de lecture invalides" });
      return;
    }
    this.#readAPage.execute(query.data.after, query.data.limit).then(
      (page) => res.json(bodyOf(page)),
      (err: unknown) => {
        console.error("[simulateur] journal illisible:", err);
        res.status(503).json({ error: "journal indisponible" });
      },
    );
  }

  // Les empreintes ont toujours la même taille : la comparaison prend le même
  // temps, que le jeton soit proche ou non.
  #authorized(req: Request): boolean {
    const [scheme, token] = (req.get("authorization") ?? "").split(" ");
    return (
      scheme === "Bearer" &&
      token !== undefined &&
      timingSafeEqual(digest(token), this.#token)
    );
  }
}

// ---- implémentation ----

const QUERY = z.object({
  after: z
    .string()
    .regex(/^\d{1,18}$/)
    .optional(),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(100),
});

function digest(token: string): Buffer {
  return createHash("sha256").update(token).digest();
}

function bodyOf({ entries, next }: JournalPage) {
  return { entries: entries.map(entryOf), next };
}

function entryOf(entry: JournalEntry) {
  return {
    received_at: entry.receivedAt,
    environment: entry.environment,
    commit_sha: entry.commitSha,
    schema_version: entry.schemaVersion,
    event: entry.event,
  };
}
