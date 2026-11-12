// La route de collecte du journal des parcours, montée sous `/api` : l'entrée
// HTTP de la collecte. Elle valide le contrat, confie l'événement au use case,
// et traduit son issue en statut. Elle n'accuse réception qu'une fois
// l'événement écrit.

import express, { type Request, type Response, type Router } from "express";
import { parseAnAnalyticsEvent } from "../../shared/analytics/event-schema.ts";
import type { CollectAnEvent, Collected } from "./collect-an-event.usecase.ts";

export class JournalController {
  readonly #collectAnEvent: CollectAnEvent;

  constructor(collectAnEvent: CollectAnEvent) {
    this.#collectAnEvent = collectAnEvent;
  }

  /** Les routes du journal, à monter sous `/api`. */
  routes(): Router {
    const router = express.Router();
    router.post("/journal/v1/events", (req, res) => this.#collect(req, res));
    return router;
  }

  #collect(req: Request, res: Response): void {
    const event = parseAnAnalyticsEvent(req.body);
    if (!event) {
      res.status(400).json({ error: "événement hors contrat" });
      return;
    }
    this.#collectAnEvent.execute(event).then(
      (collected) => respond(res, collected),
      (err: unknown) => {
        console.error("[simulateur] journal indisponible:", err);
        res.status(503).json({ error: "journal indisponible" });
      },
    );
  }
}

// ---- implémentation ----

// Un renvoi est un succès : le navigateur n'a pas à le savoir. Une collision
// est une erreur du client, qu'il ne réessaie pas.
function respond(res: Response, collected: Collected) {
  if (collected === "collision") {
    console.warn("[simulateur] journal : même event_id, autre contenu");
    res.status(409).json({ error: "identifiant déjà pris" });
    return;
  }
  res.status(204).end();
}
