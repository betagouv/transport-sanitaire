// La page hôte des parcours en navigateur : elle tient la place de la page
// Sites Conformes. Elle embarque le simulateur en iframe, sans `sandbox`, et
// charge le script du CMS tel qu'il est collé en production, à son origine
// près (README, « Intégrer dans Sites Conformes »).
//
// Lancé seul (`node navigateur/page-hote.ts`), il sert la page.

import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { ORIGINE_SIMULATEUR } from "./simulateur.ts";

export const PORT_HOTE = 4174;
export const ORIGINE_HOTE = `http://localhost:${PORT_HOTE}`;

/** Le titre de l'iframe, par lequel un parcours la retrouve. */
export const TITRE_DE_L_IFRAME = "Simulateur d'éligibilité";

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  createServer((requete, reponse) => {
    const script = requete.url === CHEMIN_DU_SCRIPT;
    reponse.setHeader(
      "Content-Type",
      `${script ? "text/javascript" : "text/html"}; charset=utf-8`,
    );
    reponse.end(script ? scriptDuCms() : page());
  }).listen(Number(process.env.PORT ?? PORT_HOTE));
}

// ---- implémentation ----

// Le pied de page porte la liste DSFR où le script ajoute son bouton, et le
// contenu au-dessus de l'iframe la place plus bas que le haut de la page.
function page(): string {
  return `<!doctype html>
<html lang="fr" data-fr-theme="light">
  <head><meta charset="utf-8" /><title>Page hôte</title></head>
  <body>
    <main>
      <h1>Page hôte</h1>
      <iframe
        title="${TITRE_DE_L_IFRAME}"
        src="${ORIGINE_SIMULATEUR}/"
        style="width: 100%; height: 1400px; border: 1px solid"
      ></iframe>
    </main>
    <footer><ul class="fr-footer__bottom-list"></ul></footer>
    <script type="module" src="${CHEMIN_DU_SCRIPT}"></script>
  </body>
</html>`;
}

// Servi à part : son en-tête cite la balise `</script>`, qui fermerait un
// script écrit dans la page.
function scriptDuCms(): string {
  const script = readFileSync(
    new URL("../front/socle/analytics/cms.js", import.meta.url),
    "utf-8",
  );
  if (!script.includes(ORIGINE_A_REMPLACER)) {
    throw new Error(
      "Le script du CMS ne déclare plus son origine à remplacer.",
    );
  }
  return script.replace(ORIGINE_A_REMPLACER, ORIGINE_SIMULATEUR);
}

const CHEMIN_DU_SCRIPT = "/cms.js";
const ORIGINE_A_REMPLACER = "https://simulateur.example";
