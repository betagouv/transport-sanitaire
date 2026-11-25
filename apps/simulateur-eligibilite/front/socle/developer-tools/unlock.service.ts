// Où s'ouvrent les developer tools : en local seulement, quel que soit le
// service choisi. La trace de debug s'ouvre aussi partout pour la
// structure « Assurance Maladie ».

// Ce que Vite dit du build : `DEV` vaut vrai sous `vite` et sous Vitest, faux
// sous `vite build`.
type Env = { DEV?: boolean };

export class UnlockService {
  /**
   * Vrai en local : sous le serveur de dev de Vite et sous les tests. Faux sur un
   * build de production, donc en staging comme en production, même avec les
   * données factices.
   */
  static developerToolsUnlocked(env: Env = import.meta.env): boolean {
    return env.DEV === true;
  }

  /**
   * Vrai quand la trace de debug s'ouvre : avec les developer tools, en local, et
   * sur tous les environnements pour la structure « Assurance Maladie ». Elle ne
   * montre que le parcours en cours : ni seeds ni modèle de démonstration.
   */
  static debugTraceUnlocked(
    developerTools: boolean,
    structure: string | null,
  ): boolean {
    return developerTools || structure === UnlockService.#STRUCTURE_DE_LA_TRACE;
  }

  static readonly #STRUCTURE_DE_LA_TRACE = "Assurance Maladie";
}
