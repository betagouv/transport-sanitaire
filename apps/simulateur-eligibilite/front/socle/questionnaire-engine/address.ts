// Ce qu'est une adresse, la réponse d'une question « adresse » : ses champs,
// ceux qui se demandent, et ce qui ne va pas dans chacun.
//
// En France, le code postal fait cinq chiffres, et le pays ne se demande pas.
// À l'étranger, le pays est attendu, et le code postal est libre : il peut
// même manquer.

import type { Unanswered } from "./question";

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

/** Rien à redire : la réponse est bonne. */
export type NoError = undefined;

type FieldName = keyof Address;

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

/** Un champ qui se demande, tel qu'il se présente. */
type AskedField = {
  readonly name: FieldName;
  readonly label: string;
  readonly hint?: string;
  /** Le champ peut rester vide. */
  readonly optional?: boolean;
  /** Un champ court, pour une saisie de quelques caractères. */
  readonly short?: boolean;
  /** Le champ se range sur la ligne de celui qui le précède. */
  readonly sameLine?: boolean;
};

/** Les messages d'une adresse, par champ fautif. */
type AddressErrors = Readonly<Partial<Record<FieldName, string>>>;

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
 * L'adresse à l'écran, une fois ce champ saisi. Une adresse vidée n'est plus
 * une réponse.
 */
export function withField(
  address: Address | Unanswered,
  name: FieldName,
  text: string,
): Address | Unanswered {
  const typed = { ...EMPTY, ...address, [name]: text };
  return Object.values(typed).some((value) => value !== "") ? typed : undefined;
}

/**
 * L'adresse, réduite aux champs qui se demandent, sans espace en début ni en
 * fin. Une adresse dont il ne reste rien n'est plus une réponse. Le pays d'une
 * adresse repassée en France s'y perd.
 */
export function askedAddress(
  settings: AddressSettings,
  address: Address,
): Address | Unanswered {
  const read = askedFields(settings).map((field) => ({
    ...field,
    text: address[field.name]?.trim() ?? "",
  }));
  if (read.every(({ text }) => text === "")) return undefined;
  const kept = read.filter(({ text, optional }) => text !== "" || !optional);
  return { ...EMPTY, ...Object.fromEntries(kept.map((f) => [f.name, f.text])) };
}

/**
 * Ce qui ne va pas dans l'adresse, champ par champ, à afficher sous chacun. Un
 * champ encore vide n'a rien à corriger.
 */
export function addressErrors(
  settings: AddressSettings,
  address: Address,
): AddressErrors {
  const errors = askedFields(settings).flatMap((field) => {
    const error = fieldError(settings, field, address[field.name] ?? "");
    return error === undefined ? [] : [[field.name, error] as const];
  });
  return Object.fromEntries(errors);
}

/** L'adresse a-t-elle tous ses champs attendus, sans rien à corriger ? */
export function isCompleteAddress(
  settings: AddressSettings,
  address: Address,
): boolean {
  const missing = askedFields(settings).some(
    ({ name, optional }) => !optional && !address[name]?.trim(),
  );
  return !missing && Object.keys(addressErrors(settings, address)).length === 0;
}

// ---- implémentation ----

const EMPTY: Address = { street: "", city: "" };

const PLACE_NAME: AskedField = { name: "placeName", label: "Nom du lieu" };
const STREET: AskedField = { name: "street", label: "Numéro et voie" };
const COMPLEMENT: AskedField = {
  name: "complement",
  label: "Complément (facultatif)",
  optional: true,
};
const POSTAL_CODE: AskedField = {
  name: "postalCode",
  label: "Code postal",
  hint: "Format attendu : 5 chiffres",
  short: true,
};
const POSTAL_CODE_ABROAD: AskedField = {
  name: "postalCode",
  label: "Code postal (facultatif)",
  optional: true,
  short: true,
};
// La commune suit le code postal, sur sa ligne.
const CITY: AskedField = { name: "city", label: "Commune", sameLine: true };
const COUNTRY: AskedField = { name: "country", label: "Pays" };

// Des espaces seuls ne sont pas une saisie : comme pour un texte, le champ
// attendu le dit. Le code postal français se juge sans ses espaces extrêmes,
// puisqu'ils seront retirés.
function fieldError(
  settings: AddressSettings,
  field: AskedField,
  typed: string,
): string | NoError {
  if (typed === "") return undefined;
  const text = typed.trim();
  if (text === "")
    return field.optional ? undefined : "Cette réponse est attendue.";
  if (field.name === "postalCode" && !settings.abroad && !/^\d{5}$/.test(text))
    return "Indiquez un code postal de 5 chiffres.";
  return undefined;
}
