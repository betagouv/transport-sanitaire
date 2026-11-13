// Le conteneur du navigateur : il instancie une fois les classes qui parlent à
// l'extérieur, et les exporte à `main.tsx`. Rien ne s'instancie au chargement du
// module (QUAL-004) : le choix du prescripteur se demande au CMS dès la
// création de Matomo et du journal, qui le partagent.

import type { ComponentProps } from "react";
import {
  type App,
  type AudienceUseCases,
  CmsConsent,
  CompleteAQuestionnaire,
  configFromEnv,
  DiscardingAudience,
  declarerAuServeur,
  type JournalUseCases,
  LeaveAQuestionnaire,
  loadMatomo,
  MatomoAudience,
  PassAStep,
  ReachAnAldResult,
  referentielDuServeur,
  SelectAnIntent,
  ServerApiClient,
  ServerJournal,
  StartAQuestionnaire,
  StartASimulation,
} from "./socle";

type AppProps = ComponentProps<typeof App>;

export type Container = {
  serverApi: ServerApiClient;
  audience: AudienceUseCases;
  journal: JournalUseCases;
  referentiel: AppProps["referentiel"];
  declarer: AppProps["declarer"];
};

export function createContainer(): Container {
  const serverApi = new ServerApiClient();
  const consent = new CmsConsent();
  const journal = new ServerJournal(consent, { api: serverApi });
  return {
    serverApi,
    audience: audienceOf(consent),
    journal: {
      startASimulation: new StartASimulation(journal),
      selectAnIntent: new SelectAnIntent(journal),
    },
    referentiel: referentielDuServeur(serverApi),
    declarer: declarerAuServeur(serverApi),
  };
}

// Matomo ne mesure qu'en build de prod, ou en local sur demande
// (`configFromEnv`). Il ne charge matomo.js qu'au suivi accepté.
function audienceOf(consent: CmsConsent): AudienceUseCases {
  const config = configFromEnv();
  const audience = config.enabled
    ? new MatomoAudience(config, consent, loadMatomo)
    : new DiscardingAudience();
  return {
    startAQuestionnaire: new StartAQuestionnaire(audience),
    passAStep: new PassAStep(audience),
    completeAQuestionnaire: new CompleteAQuestionnaire(audience),
    leaveAQuestionnaire: new LeaveAQuestionnaire(audience),
    reachAnAldResult: new ReachAnAldResult(audience),
  };
}
