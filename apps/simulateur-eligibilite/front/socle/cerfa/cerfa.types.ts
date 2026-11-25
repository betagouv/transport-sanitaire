// Les types d'un cerfa : son gabarit, et où chaque entrée de son DTO va dans
// le PDF. Le DTO et son mapping sont du métier (`core/socle/cerfa/`).
//
// Le DTO parle en mots clairs (`longue_distance`). La définition du cerfa
// garde pour elle les noms exacts du gabarit (`km`, état `Oui`). Un gabarit
// qui renomme un champ ne change que sa définition, jamais le DTO.

import type { CerfaDto, CerfaMapping } from "../../../core/socle/cerfa";

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
   * du champ, `JJMMAAAA` sur huit, `JJ/MM/AAAA` sinon (`field-date.vo.ts`).
   */
  readonly date?: boolean;
};

/**
 * Un texte strict : il s'écrit dans son champ à sa taille et à aucune
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
  /** Le début du nom du fichier téléchargé. `PdfFileName` y ajoute la date. */
  readonly fileName: string;
  readonly fields: {
    readonly [Key in keyof Dto["fields"]]-?: Binding<
      NonNullable<Dto["fields"][Key]>
    >;
  };
  readonly drawings: {
    readonly [Key in keyof Dto["drawings"]]-?: DrawingBinding;
  };
  /**
   * L'identifiant sous lequel chaque texte se mesure, que la taille imprimée
   * prend à la place de sa clé du DTO. Deux textes du même identifiant en sont
   * un, à la plus petite taille. Sans eux, la clé du DTO.
   */
  readonly typographicIds?: {
    readonly [Key in TextKey<Dto>]-?: string;
  };
};

/** La clé d'un texte du DTO : écrit dans un champ, ou dessiné. */
type TextKey<Dto extends CerfaDto> =
  | {
      [Key in keyof Dto["fields"]]-?: [
        NonNullable<Dto["fields"][Key]>,
      ] extends [boolean]
        ? never
        : Key;
    }[keyof Dto["fields"]]
  | keyof Dto["drawings"];

/** Un cerfa et le mapping qui calcule son DTO, vérifiés ensemble. */
export type BoundCerfa = {
  readonly cerfa: Cerfa<CerfaDto>;
  readonly mapping: CerfaMapping<CerfaDto>;
};

/** Ce que la mesure dit d'un texte strict. */
export type StrictMeasure = {
  readonly fits: boolean;
  readonly maximum: number;
};

/** Comment un texte strict s'écrit : sa taille, et s'il tient sur une ligne. */
export type StrictLayout = { readonly size: number; readonly oneLine: boolean };

/**
 * Un texte strict du cerfa : son entrée du DTO, sa règle, et sa place, un
 * champ du gabarit ou la plus étroite de ses positions dessinées.
 */
export type StrictEntry = {
  readonly entry: string;
  readonly strict: Strict;
  readonly place: StrictPlace;
};

type StrictPlace = { readonly field: string } | { readonly width: number };

/** Les tailles des textes imprimés d'un cerfa, et ceux qui n'en ont pas. */
export type Typography = {
  /** La taille de chaque texte imprimé, en points, par identifiant. */
  readonly sizes: Readonly<Record<string, number>>;
  /** Les identifiants des textes imprimés dont la taille n'a pas pu se lire. */
  readonly unmeasured: readonly string[];
};
