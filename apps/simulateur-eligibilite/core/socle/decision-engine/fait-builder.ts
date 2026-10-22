// Les règles d'un fait, écrites comme le contrat de l'éditeur les décrit : ce
// qui le met à « oui », ce qui le met à « non », ce qui le laisse inconnu.
//
//   fait_motif_camsp: ({ validated }) =>
//     regles()
//       .selonCase(validated.question("Q2.2.1.b"), "6_CAMSP")
//       .seulementSi(validated.question("Q2.1").is("10_CAMSP"))
//       .selon(validated.question("Q2.1.h"), { "1_OUI": "oui", "2_NON": "non" })
//       .sinon("Ni Q2.1.h, ni Q2.2.1 n'établissent encore le CAMSP."),
//
// Les règles s'appliquent dans l'ordre : la première qui établit le fait
// l'emporte. `sinon` clôt la chaîne : si aucune règle n'établit le fait, il
// reste inconnu avec cette provenance, ou vaut le fait qu'on lui donne. Le nom
// du fait vient du catalogue (`fait-catalogue.ts`).

import type {
  Box,
  Choice,
  GivenAnswer,
} from "../questionnaire-engine/given-answers.ts";
import type { Answer } from "../questionnaire-engine/question.ts";
import type { ValidatedAnswer } from "../questionnaire-engine/validated-answers.ts";
import { Fait } from "./fait.ts";

/** Ce qu'une réponse dit du fait : l'un de ses trois états. */
type Etat = "oui" | "non" | "inconnu";

/** Les règles d'un fait, à écrire dans l'ordre : `regles().ouiSi(…).sinon(…)`. */
export function regles(): FaitBuilder {
  return new FaitBuilder([]);
}

/**
 * Une provenance qui cite les réponses données : « Q2.14.eloignement :
 * « 1_PLUS_150 », Q2.14.motif : « 2_SUIVI ». ». Une réponse absente ne se cite
 * pas.
 */
export function citant(...answers: readonly GivenAnswer<Answer>[]): string {
  const cited = answers
    .filter((answer) => answer.hasAnswer())
    .map((answer) => `${answer.id} : « ${formatted(answer.value)} »`);
  return `${cited.join(", ")}.`;
}

/** Un fait en cours d'écriture, règle après règle. */
class FaitBuilder {
  readonly #rules: readonly Rule[];

  constructor(rules: readonly Rule[]) {
    this.#rules = rules;
  }

  /** Le fait ne s'établit que si `condition` tient. Sinon, il vaut `sinon`. */
  seulementSi(condition: boolean): FaitBuilder {
    return this.#then((sinon) => (condition ? undefined : sinon));
  }

  /**
   * La réponse décide, par sa valeur : `{ "1_OUI": "oui", "2_NON": "non" }`.
   * La provenance cite la question et sa réponse. Une valeur hors de la table,
   * ou pas de réponse, laisse la main aux règles suivantes.
   */
  selon<Given extends Answer>(
    answer: GivenAnswer<Given>,
    table: Partial<Record<Choice<Given> & string, Etat>>,
  ): FaitBuilder {
    return this.#then(() => {
      const etat = answer.hasAnswer()
        ? (table as Partial<Record<string, Etat>>)[String(answer.value)]
        : undefined;
      return etat && Fait[etat](citant(answer));
    });
  }

  /**
   * La case décide, selon le contrat de l'éditeur : cochée, « oui » ; proposée
   * sans être cochée, « non ». Une case qui ne se proposait pas laisse la main.
   */
  selonCase<Given extends Answer>(
    answer: ValidatedAnswer<Given>,
    box: Box<Given>,
  ): FaitBuilder {
    return this.#then(() => answer.faitOf(box));
  }

  /**
   * « Non » si la case se proposait sans être cochée : la situation est
   * écartée. Sans provenance, celle de `selonCase`.
   */
  nonSiEcartee<Given extends Answer>(
    answer: ValidatedAnswer<Given>,
    box: Box<Given>,
    provenance?: string,
  ): FaitBuilder {
    return this.#then(() => {
      if (!answer.declined(box)) return undefined;
      return provenance === undefined
        ? answer.faitOf(box)
        : Fait.non(provenance);
    });
  }

  /** Le fait vaut « oui » si `condition` tient : `provenance` dit pourquoi. */
  ouiSi(condition: boolean, provenance: string): FaitBuilder {
    return this.#then(() => (condition ? Fait.oui(provenance) : undefined));
  }

  /** Le fait vaut « non » si `condition` tient : `provenance` dit pourquoi. */
  nonSi(condition: boolean, provenance: string): FaitBuilder {
    return this.#then(() => (condition ? Fait.non(provenance) : undefined));
  }

  /**
   * Le fait reste inconnu si `condition` tient, sans laisser la main : une
   * réponse attendue plus loin le dira.
   */
  inconnuSi(condition: boolean, provenance: string): FaitBuilder {
    return this.#then(() => (condition ? Fait.inconnu(provenance) : undefined));
  }

  /**
   * Ce fait, établi ailleurs, l'emporte s'il est donné, même inconnu.
   * `undefined` laisse la main. Pour un cas que les autres règles n'écrivent
   * pas.
   */
  retient(fait: Fait | undefined): FaitBuilder {
    return this.#then(() => fait);
  }

  /**
   * Clôt le fait, si aucune règle ne l'établit : inconnu avec cette
   * provenance, ou ce fait, établi ailleurs.
   */
  sinon(fallback: string | Fait): Fait {
    const sinon =
      typeof fallback === "string" ? Fait.inconnu(fallback) : fallback;
    const found = this.#rules.reduce<Fait | undefined>(
      (fait, rule) => fait ?? rule(sinon),
      undefined,
    );
    return found ?? sinon;
  }

  #then(rule: Rule): FaitBuilder {
    return new FaitBuilder([...this.#rules, rule]);
  }
}

// ---- implémentation ----

// Une règle établit le fait, ou laisse la main. Elle reçoit le fait de
// `sinon`, que `seulementSi` reprend.
type Rule = (sinon: Fait) => Fait | undefined;

function formatted(value: unknown): string {
  return Array.isArray(value) ? value.join(", ") : String(value);
}
