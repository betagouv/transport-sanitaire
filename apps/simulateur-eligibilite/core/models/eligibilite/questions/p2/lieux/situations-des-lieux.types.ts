// Ce que P2 dit des deux lieux du trajet, situation par situation : une nature
// établie, ou les natures entre lesquelles il laisse choisir
// (`situations-des-lieux.service.ts`).

import type { Nature } from "./natures-du-lieu.constants.ts";

/** Une nature établie en P2, et ce que le rappel en dit. */
export type Etablie = { readonly nature: Nature; readonly rappel: string };

/** Les natures entre lesquelles P2 laisse choisir. */
export type Bornee = { readonly natures: readonly Nature[] };

/** Ce que P2 dit d'un lieu : sa nature, ou les natures qu'il admet. */
export type Role = Etablie | Bornee;

/** Les rôles qu'une situation donne, lieu par lieu. */
export type Lieux = { readonly depart?: Role; readonly arrivee?: Role };

/**
 * Le sens dans lequel les lieux se lisent. Un aller-retour équivalent se décrit
 * dans le sens de l'aller.
 */
export type Orientation = "aller" | "retour";
