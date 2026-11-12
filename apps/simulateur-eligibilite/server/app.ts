// L'app Express. Elle monte l'API du rattachement et la collecte du journal
// sous `/api`, puis sert le front construit par Vite.
//
// `creerApp` reçoit le `Referentiel` et le `Journal` en paramètre : les tests
// passent le snapshot et le journal en mémoire, sans mock.

import express, { type Express } from "express";
import type { Referentiel } from "../shared/referentiel.ts";
import { CollectAnEvent } from "./journal/collect-an-event.usecase.ts";
import type { Journal } from "./journal/journal.port.ts";
import { journalRoutes } from "./journal/journal-routes.adapter.ts";
import { rattachementRoutes } from "./rattachement/routes.ts";

export type AppOptions = {
  /** Où va le journal des parcours. */
  journal: Journal;
  /** L'environnement écrit avec chaque événement : production, staging… */
  environment: string;
  /** Répertoire du build front à servir (absent en test). */
  dossierDist?: string;
};

export function creerApp(
  referentiel: Referentiel,
  { journal, environment, dossierDist }: AppOptions,
): Express {
  const app = express();
  app.use(express.json());
  interdireIndexation(app);

  app.use("/api", rattachementRoutes(referentiel));
  app.use("/api", journalRoutes(new CollectAnEvent(journal, environment)));
  // Toute autre route sous /api rend un 404 JSON, pour éviter de servir
  // index.html.
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "route inconnue" });
  });

  // Front statique + repli SPA vers index.html.
  if (dossierDist) {
    app.use(express.static(dossierDist));
    app.use((_req, res) => {
      res.sendFile("index.html", { root: dossierDist });
    });
  }

  return app;
}

// ---- implémentation ----

// L'app est embarquée en iframe dans le CMS. Pour les moteurs de recherche, la
// page de référence est celle du CMS. L'en-tête est posé sur toutes les réponses
// et doublé d'un robots.txt, sans dépendre du build front.
function interdireIndexation(app: Express) {
  app.use((_req, res, next) => {
    res.setHeader("X-Robots-Tag", "noindex, nofollow");
    next();
  });
  app.get("/robots.txt", (_req, res) => {
    res.type("text/plain").send("User-agent: *\nDisallow: /\n");
  });
}
