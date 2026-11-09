// Où s'ouvrent les developer tools : en local seulement, quel que soit le
// service choisi (D-279).

/**
 * Vrai en local : sous le serveur de dev de Vite et sous les tests. Faux sur un
 * build de production, donc en staging comme en production, même avec les
 * données factices.
 */
export function developerToolsUnlocked(env: Env = import.meta.env): boolean {
  return env.DEV === true;
}

// ---- implémentation ----

// Ce que Vite dit du build : `DEV` vaut vrai sous `vite` et sous Vitest, faux
// sous `vite build`.
type Env = { DEV?: boolean };
