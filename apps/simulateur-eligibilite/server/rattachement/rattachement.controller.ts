// Les routes du rattachement, montées sous `/api` : lire le référentiel, et
// y enregistrer une saisie libre.

import express, { type Request, type Response, type Router } from "express";
import {
  enrichitLeReferentiel,
  nomsDansLaLimite,
  type RattachementSaisi,
  saisieComplete,
} from "../../shared/rattachement-saisi.vo.ts";
import type { Referentiel } from "../../shared/referentiel.port.ts";

export function rattachementRoutes(referentiel: Referentiel): Router {
  const router = express.Router();

  router.get(
    "/etablissements",
    handle(async (_req, res) => {
      res.json(await referentiel.listerEtablissements());
    }),
  );
  router.get("/services", handle(servicesDe(referentiel)));
  router.post("/rattachement", handle(rattacher(referentiel)));

  return router;
}

// ---- implémentation ----

// Enregistre dans le référentiel la saisie libre : le service saisi sous
// « Autre », ou l'établissement saisi et son service. Donne leurs ids, que le
// front range pour le parcours. Il attend la réponse avant d'ouvrir le
// simulateur, et entre sans ids si elle échoue.
function rattacher(referentiel: Referentiel) {
  return async (req: Request, res: Response) => {
    const saisie = (req.body ?? {}) as RattachementSaisi;
    const refus = refusDe(saisie);
    if (refus) {
      res.status(400).json({ error: refus });
      return;
    }
    if (!referentiel.enrichirDepuisSaisie) {
      res.status(503).json({ error: "referentiel en lecture seule" });
      return;
    }
    res.json(await referentiel.enrichirDepuisSaisie(saisie));
  };
}

/** La saisie est recevable : rien à lui reprocher. */
type Recevable = undefined;

// Ce qui rend la saisie irrecevable, s'il y a quelque chose.
function refusDe(saisie: RattachementSaisi): string | Recevable {
  if (!saisieComplete(saisie)) return "sélection de rattachement incomplète";
  if (!nomsDansLaLimite(saisie)) return "nom saisi trop long";
  if (!enrichitLeReferentiel(saisie)) {
    return "rien à enregistrer : la sélection vient des listes";
  }
  return undefined;
}

// Les services d'un établissement : l'établissement est obligatoire en query.
function servicesDe(referentiel: Referentiel) {
  return async (req: Request, res: Response) => {
    const etabId = String(req.query.etabId ?? "");
    if (!etabId) {
      res.status(400).json({ error: "etabId requis" });
      return;
    }
    res.json(await referentiel.listerServices(etabId));
  };
}

// Enrobe un handler async pour router les rejets vers une réponse d'erreur.
function handle(handler: (req: Request, res: Response) => Promise<void>) {
  return (req: Request, res: Response) => {
    handler(req, res).catch((err: unknown) => {
      console.error("[simulateur] erreur référentiel:", err);
      res.status(502).json({ error: "referentiel indisponible" });
    });
  };
}
