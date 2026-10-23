// Le catalogue des faits d'un modèle : une déclaration par fait. Chaque
// déclaration lit les réponses et, au besoin, d'autres faits ; sa chaîne de
// règles dit tout ce qu'il vaut (`fait-builder.ts`).
//
// Le catalogue refuse un fait déclaré deux fois, oublié, ou qui n'est pas du
// modèle. Il calcule chaque fait à sa première lecture : une garde qui lit deux
// faits n'en calcule que deux. Un fait qui se lit lui-même, par d'autres faits
// ou par une garde, s'arrête net.

import type { GivenAnswers } from "../questionnaire-engine/given-answers.ts";
import type { AnyQuestions } from "../questionnaire-engine/question.ts";
import type { ValidatedAnswers } from "../questionnaire-engine/validated-answers.ts";

/** Ce que lit la déclaration d'un fait : les réponses, et les autres faits. */
export type FaitContext<Questions extends AnyQuestions, Faits> = {
  readonly answers: GivenAnswers<Questions>;
  readonly validated: ValidatedAnswers<Questions>;
  readonly faits: Faits;
};

/** Des déclarations de faits, par thème : le catalogue les réunit. */
export type FaitDeclarations<Questions extends AnyQuestions, Faits> = {
  readonly [Name in keyof Faits]?: (
    context: FaitContext<Questions, Faits>,
  ) => Faits[Name];
};

/** Les faits d'un modèle, chacun déclaré une fois. */
export class FaitCatalogue<
  Questions extends AnyQuestions,
  Faits extends object,
> {
  readonly #names: readonly (keyof Faits & string)[];
  readonly #declarations: Readonly<Record<string, Declaration>>;

  /**
   * `names` : tous les faits du modèle, dans l'ordre où ils se lisent. Chaque
   * fait se déclare une fois, dans l'une des `declarations`.
   */
  constructor(
    names: readonly (keyof Faits & string)[],
    ...declarations: readonly FaitDeclarations<Questions, Faits>[]
  ) {
    this.#names = names;
    this.#declarations = merged(names, declarations);
  }

  /**
   * Les faits de ces réponses, calculés à la lecture. `fixed` : des faits
   * imposés, qui ne se calculent pas.
   */
  read(
    answers: GivenAnswers<Questions>,
    validated: ValidatedAnswers<Questions>,
    fixed: Partial<Faits> = {},
  ): Faits {
    const faits = {} as Faits;
    const context = { answers, validated, faits };
    const known = new Map<string, unknown>(Object.entries(fixed));
    for (const name of this.#names) {
      const declaration = this.#declarations[name] as Declaration;
      Object.defineProperty(faits, name, {
        enumerable: true,
        get: () => {
          if (!known.has(name))
            known.set(name, computed(name, declaration, context));
          return known.get(name);
        },
      });
    }
    return Object.freeze(faits);
  }
}

// ---- implémentation ----

type Declaration = (context: never) => unknown;

function merged(
  names: readonly string[],
  declarations: readonly Readonly<Record<string, unknown>>[],
): Record<string, Declaration> {
  const all: Record<string, Declaration> = {};
  for (const name of declarations.flatMap(Object.keys)) {
    if (!names.includes(name))
      throw new Error(`« ${name} » n'est pas un fait du modèle.`);
    if (name in all) throw new Error(`« ${name} » se déclare deux fois.`);
    all[name] = declarations.find((d) => name in d)?.[name] as Declaration;
  }
  const missing = names.filter((name) => !(name in all));
  if (missing.length > 0)
    throw new Error(`Ces faits ne sont pas déclarés : ${missing.join(", ")}.`);
  return all;
}

// Les faits en cours de calcul, toutes lectures confondues. Un fait qui s'y
// trouve déjà se lit lui-même : il bouclerait.
const computing: string[] = [];

function computed(name: string, declaration: Declaration, context: unknown) {
  if (computing.includes(name))
    throw new Error(
      `« ${name} » se lit lui-même : ${[...computing, name].join(" → ")}.`,
    );
  computing.push(name);
  try {
    return declaration(context as never);
  } finally {
    computing.pop();
  }
}
