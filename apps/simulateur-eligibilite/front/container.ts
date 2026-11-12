// Le conteneur du navigateur : il instancie une fois les classes qui parlent au
// serveur, et les exporte à `main.tsx`. Rien ne s'instancie au chargement du
// module (QUAL-004) : `ServerJournal` écoute le choix du prescripteur dès sa
// création.

import type { ComponentProps } from "react";
import {
  type App,
  declarerAuServeur,
  referentielDuServeur,
  ServerApiClient,
  ServerJournal,
  StartASimulation,
} from "./socle";

type AppProps = ComponentProps<typeof App>;

export type Container = {
  serverApi: ServerApiClient;
  journal: ServerJournal;
  startASimulation: StartASimulation;
  referentiel: AppProps["referentiel"];
  declarer: AppProps["declarer"];
};

export function createContainer(): Container {
  const serverApi = new ServerApiClient();
  const journal = new ServerJournal({ api: serverApi });
  return {
    serverApi,
    journal,
    startASimulation: new StartASimulation(journal),
    referentiel: referentielDuServeur(serverApi),
    declarer: declarerAuServeur(serverApi),
  };
}
