// Le constructeur d'un fait, écrit comme le contrat de l'éditeur le décrit : ce
// qui le met à « oui », ce qui le met à « non », ce qui le laisse inconnu.
//
//   fait("fait_motif_camsp")
//     .seulementSi(motif.is("10_CAMSP"))
//     .selon(validated.question("Q2.1.h"), { "1_OUI": "oui", "2_NON": "non" })
//     .sinon("Ni Q2.1.h, ni Q2.2.1 n'établissent encore le CAMSP.");
//
// Les règles s'appliquent dans l'ordre : la première qui établit le fait
// l'emporte. `sinon` clôt la chaîne : il donne la provenance du fait qu'aucune
// règle n'établit, et rend l'entrée `{ fait_motif_camsp: … }`.
//
// Un fait qui croise des dates ou enchaîne plusieurs cas reste une fonction :
// le constructeur sert le cas courant, pas tous.

import type {
  Choice,
  GivenAnswer,
} from "../questionnaire-engine/given-answers.ts";
import type { Answer } from "../questionnaire-engine/question.ts";
import { Fait } from "./fait.ts";

/** Ce qu'une réponse dit du fait : l'un de ses trois états. */
export type Etat = "oui" | "non" | "inconnu";

/** Le constructeur des faits d'un modèle : `fait("fait_permission")`. */
export function faitsOf<Faits>() {
  return <Name extends FaitName<Faits>>(name: Name): FaitBuilder<Name> =>
    new FaitBuilder(name, []);
}

/** Un fait en cours d'écriture, règle après règle. */
export class FaitBuilder<Name extends string> {
  readonly #name: Name;
  readonly #rules: readonly Rule[];

  constructor(name: Name, rules: readonly Rule[]) {
    this.#name = name;
    this.#rules = rules;
  }

  /** Le fait ne s'établit que si `condition` tient. Sinon, il reste inconnu. */
  seulementSi(condition: boolean): FaitBuilder<Name> {
    return this.#then((sinon) => (condition ? undefined : Fait.inconnu(sinon)));
  }

  /**
   * La réponse décide, par sa valeur : `{ "1_OUI": "oui", "2_NON": "non" }`.
   * La provenance cite la question et sa réponse. Une valeur hors de la table,
   * ou pas de réponse, laisse la main aux règles suivantes.
   */
  selon<Given extends Answer>(
    answer: GivenAnswer<Given>,
    table: Partial<Record<Choice<Given> & string, Etat>>,
  ): FaitBuilder<Name> {
    return this.#then(() => {
      const value = String(answer.value);
      const etat = answer.hasAnswer()
        ? (table as Partial<Record<string, Etat>>)[value]
        : undefined;
      return etat && Fait[etat](`${answer.id} : « ${value} ».`);
    });
  }

  /** Le fait vaut « oui » si `condition` tient : `provenance` dit pourquoi. */
  ouiSi(condition: boolean, provenance: string): FaitBuilder<Name> {
    return this.#then(() => (condition ? Fait.oui(provenance) : undefined));
  }

  /** Le fait vaut « non » si `condition` tient : `provenance` dit pourquoi. */
  nonSi(condition: boolean, provenance: string): FaitBuilder<Name> {
    return this.#then(() => (condition ? Fait.non(provenance) : undefined));
  }

  /** Clôt le fait : inconnu, avec cette provenance, si aucune règle ne l'établit. */
  sinon(provenance: string): { readonly [Key in Name]: Fait } {
    const fait = this.#rules.reduce<Fait | undefined>(
      (found, rule) => found ?? rule(provenance),
      undefined,
    );
    return { [this.#name]: fait ?? Fait.inconnu(provenance) } as {
      readonly [Key in Name]: Fait;
    };
  }

  #then(rule: Rule): FaitBuilder<Name> {
    return new FaitBuilder(this.#name, [...this.#rules, rule]);
  }
}

// ---- implémentation ----

// Une règle établit le fait, ou laisse la main. Elle reçoit la provenance de
// `sinon`, que `seulementSi` reprend.
type Rule = (sinon: string) => Fait | undefined;

// Les noms des faits du modèle qui valent « oui » ou « non ».
type FaitName<Faits> = {
  [Key in keyof Faits & string]: Faits[Key] extends Fait ? Key : never;
}[keyof Faits & string];
