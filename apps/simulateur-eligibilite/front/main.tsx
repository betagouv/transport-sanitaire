// Point d'entrée du navigateur : assemble le conteneur, puis monte l'app React
// sur ses modèles. C'est le seul fichier qui importe à la fois le socle et un
// modèle, et le seul qui les nomme.
//
// Un modèle se charge à la demande, le premier pendant l'écran de
// rattachement : il reste hors du chunk d'entrée.

import { startReactDsfr } from "@codegouvfr/react-dsfr/spa";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createContainer } from "./container";
import "./socle/app/dsfr-overrides.css";
import { App, applyTheme, followHostTheme, type Models } from "./socle";

// Clair par défaut : le thème est celui de la page qui embarque l'app, qui le
// transmet dès qu'on le lui demande, puis à chaque changement (#342).
startReactDsfr({ defaultColorScheme: "light" });
followHostTheme(applyTheme);

// Les classes qui parlent à l'extérieur, instanciées une fois. Matomo et le
// journal du backend suivent le même choix du prescripteur, demandé au CMS
// (ADR-5 et ADR-6 d'analytics.md).
const container = createContainer();

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
    <App
      models={models}
      referentiel={container.referentiel}
      declarer={container.declarer}
      analytics={container.analytics}
    />
  </StrictMode>,
);
