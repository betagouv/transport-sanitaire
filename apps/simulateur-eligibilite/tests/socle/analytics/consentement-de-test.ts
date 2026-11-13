// Un choix du prescripteur qu'un test donne lui-même, sans passer par le CMS.

import type {
  Consent,
  ConsentSource,
} from "../../../front/socle/analytics/consent.port";

export class ConsentementDeTest implements ConsentSource {
  readonly #suiveurs: ((choix: Consent) => void)[] = [];
  readonly #initial: Consent | undefined;

  /** Le choix, donné à la création s'il est connu. */
  constructor(initial?: Consent) {
    this.#initial = initial;
  }

  follow(onChoice: (choix: Consent) => void): void {
    this.#suiveurs.push(onChoice);
    if (this.#initial) onChoice(this.#initial);
  }

  choisir(choix: Consent): void {
    for (const suiveur of this.#suiveurs) suiveur(choix);
  }
}
