// La garde de l'API. L'app est publique et anonyme : on ne peut pas réserver
// l'API au seul front, puisqu'un script refait tout ce que fait le navigateur.
// La garde rend l'abus coûteux et borne ses dégâts (#451).
//
// - Un POST venu d'une autre origine est refusé : un autre site ne peut pas
//   écrire chez nous depuis le navigateur de ses visiteurs. Sans en-tête
//   `Origin` (un script, `curl`), la requête passe, et seule la limite de
//   débit la borne.
// - Chaque écriture est limitée par IP et par minute. Les limites sont
//   larges : un hôpital met beaucoup de postes derrière une seule IP.

import type { Express, NextFunction, Request, Response } from "express";
import { rateLimit } from "express-rate-limit";

/** Le nombre d'écritures admises par IP et par minute, route par route. */
export type WriteLimits = { rattachement: number; journal: number };

const WRITE_LIMITS: WriteLimits = { rattachement: 60, journal: 600 };

export class ApiGuard {
  readonly #limits: WriteLimits;

  constructor(limits: WriteLimits = WRITE_LIMITS) {
    this.#limits = limits;
  }

  /** Pose la garde, avant les routes de l'API. */
  mountOn(app: Express): void {
    // Scalingo met un routeur devant l'app : l'IP du client est la dernière
    // qu'il ajoute à `X-Forwarded-For`.
    app.set("trust proxy", 1);
    app.use("/api", refuseOtherOrigins);
    app.post("/api/rattachement", perMinute(this.#limits.rattachement));
    app.post("/api/journal/v1/events", perMinute(this.#limits.journal));
  }
}

// ---- implémentation ----

function refuseOtherOrigins(req: Request, res: Response, next: NextFunction) {
  const origin = req.get("origin");
  if (req.method !== "POST" || origin === undefined || sameHost(origin, req)) {
    next();
    return;
  }
  res.status(403).json({ error: "origine refusée" });
}

// `req.host` lit `X-Forwarded-Host` derrière le routeur, `Host` sinon. Une
// origine `null` (iframe isolée, fichier local) n'est pas la nôtre.
function sameHost(origin: string, req: Request): boolean {
  return URL.canParse(origin) && new URL(origin).host === req.host;
}

function perMinute(limit: number) {
  return rateLimit({
    windowMs: 60_000,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "trop de requêtes" },
  });
}
