// La préconisation : ce que le simulateur établit sur des réponses, les faits
// qu'elles donnent puis les cibles que les règles en tirent. Le résultat la
// lit, le verrou la fige (`simulation-stage.vo.ts`), la trace l'affiche.
//
// Un objet valeur : immuable, sans identité. Le service l'établit
// (`preconisation.service.ts`).

import type { AnyFaits } from "../model.ts";
import type { AnyCibles } from "../questionnaire-engine/index.ts";

export class Preconisation<Faits = AnyFaits, Cibles = AnyCibles> {
  readonly faits: Faits;
  readonly cibles: Cibles;

  constructor(faits: Faits, cibles: Cibles) {
    this.faits = faits;
    this.cibles = cibles;
    Object.freeze(this);
  }
}
