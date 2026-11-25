// La règle de l'avancement automatique (`advance-alone.hook.ts`) : quelles
// pages avancent d'elles-mêmes.
//
// Elle ne vaut que pour une page autonome : un seul choix unique, affiché
// seul. Une page composée garde son bouton, même complète : plusieurs blocs,
// une case, une saisie, ou un sous-champ révélé par la réponse
// (REFERENTIEL/03 § 11.3.1). Une question facultative le garde aussi : sinon
// la page partirait avant qu'on ait pu y répondre. De même une liste
// déroulante, qu'on parcourt au clavier en changeant de valeur.

import type { AskedQuestion } from "../../../core/socle/questionnaire-engine";

/** Les questions d'une page, et ce que la règle en dit. */
export class AdvanceAloneService {
  readonly #questions: readonly AskedQuestion[];

  constructor(questions: readonly AskedQuestion[]) {
    this.#questions = questions;
  }

  /** La page est autonome : une seule question, un choix unique qui avance seul. */
  isSingleChoicePage(): boolean {
    const [only, ...others] = this.#questions;
    return (
      only !== undefined && others.length === 0 && this.#advancesAlone(only)
    );
  }

  #advancesAlone(question: AskedQuestion): boolean {
    return (
      question.kind === "single choice" &&
      !question.optional &&
      !question.dropdown
    );
  }
}
