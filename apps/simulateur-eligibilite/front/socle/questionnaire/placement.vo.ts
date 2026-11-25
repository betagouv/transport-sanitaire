// Où chaque question de la page s'affiche : dans le panneau d'une réponse
// sélectionnée sur la page (`shownUnder`), ou à son rang
// (NAV-PANNEAUX-20261116).
//
// Une question à plusieurs places va sous celle qui est devenue effective la
// première : sa réponse est sélectionnée, et sa condition tient. Elle y reste
// quand une autre le devient ensuite. Celle-ci retirée, la question passe sous
// la suivante dans cet ordre, sa réponse gardée. Sans aucune place effective
// sur la page, elle reste à son rang : aucune réponse ne s'invente pour lui
// servir de parent.
//
// Cet ordre est un état de l'écran, pas une réponse : il ne va ni dans la
// simulation, ni dans la mesure d'audience. Une page validée le garde pour le
// retour, le temps de la session. Sans lui, à la première entrée ou après un
// rechargement, il suit la lecture de la page : on ne reconstruit pas un faux
// historique.

import type {
  Answers,
  AskedQuestion,
  ShownUnder,
} from "../../../core/socle/questionnaire-engine";

/** La question s'affiche à son rang : aucune de ses places n'est effective. */
type InPlace = undefined;

export class Placement {
  static none(): Placement {
    return new Placement([], new Map());
  }

  readonly #questions: readonly AskedQuestion[];
  /** Les places effectives de chaque question, la plus ancienne d'abord. */
  readonly #effective: ReadonlyMap<string, readonly ShownUnder[]>;

  private constructor(
    questions: readonly AskedQuestion[],
    effective: ReadonlyMap<string, readonly ShownUnder[]>,
  ) {
    this.#questions = questions;
    this.#effective = effective;
    Object.freeze(this);
  }

  /**
   * Le placement après une saisie : les places encore effectives gardent leur
   * rang, les nouvelles suivent, dans l'ordre où la question les déclare.
   */
  after(questions: readonly AskedQuestion[], draft: Answers): Placement {
    const shown = questions.map(({ id }) => id);
    const effective = questions.map((question) => {
      const now = question.under.filter(
        (place) => shown.includes(place.question) && isSelected(place, draft),
      );
      const before = this.#effective.get(question.id) ?? [];
      const kept = before.filter((place) => now.some(same(place)));
      const added = now.filter((place) => !kept.some(same(place)));
      return [question.id, [...kept, ...added]] as const;
    });
    return new Placement(questions, new Map(effective));
  }

  /** Les questions qui s'affichent à leur rang, dans l'ordre de la page. */
  inPlace(): readonly AskedQuestion[] {
    return this.#questions.filter((question) => !this.#placeOf(question));
  }

  /**
   * Les questions qui s'affichent sous cette réponse de `parent`, dans l'ordre
   * de la page. Une case seule n'a pas de réponse possible.
   */
  under(parent: string, possibleAnswer?: string): readonly AskedQuestion[] {
    const here = same({ question: parent, possibleAnswer });
    return this.#questions.filter((question) => {
      const place = this.#placeOf(question);
      return place !== undefined && here(place);
    });
  }

  /** Les questions qui s'affichent dans un panneau. */
  get nested(): readonly AskedQuestion[] {
    return this.#questions.filter((question) => this.#placeOf(question));
  }

  equals(other: Placement): boolean {
    return other.#key() === this.#key();
  }

  #placeOf({ id }: AskedQuestion): ShownUnder | InPlace {
    return this.#effective.get(id)?.[0];
  }

  #key(): string {
    return JSON.stringify([...this.#effective]);
  }
}

// ---- implémentation ----

function same(place: ShownUnder): (other: ShownUnder) => boolean {
  return (other) =>
    other.question === place.question &&
    other.possibleAnswer === place.possibleAnswer;
}

// Une réponse possible est sélectionnée : le choix, ou une case de la liste.
// Sans réponse possible, c'est la case seule qui est cochée.
function isSelected(place: ShownUnder, draft: Answers): boolean {
  const answer = draft[place.question];
  if (place.possibleAnswer === undefined) return answer === true;
  return Array.isArray(answer)
    ? answer.includes(place.possibleAnswer)
    : answer === place.possibleAnswer;
}
