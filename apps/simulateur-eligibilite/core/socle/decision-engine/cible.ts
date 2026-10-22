// Ce que les règles donnent pour une cible : une valeur, `null` quand elle ne
// s'applique pas, `undefined` quand il manque un fait. Le moteur de décision
// donne ses cibles ainsi, le modèle et l'écran les lisent par leurs méthodes.
//
// Une cible est un objet valeur : immuable, et lue comme un fait. Une cible
// inconnue ou sans objet n'est jamais un « non » : `isNon()` ne vaut que pour
// `false`. Sa valeur reste lisible : la trace l'affiche, et une cible passe en
// JSON par sa valeur.

/** Ce que vaut une cible établie : « oui ou non », ou l'une de ses constantes. */
type Value = boolean | string;

/** Les règles ne concluent pas sur cette cible : il manque un fait. */
type Undetermined = undefined;

/**
 * Une cible des règles. Le compilateur suit sa sorte : `isOui()` et `isNon()`
 * pour une cible « oui ou non », `is(valeur)` pour une cible à constantes.
 */
export class Cible<Of extends Value = Value> {
  /** Sa valeur. `null` : sans objet. `Undetermined` : inconnue. */
  readonly value: Of | null | Undetermined;

  private constructor(value: Of | null | Undetermined) {
    this.value = value;
    Object.freeze(this);
  }

  /** La cible de cette valeur, telle que les règles la donnent. */
  static of<Of extends Value>(value: Of | null | Undetermined): Cible<Of> {
    return new Cible(value);
  }

  /** La cible vaut « oui ». */
  isOui(this: Cible<boolean>): boolean {
    return this.value === true;
  }

  /** La cible vaut « non ». Inconnue ou sans objet, elle ne le vaut pas. */
  isNon(this: Cible<boolean>): boolean {
    return this.value === false;
  }

  /** La cible vaut cette constante. */
  is(this: Cible<string>, valeur: Of): boolean {
    return this.value === valeur;
  }

  /** Il manque un fait pour la calculer : ce n'est pas une décision. */
  isInconnue(): boolean {
    return this.value === undefined;
  }

  /** Elle ne s'applique pas à ces faits. */
  isSansObjet(): boolean {
    return this.value === null;
  }

  /** Sa valeur, en JSON. */
  toJSON(): Of | null | Undetermined {
    return this.value;
  }
}

/** La valeur de chaque cible : ce qu'une situation de référence en attend. */
export type CibleValues<Cibles> = {
  readonly [Nom in keyof Cibles]: Cibles[Nom] extends Cible<infer Of>
    ? Of | null | Undetermined
    : never;
};

/** La valeur de chacune de ces cibles : ce que la trace montre, ce qu'un test attend. */
export function cibleValues<Cibles extends Readonly<Record<string, Cible>>>(
  cibles: Cibles,
): CibleValues<Cibles> {
  return Object.fromEntries(
    Object.entries(cibles).map(([nom, cible]) => [nom, cible.value]),
  ) as CibleValues<Cibles>;
}
