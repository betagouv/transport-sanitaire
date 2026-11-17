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

/**
 * Où se dessine un texte : une position par volet qui le porte. `singleLine` :
 * il reste sur une ligne, quitte à rapetisser jusqu'au plancher, et ne passe à
 * la ligne qu'au-delà. `strict` : il tient sur une ligne de chaque position, à
 * sa taille, ou il ne se dessine pas (`strictDrawing`).
 */
export type DrawingBinding = {
  readonly positions: readonly Position[];
  readonly singleLine?: boolean;
  readonly strict?: Strict;
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
 * Un texte strict (D-302) : il s'écrit dans son champ à sa taille et à aucune
 * autre, ou il ne s'écrit pas. Le cerfa qui en déborde n'est qu'un aperçu, et
 * le prescripteur le réécrit.
 */
export type StrictTextBinding = {
  readonly field: string;
  readonly strict: Strict;
};

/** Comment un texte strict s'écrit, et ce que l'écran en dit. */
export type Strict = StrictOptions & {
  /** Son nom à l'écran : le titre de sa rubrique sur le cerfa. */
  readonly label: string;
};

export type StrictOptions = {
  /** Sa taille, en points. La taille visée sans elle. */
  readonly size?: number;
  /**
   * Il tient sur une ligne : un retour à la ligne n'y passe pas. Sans elle,
   * son champ passe en multiligne.
   */
  readonly oneLine?: boolean;
  /** Le message d'un texte qui déborde. Celui de la cellule médicale sans lui. */
  readonly overflowMessage?: string;
  /** Le message d'un texte vide. Sans lui, un texte vide se valide. */
  readonly requiredMessage?: string;
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

type Binding<Reading> = [Reading] extends [boolean]
  ? BoxBinding
  : TextBinding | StrictTextBinding;

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
    readonly [Key in keyof Dto["drawings"]]-?: DrawingBinding;
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

/** Un texte strict écrit dans le champ `field`, nommé `label` à l'écran. */
export function strictText(
  field: string,
  label: string,
  options: StrictOptions = {},
): StrictTextBinding {
  return { field, strict: { label, ...options } };
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
export function at(...positions: readonly Position[]): DrawingBinding {
  return { positions };
}

/**
 * Le texte dessiné `drawing`, gardé sur une ligne : il rapetisse jusqu'au
 * plancher avant de passer à la ligne, là où une seconde ligne passerait sur
 * le gabarit.
 */
export function onOneLine(drawing: DrawingBinding): DrawingBinding {
  return { ...drawing, singleLine: true };
}

/**
 * Le texte dessiné `drawing`, strict : sur une ligne de chaque position, à sa
 * taille, ou il ne se dessine pas, et le prescripteur le réécrit (D-302).
 */
export function strictDrawing(
  drawing: DrawingBinding,
  label: string,
  options: Omit<StrictOptions, "oneLine"> = {},
): DrawingBinding {
  return { ...drawing, strict: { label, ...options, oneLine: true } };
}

/**
 * Le chargeur d'un gabarit servi comme asset de l'app. Un modèle en obtient
 * l'URL par `import url from "./gabarit.pdf?url"`.
 */
export function templateAt(url: string): () => Promise<ArrayBuffer> {
  return async () => {
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`Gabarit indisponible (HTTP ${response.status}).`);
    return response.arrayBuffer();
  };
}
