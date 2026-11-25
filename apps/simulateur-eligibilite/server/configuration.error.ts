// L'erreur d'une configuration invalide : elle nomme chaque variable à corriger
// et pourquoi. `configuration.adapter.ts` la lève au démarrage.

/** Une variable d'environnement refusée, et la raison. */
export type ProblemeDeConfiguration = { variable: string; raison: string };

/** Ce que l'exploitant doit corriger : une variable par ligne, et pourquoi. */
export class ErreurDeConfiguration extends Error {
  readonly variables: string[];

  constructor(problemes: ProblemeDeConfiguration[]) {
    const lignes = problemes.map(
      ({ variable, raison }) => `  - ${variable} : ${raison}`,
    );
    super(
      `Démarrage impossible — configuration invalide :\n${lignes.join("\n")}`,
    );
    this.name = "ErreurDeConfiguration";
    this.variables = problemes.map(({ variable }) => variable);
  }
}
