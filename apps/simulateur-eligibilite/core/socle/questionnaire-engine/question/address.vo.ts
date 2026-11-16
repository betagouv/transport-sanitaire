// Une adresse, la réponse d'une question « adresse ». La réponse se garde en
// JSON (`AddressData`), comme toutes les réponses ; l'adresse la lit et la
// modifie champ par champ. Ce qui se demande, et ce qui ne va pas dans chaque
// champ, dépend de la question : `AskedAddress` le dit.

import type { Unanswered } from "./question.types.ts";

/**
 * Une adresse en JSON. Un champ qui ne se demande pas est absent, comme un
 * champ facultatif resté vide. Validée, elle n'a plus d'espace en début ni en
 * fin de champ : accents et casse sont ceux de la saisie.
 */
export type AddressData = {
  readonly placeName?: string;
  readonly street: string;
  readonly complement?: string;
  /** Absent quand une adresse à l'étranger n'en a pas. */
  readonly postalCode?: string;
  readonly city: string;
  /** Le pays d'une adresse à l'étranger. Absent en France. */
  readonly country?: string;
};

/** Le nom d'un champ d'une adresse. */
export type AddressFieldName = keyof AddressData;

/** La réponse n'est pas une adresse. */
type NotAnAddress = undefined;

/** Le champ n'est pas saisi : il ne se demande pas, ou il est resté vide. */
type NotTyped = undefined;

export class Address {
  /** L'adresse que donne cette réponse, si c'en est une. */
  static of(answer: unknown): Address | NotAnAddress {
    const isData =
      typeof answer === "object" && answer !== null && !Array.isArray(answer);
    return isData ? new Address(answer as AddressData) : undefined;
  }

  /** Une adresse dont aucun champ n'est saisi. */
  static empty(): Address {
    return new Address(EMPTY);
  }

  readonly #data: AddressData;

  private constructor(data: AddressData) {
    this.#data = data;
    Object.freeze(this);
  }

  /** Ce champ, tel qu'il est saisi. */
  field(name: AddressFieldName): string | NotTyped {
    return this.#data[name];
  }

  /** L'adresse une fois ce champ saisi. Une adresse vidée n'est plus une réponse. */
  withField(name: AddressFieldName, text: string): Address | Unanswered {
    const typed = { ...EMPTY, ...this.#data, [name]: text };
    const filled = Object.values(typed).some((value) => value !== "");
    return filled ? new Address(typed) : undefined;
  }

  toJSON(): AddressData {
    return this.#data;
  }
}

// ---- implémentation ----

const EMPTY: AddressData = { street: "", city: "" };
