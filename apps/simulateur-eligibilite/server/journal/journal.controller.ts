// Les routes du journal des parcours, montées sous `/api`. La collecte valide
// le contrat, confie l'événement au use case, et traduit son issue en statut.
// Un envoi refusé laisse sa raison dans les traces, sans son contenu.
// Elle n'accuse réception qu'une fois l'événement écrit. Le signe de vie répond
// à une sonde externe : 200 si la collecte écrit, 503 sinon.

import express, { type Request, type Response, type Router } from "express";
import {
  explainARefusal,
  parseAnAnalyticsEvent,
} from "../../shared/analytics/event-schema.ts";
import type { CheckAlive } from "./check-alive.usecase.ts";
import type { CollectAnEvent, Collected } from "./collect-an-event.usecase.ts";

export class JournalController {
  readonly #collectAnEvent: CollectAnEvent;
  readonly #checkAlive: CheckAlive;

  constructor(collectAnEvent: CollectAnEvent, checkAlive: CheckAlive) {
    this.#collectAnEvent = collectAnEvent;
    this.#checkAlive = checkAlive;
  }

  /** Les routes du journal, à monter sous `/api`. */
  routes(): Router {
    const router = express.Router();
    router.post("/journal/v1/events", (req, res) => this.#collect(req, res));
    router.get("/journal/v1/alive", (_req, res) => this.#alive(res));
    return router;
  }

  // Un journal qui ne répond pas vaut un signe de vie qui manque : la sonde
  // alerte dans les deux cas.
  #alive(res: Response): void {
    this.#checkAlive.execute(new Date()).then(
      (alive) => res.status(alive ? 200 : 503).json({ alive }),
      (err: unknown) => {
        console.error("[simulateur] journal indisponible:", err);
        res.status(503).json({ alive: false });
      },
    );
  }

  #collect(req: Request, res: Response): void {
    const event = parseAnAnalyticsEvent(req.body);
    if (!event) {
      const reason = explainARefusal(req.body);
      console.warn(`[simulateur] journal : envoi refusé, ${reason}`);
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

// Un renvoi est un succès : le navigateur n'a pas à le savoir. Une collision,
// ou un événement hors du référentiel, est une erreur du client, qu'il ne
// réessaie pas.
function respond(res: Response, collected: Collected) {
  if (collected === "quarantined") {
    console.warn("[simulateur] journal : rattachement hors du référentiel");
    res.status(422).json({ error: "rattachement hors du référentiel" });
    return;
  }
  if (collected === "collision") {
    console.warn("[simulateur] journal : même identité, autre contenu");
    res.status(409).json({ error: "identifiant déjà pris" });
    return;
  }
  res.status(204).end();
}
