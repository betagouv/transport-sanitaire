// L'app Express. Elle monte l'API du rattachement et la collecte du journal
// sous `/api`, derrière la garde de `protect-the-api.ts`, puis sert le front
// construit par Vite.
//
// `creerApp` reçoit le conteneur (`container.ts`) : les tests le créent sur le
// snapshot et le journal en mémoire, sans mock.

import express, { type Express } from "express";
import type { Container } from "./container.ts";
import { ApiGuard, type WriteLimits } from "./protect-the-api.ts";
import { rattachementRoutes } from "./rattachement/routes.ts";

export type AppOptions = {
  /** Répertoire du build front à servir (absent en test). */
  dossierDist?: string;
  /** Les écritures admises par IP et par minute (des limites basses en test). */
  writeLimits?: WriteLimits;
};

export function creerApp(
  { referentiel, journalController }: Container,
  { dossierDist, writeLimits }: AppOptions = {},
): Express {
  const app = express();
  // Un événement ou un rattachement tient en quelques kilo-octets.
  app.use(express.json({ limit: "32kb" }));
  interdireIndexation(app);
  new ApiGuard(writeLimits).mountOn(app);

  app.use("/api", rattachementRoutes(referentiel));
  app.use("/api", journalController.routes());
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
