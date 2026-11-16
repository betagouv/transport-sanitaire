// Une adresse telle qu'elle se demande : ses champs, dans son mode du moment,
// et ce qui ne va pas dans chacun. Leurs libellés sont écrits par l'écran
// (`front/socle/questionnaire/lay-out-an-address.ts`). Elle n'est répondue
// qu'avec tous ses champs attendus, sans rien à corriger.
//
// En France, le code postal fait cinq chiffres, et le pays ne se demande pas.
// À l'étranger, le pays est attendu, et le code postal est libre : il peut
// même manquer.

import {
  Address,
  type AddressData,
  type AddressFieldName,
} from "../address.vo.ts";
import type { Answer, Unanswered } from "../question.types.ts";
import {
  type AnswerProblem,
  MISSING,
  type NoError,
} from "./answer-problem.vo.ts";
import { AskedCommon, type AskedCommonData } from "./common.vo.ts";

export type AskedAddressData = AskedCommonData & {
  readonly kind: "address";
  readonly withPlaceName?: boolean;
  readonly abroad?: boolean;
};

/** Un champ qui se demande. */
export type AskedField = {
  readonly name: AddressFieldName;
  /** Le champ peut rester vide. */
  readonly optional?: boolean;
};

/** Ce qui ne va pas dans une adresse, par champ fautif. */
type AddressProblems = Readonly<
  Partial<Record<AddressFieldName, AnswerProblem>>
>;

/** Une adresse, telle qu'elle se demande. */
export class AskedAddress extends AskedCommon {
  readonly kind = "address";
  /** Demande aussi le nom du lieu, avant la voie. */
  readonly withPlaceName: boolean;
  /**
   * L'adresse est à l'étranger : le pays se demande, et le code postal est
   * libre et facultatif. Rien sur la page ne le change : c'est la question qui
   * le dit.
   */
  readonly abroad: boolean;

  constructor(data: AskedAddressData) {
    super(data);
    this.withPlaceName = data.withPlaceName ?? false;
    this.abroad = data.abroad ?? false;
  }

  /** Les champs qui se demandent, dans l'ordre où ils se saisissent. */
  fields(): readonly AskedField[] {
    return [
      ...(this.withPlaceName ? [PLACE_NAME] : []),
      STREET,
      COMPLEMENT,
      this.abroad ? POSTAL_CODE_ABROAD : POSTAL_CODE,
      CITY,
      ...(this.abroad ? [COUNTRY] : []),
    ];
  }

  /**
   * Ce qui ne va pas dans l'adresse, champ par champ, à montrer sous chacun. Un
   * champ encore vide n'a rien à corriger.
   */
  fieldProblems(address: Address): AddressProblems {
    const problems = this.fields().flatMap((field) => {
      const problem = this.#problemOf(field, address.field(field.name) ?? "");
      return problem === undefined ? [] : [[field.name, problem] as const];
    });
    return Object.fromEntries(problems);
  }

  /**
   * L'adresse réduite aux champs qui se demandent, sans espace en début ni en
   * fin. Une adresse dont il ne reste rien n'est plus une réponse. Le pays
   * d'une adresse repassée en France s'y perd.
   */
  override kept(answer: Answer | Unanswered): AddressData | Unanswered {
    const address = Address.of(answer);
    if (!address) return undefined;
    const read = this.fields().map((field) => ({
      ...field,
      text: address.field(field.name)?.trim() ?? "",
    }));
    if (read.every(({ text }) => text === "")) return undefined;
    const kept = read.filter(({ text, optional }) => text !== "" || !optional);
    const fields = Object.fromEntries(kept.map((f) => [f.name, f.text]));
    return { ...Address.empty().toJSON(), ...fields };
  }

  override isFilledBy(answer: Answer | Unanswered): boolean {
    const kept = Address.of(this.kept(answer));
    if (!super.isFilledBy(answer)) return false;
    return !kept || this.#isComplete(kept);
  }

  // Une adresse a un problème par champ, montré sous chacun. Ici, le premier
  // suffit : il dit qu'il reste quelque chose à corriger.
  protected override formatProblemOf(answer: Answer): AnswerProblem | NoError {
    const address = Address.of(answer);
    if (!address) return MISSING;
    return Object.values(this.fieldProblems(address))[0];
  }

  // ---- implémentation ----

  // Tous ses champs attendus, sans rien à corriger.
  #isComplete(address: Address): boolean {
    const missing = this.fields().some(
      ({ name, optional }) => !optional && !address.field(name)?.trim(),
    );
    return !missing && Object.keys(this.fieldProblems(address)).length === 0;
  }

  // Des espaces seuls ne sont pas une saisie : comme pour un texte, le champ
  // attendu le dit. Le code postal français se juge sans ses espaces extrêmes,
  // puisqu'ils seront retirés.
  #problemOf(field: AskedField, typed: string): AnswerProblem | NoError {
    if (typed === "") return undefined;
    const text = typed.trim();
    if (text === "") return field.optional ? undefined : { kind: "missing" };
    if (field.name === "postalCode" && !this.abroad && !/^\d{5}$/.test(text))
      return { kind: "invalid postal code" };
    return undefined;
  }
}

const PLACE_NAME: AskedField = { name: "placeName" };
const STREET: AskedField = { name: "street" };
const COMPLEMENT: AskedField = { name: "complement", optional: true };
const POSTAL_CODE: AskedField = { name: "postalCode" };
const POSTAL_CODE_ABROAD: AskedField = { name: "postalCode", optional: true };
const CITY: AskedField = { name: "city" };
const COUNTRY: AskedField = { name: "country" };
