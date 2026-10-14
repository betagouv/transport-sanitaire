// Ce qu'est un cerfa : son gabarit, son DTO, et où chaque entrée du DTO va
// dans le PDF.
//
// Le DTO parle en mots clairs (`longue_distance`). La définition du cerfa
// garde pour elle les noms exacts du gabarit (`km`, état `Oui`). Un gabarit
// qui renomme un champ ne change que sa définition, jamais le DTO.

/**
 * Les données d'un cerfa. `fields` va dans les champs du gabarit : un texte,
 * ou une case cochée (`true`). Une entrée absente laisse sa place vide.
 */
export type CerfaDto = {
  readonly fields: Readonly<Record<string, string | boolean | undefined>>;
};

/** Où va un texte : le nom exact du champ, et comment l'écrire. */
export type TextBinding = {
  readonly field: string;
  /** Mesuré avant d'être écrit : le texte doit tenir en entier. */
  readonly measured?: boolean;
  /** Champ multiligne dont le cadre ne montre qu'une ligne. */
  readonly singleLine?: boolean;
};

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

type Binding<Value> = [Value] extends [boolean] ? BoxBinding : TextBinding;

/** Un cerfa à remplir d'après son DTO. */
export type Cerfa<Dto extends CerfaDto> = {
  /**
   * Charge le gabarit vierge, au clic : un asset servi par l'app
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
};

/** Un texte écrit dans le champ `field`. */
export function text(
  field: string,
  options: Omit<TextBinding, "field"> = {},
): TextBinding {
  return { field, ...options };
}

/** Une case du champ `field`, cochée par son état d'export `state`. */
export function box(field: string, state: string): BoxBinding {
  return { field, state };
}

/** Une case qui partage son champ : sa marque est dessinée sur la page. */
export function drawnBox(field: string, state: string): BoxBinding {
  return { field, state, drawn: true };
}
