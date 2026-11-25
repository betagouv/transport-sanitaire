// Les cas d'usage du cerfa, posés dans l'arbre React. `App` les reçoit du
// conteneur ; les hooks (`*.hook.ts`) les lisent. Sans cas d'usage donnés, le
// cerfa ne se génère pas : sa génération échoue, et sa mesure n'arrive pas.

import { createContext, useContext } from "react";
import type { CerfaUseCases } from "./container";

/** Absents : le cerfa ne se génère pas. */
type NotGiven = null;

const CerfaUseCasesContext = createContext<CerfaUseCases | NotGiven>(null);

export const CerfaUseCasesProvider = CerfaUseCasesContext.Provider;

export function useCerfaUseCases(): CerfaUseCases | NotGiven {
  return useContext(CerfaUseCasesContext);
}
