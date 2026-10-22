// Ce qu'est une adresse, la réponse d'une question « adresse » : ses champs,
// ceux qui se demandent, et ce qui ne va pas dans chacun. Leurs libellés sont
// écrits par l'écran (`front/socle/questionnaire-engine/screen-texts.ts`).
//
// En France, le code postal fait cinq chiffres, et le pays ne se demande pas.
// À l'étranger, le pays est attendu, et le code postal est libre : il peut
// même manquer.

import type { AnswerProblem } from "./answer-problem.ts";

/**
 * Une adresse. Un champ qui ne se demande pas est absent, comme un champ
 * facultatif resté vide. Validée, elle n'a plus d'espace en début ni en fin de
 * champ : accents et casse sont ceux de la saisie.
 */
export type Address = {
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
export type AddressFieldName = keyof Address;

/** Ce qu'une question règle de son adresse. */
export type AddressSettings = {
  /** Demande aussi le nom du lieu, avant la voie. */
  readonly withPlaceName?: boolean;
  /**
   * L'adresse est à l'étranger : le pays se demande, et le code postal est
   * libre et facultatif. Rien sur la page ne le change : c'est la question qui
   * le dit.
   */
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

export function isAddress(answer: unknown): answer is Address {
  return (
    typeof answer === "object" && answer !== null && !Array.isArray(answer)
  );
}

/** Les champs qui se demandent, dans l'ordre où ils se saisissent. */
export function askedFields(settings: AddressSettings): AskedField[] {
  return [
    ...(settings.withPlaceName ? [PLACE_NAME] : []),
    STREET,
    COMPLEMENT,
    settings.abroad ? POSTAL_CODE_ABROAD : POSTAL_CODE,
    CITY,
    ...(settings.abroad ? [COUNTRY] : []),
  ];
}

/**
 * L'adresse à l'écran, une fois ce champ saisi. `undefined` quand il n'y reste
 * rien : une adresse vidée n'est plus une réponse.
 */
export function withField(
  address: Address | undefined,
  name: AddressFieldName,
  text: string,
): Address | undefined {
  const typed = { ...EMPTY, ...address, [name]: text };
  return Object.values(typed).some((value) => value !== "") ? typed : undefined;
}

/**
 * L'adresse, réduite aux champs qui se demandent, sans espace en début ni en
 * fin. `undefined` quand il n'en reste rien. Le pays d'une adresse repassée en
 * France s'y perd.
 */
export function askedAddress(
  settings: AddressSettings,
  address: Address,
): Address | undefined {
  const read = askedFields(settings).map((field) => ({
    ...field,
    text: address[field.name]?.trim() ?? "",
  }));
  if (read.every(({ text }) => text === "")) return undefined;
  const kept = read.filter(({ text, optional }) => text !== "" || !optional);
  return { ...EMPTY, ...Object.fromEntries(kept.map((f) => [f.name, f.text])) };
}

/**
 * Ce qui ne va pas dans l'adresse, champ par champ, à montrer sous chacun. Un
 * champ encore vide n'a rien à corriger.
 */
export function addressProblems(
  settings: AddressSettings,
  address: Address,
): AddressProblems {
  const problems = askedFields(settings).flatMap((field) => {
    const problem = fieldProblem(settings, field, address[field.name] ?? "");
    return problem === undefined ? [] : [[field.name, problem] as const];
  });
  return Object.fromEntries(problems);
}

/** L'adresse a-t-elle tous ses champs attendus, sans rien à corriger ? */
export function isCompleteAddress(
  settings: AddressSettings,
  address: Address,
): boolean {
  const missing = askedFields(settings).some(
    ({ name, optional }) => !optional && !address[name]?.trim(),
  );
  return (
    !missing && Object.keys(addressProblems(settings, address)).length === 0
  );
}

// ---- implémentation ----

const EMPTY: Address = { street: "", city: "" };

const PLACE_NAME: AskedField = { name: "placeName" };
const STREET: AskedField = { name: "street" };
const COMPLEMENT: AskedField = { name: "complement", optional: true };
const POSTAL_CODE: AskedField = { name: "postalCode" };
const POSTAL_CODE_ABROAD: AskedField = { name: "postalCode", optional: true };
const CITY: AskedField = { name: "city" };
const COUNTRY: AskedField = { name: "country" };

// Des espaces seuls ne sont pas une saisie : comme pour un texte, le champ
// attendu le dit. Le code postal français se juge sans ses espaces extrêmes,
// puisqu'ils seront retirés.
function fieldProblem(
  settings: AddressSettings,
  field: AskedField,
  typed: string,
): AnswerProblem | undefined {
  if (typed === "") return undefined;
  const text = typed.trim();
  if (text === "") return field.optional ? undefined : { kind: "missing" };
  if (field.name === "postalCode" && !settings.abroad && !/^\d{5}$/.test(text))
    return { kind: "invalid postal code" };
  return undefined;
}
