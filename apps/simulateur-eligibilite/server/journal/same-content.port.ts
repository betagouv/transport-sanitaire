// Ce que le journal demande pour savoir si deux événements disent la même
// chose : une comparaison en profondeur. Le module `node:util`
// (`node-same-content.adapter.ts`) y répond.

export interface SameContent {
  /** Les deux valeurs ont-elles le même contenu, champ par champ ? */
  equal(first: unknown, second: unknown): boolean;
}
