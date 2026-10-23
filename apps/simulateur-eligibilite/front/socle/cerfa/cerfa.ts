// Ce qu'est un cerfa : son gabarit, son DTO, et où chaque entrée du DTO va
// dans le PDF.
//
// Le DTO parle en mots clairs (`longue_distance`). La définition du cerfa
// garde pour elle les noms exacts du gabarit (`km`, état `Oui`). Un gabarit
// qui renomme un champ ne change que sa définition, jamais le DTO.

/**
 * Les données d'un cerfa. `fields` va dans les champs du gabarit : un texte,
 * ou une case cochée (`true`). `drawings` se dessine là où le gabarit n'a pas
 * de champ. Une entrée absente laisse sa place vide.
 */
export type CerfaDto = {
  readonly fields: Readonly<Record<string, string | boolean | undefined>>;
  readonly drawings: Readonly<Record<string, string | undefined>>;
};

/** Un emplacement sur une page du gabarit, comptée depuis 1, en points. */
export type Position = {
  readonly page: number;
  readonly x: number;
  readonly y: number;
  readonly width: number;
};

/** Où va un texte : le nom exact du champ, et comment l'écrire. */
export type TextBinding = {
  readonly field: string;
  /** Champ multiligne dont le cadre ne montre qu'une ligne. */
  readonly singleLine?: boolean;
  /**
   * La valeur est une date ISO (`AAAA-MM-JJ`) : elle s'écrit selon les cases
   * du champ, `JJMMAAAA` sur huit, `JJ/MM/AAAA` sinon (`dates.ts`).
   */
  readonly date?: boolean;
};

/**
 * Un commentaire facultatif : il s'écrit à la suite du texte `commentOn`, une
 * autre entrée du DTO, dans le même champ. C'est la seule chose qui se retire
 * quand le texte ne tient pas dans son cadre (D-85).
 */
export type CommentBinding = { readonly commentOn: string };

/**
 * Où va une case : le nom exact du champ, et l'état d'export qui la coche.
 * `drawn` : la case partage son champ avec d'autres, et plusieurs peuvent être
 * cochées ensemble. Un champ ne garde qu'une valeur : sa marque est dessinée.
 */
export type BoxBinding = {
  readonly field: string;
  readonly state: string;
  readonly drawn?: boolean;
};

type Binding<Value> = [Value] extends [boolean]
  ? BoxBinding
  : TextBinding | CommentBinding;

/** Un cerfa à remplir d'après son DTO. */
export type Cerfa<Dto extends CerfaDto> = {
  /**
   * Charge le gabarit vierge, quand le bouton s'affiche : un asset servi par l'app
   * (`templateAt`), ou un formulaire fabriqué.
   */
  readonly template: () => Promise<ArrayBuffer | Uint8Array>;
  /** Le début du nom du fichier téléchargé. `fileNameOf` y ajoute la date. */
  readonly fileName: string;
  readonly fields: {
    readonly [Key in keyof Dto["fields"]]-?: Binding<
      NonNullable<Dto["fields"][Key]>
    >;
  };
  readonly drawings: {
    readonly [Key in keyof Dto["drawings"]]-?: readonly Position[];
  };
};

/** Un texte écrit dans le champ `field`. */
export function text(
  field: string,
  options: Omit<TextBinding, "field"> = {},
): TextBinding {
  return { field, ...options };
}

/**
 * Une date ISO écrite dans le champ `field`, au format de ses cases. Le DTO
 * ne sait pas combien le gabarit en a.
 */
export function date(field: string): TextBinding {
  return { field, date: true };
}

/** Le commentaire facultatif du texte `entry`, une entrée du DTO. */
export function commentOn(entry: string): CommentBinding {
  return { commentOn: entry };
}

/** Une case du champ `field`, cochée par son état d'export `state`. */
export function box(field: string, state: string): BoxBinding {
  return { field, state };
}

/** Une case qui partage son champ : sa marque est dessinée sur la page. */
export function drawnBox(field: string, state: string): BoxBinding {
  return { field, state, drawn: true };
}

/**
 * Un texte dessiné à chaque position, là où le gabarit n'a pas de champ : une
 * par volet qui le porte, comme un champ recopié d'un volet à l'autre. Le DTO
 * n'en donne qu'une valeur, et ne sait rien des volets.
 */
export function at(...positions: readonly Position[]): readonly Position[] {
  return positions;
}
