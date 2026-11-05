// Pose un thème sur le DSFR de la page.
//
// `data-fr-scheme` dit le choix, que le DSFR suit et traduit en
// `data-fr-theme`, l'attribut que les styles lisent. On pose aussi ce dernier :
// avant que le DSFR démarre, il n'y aurait personne pour le faire, et c'est ce
// que fait `useIsDark` de react-dsfr.

import type { Theme } from "./host-theme";

export function applyTheme(
  theme: Theme,
  root: HTMLElement = document.documentElement,
): void {
  root.setAttribute("data-fr-scheme", theme);
  root.setAttribute("data-fr-theme", theme);
}
