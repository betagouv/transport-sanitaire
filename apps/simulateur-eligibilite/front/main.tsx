// Point d'entrée du navigateur : démarre le traceur, puis monte l'app React
// sur ses modèles. C'est le seul fichier qui importe à la fois le socle et un
// modèle, et le seul qui les nomme.
//
// Un modèle se charge à la demande, le premier pendant l'écran de
// rattachement : il reste hors du chunk d'entrée.

import { startReactDsfr } from "@codegouvfr/react-dsfr/spa";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./socle/app/dsfr-overrides.css";
import {
  App,
  applyTheme,
  configFromEnv,
  followHostTheme,
  initAnalytics,
  initJournal,
  loadMatomo,
  type Models,
  ServerJournal,
} from "./socle";

// Clair par défaut : le thème est celui de la page qui embarque l'app, qui le
// transmet dès qu'on le lui demande, puis à chaque changement (#342).
startReactDsfr({ defaultColorScheme: "light" });
followHostTheme(applyTheme);

// Prépare le traceur au démarrage, sans cookie. Il demande au CMS le choix du
// prescripteur et ne charge Matomo que si le suivi est accepté. Le service est
// rangé en session au rattachement, puis lu à chaque événement.
initAnalytics(configFromEnv(), { load: loadMatomo });

// Le parcours part aussi au journal du backend, sous le même choix du
// prescripteur (ADR-6 d'analytics.md).
initJournal(new ServerJournal());

// Le premier s'ouvre au démarrage. À plusieurs, on peut en changer depuis les
// developer tools, donc en local seulement.
const models: Models = [
  {
    label: "Modèle de l’éditeur",
    load: () => import("./models/eligibilite").then((module) => module.model),
  },
  {
    label: "Modèle de démonstration",
    load: () => import("./models/fake").then((module) => module.model),
  },
];

const racine = document.getElementById("root");
if (!racine) throw new Error("Élément #root absent de index.html.");

createRoot(racine).render(
  <StrictMode>
    <App models={models} />
  </StrictMode>,
);
