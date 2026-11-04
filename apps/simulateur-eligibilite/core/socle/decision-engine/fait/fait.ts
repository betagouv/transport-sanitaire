// Ce qu'on sait d'un fait : oui, non, ou inconnu, avec d'où on le tient. Le
// modèle établit ses faits ainsi, le moteur de décision les lit.
//
// Un fait est un objet valeur : immuable, et égal à tout fait de même valeur et
// de même provenance. Sa valeur et sa provenance restent lisibles : le moteur
// de décision lit l'une, la trace affiche les deux, et un fait passe en JSON.

/** Ce que vaut un fait établi : un booléen, ou un nombre ou un texte. */
type Value = boolean | number | string;

/**
 * Ce qu'on sait d'un fait : sa valeur, quand elle est établie, et d'où on le
 * tient. Sans valeur, le fait est inconnu : ce n'est pas un « non ».
 */
export class Fait<Of extends Value = boolean> {
  /** Sa valeur. `undefined` : le fait est inconnu, les règles ne le reçoivent pas. */
  readonly value: Of | undefined;
  /** La réponse qui le donne, son référentiel, ou ce qui le met sans objet. */
  readonly provenance: string;

  private constructor(value: Of | undefined, provenance: string) {
    this.value = value;
    this.provenance = provenance;
    Object.freeze(this);
  }

  /** Le fait vaut « oui ». */
  static oui(provenance: string): Fait {
    return new Fait(true, provenance);
  }

  /** Le fait vaut « non ». */
  static non(provenance: string): Fait {
    return new Fait(false, provenance);
  }

  /** Le fait est inconnu : ni oui, ni non. */
  static inconnu<Of extends Value = boolean>(provenance: string): Fait<Of> {
    return new Fait<Of>(undefined, provenance);
  }

  /** Le fait vaut ce nombre ou ce texte : `Fait.valant(8, "…")`. */
  static valant<Of extends number | string>(
    value: Of,
    provenance: string,
  ): Fait<Of> {
    return new Fait(value, provenance);
  }

  /** Le fait vaut « oui ». */
  isOui(this: Fait): boolean {
    return this.value === true;
  }

  /** Le fait vaut « non ». */
  isNon(this: Fait): boolean {
    return this.value === false;
  }

  /** Le fait n'est pas établi. */
  isInconnu(): boolean {
    return this.value === undefined;
  }

  /** Le même fait, tenu d'ailleurs : sa valeur, avec cette provenance. */
  avecProvenance(provenance: string): Fait<Of> {
    return new Fait(this.value, provenance);
  }

  /** Même valeur, même provenance. */
  equals(other: Fait<Value>): boolean {
    return this.value === other.value && this.provenance === other.provenance;
  }
}
