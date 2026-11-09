// L'écran revient en haut, et la page qui l'embarque avec lui (#369).
//
// L'app tourne dans une iframe du CMS. Remonter le document entier fait aussi
// défiler la page hôte sous Chrome et Firefox, pas sous Safari : WebKit ne fait
// pas défiler une page d'une autre origine. L'app demande donc aussi à la page
// hôte, par `postMessage`, de remonter au haut de l'iframe. Son script est
// `../analytics/cms.js`. Sous Chrome et Firefox, la page hôte est déjà au haut
// de l'iframe quand le message arrive : elle ne bouge plus.

export type HostOptions = {
  /** La page qui embarque l'app (défaut : `window.parent`). */
  parent?: Window;
};

/**
 * Remonte d'un coup en haut du document, ce qui respecte la réduction des
 * animations, puis demande à la page qui embarque l'app d'en faire autant.
 *
 * Hors iframe, rien ne part. Le message ne porte aucune donnée : il part vers
 * toute origine, comme la demande du thème.
 */
export function scrollToTheTop(
  document: Document,
  { parent = window.parent }: HostOptions = {},
): void {
  document.documentElement.scrollIntoView({
    block: "start",
    behavior: "instant",
  });
  if (parent !== window) parent.postMessage({ type: DEMANDE }, "*");
}

// ---- implémentation ----

// Le protocole, que le script du CMS implémente à l'identique.
const DEMANDE = "defilement-simulateur:haut";
