// Le thème du simulateur est celui de la page qui l'embarque (#342).
//
// L'app tourne dans une iframe du CMS, qui propose à son lecteur le clair, le
// sombre ou celui du système. L'iframe ne lit pas ce choix : le CMS le lui
// transmet par `postMessage`, à la demande puis à chaque changement. Son script
// est `../analytics/cms.js`. Hors iframe, ou sans réponse, le simulateur reste
// clair : un cadre sombre au milieu d'une page claire est pire qu'un cadre
// clair partout.

export type Theme = "light" | "dark";

export type HostOptions = {
  /** La page qui embarque l'app (défaut : `window.parent`). */
  parent?: Window;
  /** Passé ce délai sans réponse, le simulateur reste clair. */
  delaiMs?: number;
};

/**
 * Demande son thème à la page qui embarque l'app, puis le suit : `apply` est
 * appelé à la réponse et à chaque changement.
 *
 * Seule la page parente est écoutée. Son origine n'est pas vérifiée : le
 * message ne porte aucune donnée, il change nos propres couleurs.
 */
export function followHostTheme(
  apply: (theme: Theme) => void,
  { parent = window.parent, delaiMs = DELAI_MS }: HostOptions = {},
): void {
  if (parent === window) {
    apply("light");
    return;
  }
  let repondu = false;
  window.addEventListener("message", (e) => {
    const theme = e.source === parent ? lireTheme(e.data) : null;
    if (!theme) return;
    repondu = true;
    apply(theme);
  });
  parent.postMessage({ type: DEMANDE }, "*");
  setTimeout(() => {
    if (!repondu) apply("light");
  }, delaiMs);
}

// ---- implémentation ----

// Le protocole, que le script du CMS implémente à l'identique.
const DEMANDE = "theme-simulateur:demande";
const CHOIX = "theme-simulateur:choix";

// Court : la page s'affiche dans le thème par défaut en attendant, et le CMS
// répond dès la demande.
const DELAI_MS = 1000;

function lireTheme(data: unknown): Theme | null {
  if (typeof data !== "object" || data === null) return null;
  const message = data as { type?: unknown; theme?: unknown };
  if (message.type !== CHOIX) return null;
  return message.theme === "dark" || message.theme === "light"
    ? message.theme
    : null;
}
