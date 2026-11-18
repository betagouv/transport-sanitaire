// Les places d'une question sous une réponse d'une question d'avant
// (`shownUnder`) : une réponse possible d'un choix, ou la case cochée d'une case
// seule. Une place peut ne valoir que tant qu'une condition tient (`while`) :
// la réponse ne compte alors pour la garde de la question qu'avec elle. Le
// socle vérifie ce que ces conditions lisent
// (`conditions/guard-reading.service.ts`). L'écran choisit, parmi les places
// qui valent, celle dont la réponse a été sélectionnée la première.

import type { Condition, Context } from "../../conditions/reading.vo.ts";
import type { ShownUnder } from "../asked/common.vo.ts";

/** Ce qui restreint une place sous une réponse. */
type AnchorOptions = { readonly while?: Condition };

/**
 * Ce qui désigne la réponse sous laquelle s'afficher, après la question : une
 * réponse possible d'un choix, rien pour une case seule, puis ce qui
 * restreint cette place.
 */
export type UnderArgs<Given> = [Given] extends [boolean]
  ? [options?: AnchorOptions]
  : [
      possibleAnswer: Given extends readonly (infer O)[]
        ? O & string
        : Given & string,
      options?: AnchorOptions,
    ];

type Anchor = ShownUnder & AnchorOptions;

/** Les places d'une question, dans l'ordre où elle les déclare. */
export class Anchors {
  static none(): Anchors {
    return new Anchors([]);
  }

  readonly #all: readonly Anchor[];

  private constructor(all: readonly Anchor[]) {
    this.#all = all;
    Object.freeze(this);
  }

  /** Une place de plus, sous cette réponse de `question`. */
  with(question: string, where: readonly unknown[]): Anchors {
    const [first, second] = where;
    const options = (typeof first === "string" ? second : first) as
      | AnchorOptions
      | undefined;
    const anchor: Anchor = {
      question,
      ...(typeof first === "string" && { possibleAnswer: first }),
      ...(options?.while && { while: options.while }),
    };
    return new Anchors([...this.#all, anchor]);
  }

  /** Les réponses sous lesquelles elle peut s'afficher, sans leur condition. */
  get places(): readonly ShownUnder[] {
    return this.#all.map(({ while: _, ...place }) => place);
  }

  /** Ce qui restreint ses places. */
  get conditions(): readonly Condition[] {
    return this.#all.flatMap((anchor) => anchor.while ?? []);
  }

  /**
   * Les places qui valent dans ce contexte, sans leur condition : la question
   * posée passe en JSON.
   */
  in(context: Context): readonly ShownUnder[] {
    return this.#all
      .filter((anchor) => anchor.while?.in(context) ?? true)
      .map(({ while: _, ...place }) => place);
  }
}
