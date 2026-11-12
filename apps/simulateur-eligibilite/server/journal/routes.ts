// La route de collecte du journal des parcours, montée sous `/api`. Elle
// n'accuse réception qu'une fois l'événement écrit.

import express, { type Request, type Response, type Router } from "express";
import { parseAnAnalyticsEvent } from "../../shared/analytics/event-schema.ts";
import { type Collected, collectAnEvent } from "./collect-an-event.ts";
import type { Journal } from "./journal.ts";

export function journalRoutes(journal: Journal, environment: string): Router {
  const router = express.Router();
  router.post("/journal/v1/events", (req: Request, res: Response) => {
    const event = parseAnAnalyticsEvent(req.body);
    if (!event) {
      res.status(400).json({ error: "événement hors contrat" });
      return;
    }
    collectAnEvent(journal, event, environment).then(
      (collected) => respond(res, collected),
      (err: unknown) => {
        console.error("[simulateur] journal indisponible:", err);
        res.status(503).json({ error: "journal indisponible" });
      },
    );
  });
  return router;
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
