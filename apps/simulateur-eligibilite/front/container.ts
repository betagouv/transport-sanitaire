// Le conteneur du navigateur : il instancie une fois les classes qui parlent à
// l'extérieur, et les exporte à `main.tsx`. Rien ne s'instancie au chargement du
// module (QUAL-004) : le choix du prescripteur se demande au CMS dès la
// création de Matomo et du journal, qui le partagent.

import type { ComponentProps } from "react";
import {
  type AnalyticsUseCases,
  type App,
  analyticsUseCases,
  CmsConsent,
  configFromEnv,
  DiscardingAudience,
  declarerAuServeur,
  HostPageLoad,
  loadMatomo,
  MatomoAudience,
  referentielDuServeur,
  ServerApiClient,
  ServerJournal,
} from "./socle";

type AppProps = ComponentProps<typeof App>;

export type Container = {
  serverApi: ServerApiClient;
  analytics: AnalyticsUseCases;
  referentiel: AppProps["referentiel"];
  declarer: AppProps["declarer"];
};

export function createContainer(): Container {
  const serverApi = new ServerApiClient();
  const consent = new CmsConsent();
  const journal = new ServerJournal(consent, { api: serverApi });
  return {
    serverApi,
    analytics: analyticsUseCases(
      audienceOf(consent),
      journal,
      new HostPageLoad(),
    ),
    referentiel: referentielDuServeur(serverApi),
    declarer: declarerAuServeur(serverApi),
  };
}

// Matomo ne mesure qu'en build de prod, ou en local sur demande
// (`configFromEnv`). Il ne charge matomo.js qu'au suivi accepté.
function audienceOf(consent: CmsConsent) {
  const config = configFromEnv();
  return config.enabled
    ? new MatomoAudience(config, consent, loadMatomo)
    : new DiscardingAudience();
}
