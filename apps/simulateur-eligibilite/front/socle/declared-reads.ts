// Ce qu'une partie du résultat ou du cerfa lit du parcours, déclaré avant de
// lire : `uneRubrique("Accident").lit("Q3.6.2", "Q3.6.3")`. Le modèle écrit ses
// builders ; le socle donne de quoi réduire ce qu'ils lisent aux noms déclarés.
//
// Le compilateur refuse une question, un fait ou une cible non déclarés. À
// l'exécution, une lecture non déclarée lève une erreur qui nomme son lecteur :
// c'est elle qui garde ce qu'un concept du métier lit à travers `forConcept`.

import type { AnyQuestions } from "../../core/socle/questionnaire-engine/question";
import type {
  ValidatedAnswer,
  ValidatedAnswers,
} from "../../core/socle/questionnaire-engine/validated-answers";

/** Les questions validées, réduites à celles que le lecteur a déclarées. */
export interface DeclaredAnswers<
  Questions extends AnyQuestions,
  Ids extends keyof Questions,
> {
  question<Id extends Ids & string>(id: Id): ValidatedAnswer<Questions[Id]>;
}

/**
 * Un lecteur, nommé pour ses erreurs, et les noms qu'il déclare lire. Il garde
 * à l'exécution ce que le type réduit déjà : `Pick` pour les faits et les
 * cibles, `DeclaredAnswers` pour les questions.
 */
export class DeclaredReads<Name extends string> {
  readonly owner: string;
  readonly reads: readonly Name[];

  constructor(owner: string, reads: readonly Name[]) {
    this.owner = owner;
    this.reads = Object.freeze([...reads]);
    Object.freeze(this);
  }

  /**
   * Ces questions validées, dont seules les déclarées se lisent. Leur type ne
   * change pas : `DeclaredAnswers` le réduit, au modèle de le dire.
   */
  answers<Answers extends object>(validated: Answers): Answers {
    return new Proxy(validated, {
      get: (target, key) => {
        if (key !== "question") return bound(target, key);
        const question = bound(target, key) as (id: string) => unknown;
        return (id: string) => question(this.declared(id));
      },
    });
  }

  /**
   * Ces faits, cibles ou précisions, dont seuls les déclarés se lisent. Un nom
   * de `known`, par défaut les clés présentes, lève s'il n'est pas déclaré.
   */
  record<Values extends object>(
    values: Values,
    known: readonly string[] = Object.keys(values),
  ): Values {
    return new Proxy(values, {
      get: (target, key) => {
        if (typeof key === "string" && known.includes(key)) this.declared(key);
        return Reflect.get(target, key);
      },
    });
  }

  private declared(name: string): string {
    if (!(this.reads as readonly string[]).includes(name))
      throw new Error(`${this.owner} lit ${name} sans le déclarer.`);
    return name;
  }
}

/**
 * Les questions déclarées, pour un concept du métier qui attend toutes les
 * questions validées. Le compilateur ne vérifie plus ce qu'il lit : la garde
 * d'exécution lève s'il lit une question non déclarée.
 */
export function forConcept<Questions extends AnyQuestions>(
  answers: DeclaredAnswers<Questions, never>,
): ValidatedAnswers<Questions> {
  return answers as unknown as ValidatedAnswers<Questions>;
}

// ---- implémentation ----

// Une méthode de l'instance réelle, liée à elle : ses champs privés ne se
// lisent pas à travers le proxy.
function bound(target: object, key: string | symbol): unknown {
  const value = Reflect.get(target, key);
  return typeof value === "function" ? value.bind(target) : value;
}
