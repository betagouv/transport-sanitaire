// Ce qu'on sait d'un fait, et comment l'écrire : oui, non, ou inconnu, avec
// d'où on le tient. Le modèle établit ses faits ainsi, le moteur de décision
// les lit.

/**
 * Un fait inconnu : ni vrai ni faux. Les règles ne le reçoivent pas, et ce qui
 * en dépend reste indéfini.
 */
type Unknown = undefined;

/**
 * Ce qu'on sait d'un fait : sa valeur, quand elle est établie, et d'où on le
 * tient. Sans valeur, le fait est inconnu (`Unknown`).
 */
export type Fait<Value extends boolean | number | string = boolean> = {
  readonly value?: Value | Unknown;
  /** La réponse qui le donne, son référentiel, ou ce qui le rend sans objet. */
  readonly provenance: string;
};

/**
 * Les trois états d'un fait, chacun avec sa provenance. `inconnu` n'est pas
 * `non` : les règles ne le reçoivent pas.
 */
export const Fait = {
  oui(provenance: string): Fait {
    return { value: true, provenance };
  },
  non(provenance: string): Fait {
    return { value: false, provenance };
  },
  inconnu(provenance: string): Fait {
    return { provenance };
  },
};
