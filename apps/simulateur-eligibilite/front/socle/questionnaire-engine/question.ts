// Ce qu'est une question, une page, une partie, une réponse.
//
// Le questionnaire est déclaré par le modèle : ses parties, ses pages, ses
// conditions d'affichage et ses dépendances. Le moteur ne connaît aucun
// identifiant : les génériques ne servent qu'à typer le modèle.

/** Une réponse : un choix, un nombre, un texte, ou les cases cochées. */
export type Answer = string | number | readonly string[];

/** Les questions d'un modèle : pour chacune, le type de sa réponse. */
export type AnyQuestions = Readonly<Record<string, Answer>>;

/** Les réponses données à un instant, par question. Il peut en manquer. */
export type Answers<Questions extends AnyQuestions = AnyQuestions> = Readonly<
  Partial<Questions>
>;

/** Les cibles d'un modèle : ce que sa préconisation rend. */
export type AnyCibles = Readonly<Record<string, unknown>>;

/**
 * Les questions validées, par question : ce qui s'y proposait, et ce qui y a
 * été répondu. Une question absente n'est pas validée : elle ne se posait pas,
 * ou attend encore sa réponse.
 */
export type Validated<Questions extends AnyQuestions = AnyQuestions> = {
  readonly [Id in keyof Questions]?: {
    /** Les options qui se proposaient. Absente : une saisie libre. */
    readonly offered?: readonly string[];
    /** Absente : la question, facultative, est restée sans réponse. */
    readonly answer?: Questions[Id];
  };
};

/**
 * L'aide d'une option : un intitulé qui se déplie sur une liste. La déplier
 * n'est pas répondre.
 */
type OptionHelp = {
  readonly label: string;
  readonly items: readonly string[];
};

export type Option<
  Questions extends AnyQuestions = AnyQuestions,
  Cibles = AnyCibles | undefined,
> = {
  readonly value: string;
  readonly label: string;
  /** Le libellé, quand il dépend des réponses. Absente : `label`. */
  labelFrom?(
    answers: Answers<Questions>,
    cibles: Cibles,
    validated: Validated<Questions>,
  ): string;
  /** Ce que l'option veut dire, rendu sous son libellé. */
  readonly description?: string;
  /**
   * L'option se propose-t-elle, vu les réponses ? Absente : toujours. Une
   * réponse qui la portait la perd quand elle ne se propose plus.
   */
  offeredIf?(
    answers: Answers<Questions>,
    cibles: Cibles,
    validated: Validated<Questions>,
  ): boolean;
  /**
   * Choisir cette option arrête le questionnaire sur sa page : ce message
   * s'affiche, et on n'avance plus tant qu'elle reste choisie.
   */
  readonly blocks?: string;
  /** L'aide dépliable de l'option. */
  readonly help?: OptionHelp;
  /** L'aide, quand elle dépend des réponses. Absente : `help`. */
  helpFrom?(
    answers: Answers<Questions>,
    cibles: Cibles,
    validated: Validated<Questions>,
  ): OptionHelp | undefined;
};

/**
 * Un rappel : ce qui est déjà connu, redit avant la question qu'il éclaire. Il
 * prend deux formes : une phrase, ou des valeurs avec leur intitulé, comme le
 * rôle et la nature d'un lieu au-dessus de son adresse.
 */
type Reminder =
  | string
  | ReadonlyArray<{ readonly label: string; readonly value: string }>;

type Common<Questions extends AnyQuestions, Cibles> = {
  readonly id: keyof Questions & string;
  readonly label: string;
  /** Le libellé, quand il dépend des réponses. Absente : `label`. */
  labelFrom?(
    answers: Answers<Questions>,
    cibles: Cibles,
    validated: Validated<Questions>,
  ): string;
  /** Phrase indicative, rendue sous la question. */
  readonly hint?: string;
  /**
   * Le rappel, rendu juste avant la question. Ce n'est pas une question : il
   * n'attend rien, ne se modifie pas, et ne s'affiche que si sa question se
   * pose.
   */
  readonly reminder?: Reminder;
  /**
   * Le rappel, quand il dépend des réponses ou des cibles. Absente, ou sans
   * rien à rappeler : `reminder`.
   */
  reminderFrom?(
    answers: Answers<Questions>,
    cibles: Cibles,
    validated: Validated<Questions>,
  ): Reminder | undefined;
  /**
   * La question peut rester sans réponse : sa page se valide sans elle. Son
   * libellé le dit, par « (facultatif) ».
   */
  readonly optional?: boolean;
  /**
   * La question se pose-t-elle, vu les réponses ? Absente : toujours. Après le
   * verrou, elle lit aussi les cibles figées : une question peut dépendre de la
   * préconisation.
   *
   * Écrite en méthode : TypeScript compare alors ses paramètres dans les deux
   * sens, et le moteur peut recevoir les questions typées d'un modèle.
   */
  askedIf?(
    answers: Answers<Questions>,
    cibles: Cibles,
    validated: Validated<Questions>,
  ): boolean;
  /**
   * Les questions dont dépend cette réponse. Quand l'une d'elles change, cette
   * réponse est effacée, et elle seule (`page-commit.ts`).
   */
  readonly dependsOn?: readonly (keyof Questions & string)[];
};

export type SingleChoice<
  Questions extends AnyQuestions = AnyQuestions,
  Cibles = AnyCibles | undefined,
> = Common<Questions, Cibles> & {
  readonly kind: "single choice";
  readonly options: readonly Option<Questions, Cibles>[];
  /**
   * Rendue en liste déroulante, et non en boutons radio. Une liste ne valide
   * rien d'elle-même : sa page garde son bouton.
   */
  readonly dropdown?: boolean;
};

/** Deux options d'un choix multiple qui ne vont pas ensemble, et pourquoi. */
type IncompatibleOptions = {
  readonly values: readonly [string, string];
  /** Affichée quand cocher l'une vient de décocher l'autre. */
  readonly explanation: string;
};

export type MultipleChoice<
  Questions extends AnyQuestions = AnyQuestions,
  Cibles = AnyCibles | undefined,
> = Common<Questions, Cibles> & {
  readonly kind: "multiple choice";
  readonly options: readonly Option<Questions, Cibles>[];
  /**
   * L'option exclusive : la cocher décoche les autres, et inversement. Comme
   * toute option, elle peut ne se proposer que pour certaines réponses, et
   * changer de libellé avec elles.
   */
  readonly exclusiveOption?: Option<Questions, Cibles>;
  /**
   * Les options qui s'excluent deux à deux. Cocher l'une décoche l'autre, sans
   * toucher au reste, et l'explication s'affiche.
   */
  readonly incompatibleOptions?: readonly IncompatibleOptions[];
};

type NumberInput<Questions extends AnyQuestions, Cibles> = Common<
  Questions,
  Cibles
> & {
  readonly kind: "number";
  readonly min?: number;
  readonly max?: number;
  /** N'accepte qu'un nombre entier : une décimale est refusée. */
  readonly integer?: boolean;
  readonly unit?: string;
};

type TextInput<Questions extends AnyQuestions, Cibles> = Common<
  Questions,
  Cibles
> & {
  /** `long text` : un texte sur plusieurs lignes, saisi dans une zone de texte. */
  readonly kind: "text" | "long text";
};

/**
 * Les bornes d'une date, écrites comme sa réponse : `2026-10-12` pour une
 * date, `2026-10-12T08:30` pour une date et une heure.
 */
type DateBounds = { readonly min?: string; readonly max?: string };

type DateInput<Questions extends AnyQuestions, Cibles> = Common<
  Questions,
  Cibles
> &
  DateBounds & {
    readonly kind: "date" | "datetime";
    /**
     * Les bornes, quand elles dépendent des réponses ou du jour. Elles passent
     * devant `min` et `max`.
     */
    boundsFrom?(
      answers: Answers<Questions>,
      cibles: Cibles,
      validated: Validated<Questions>,
    ): DateBounds;
  };

// Sans argument, ces types sont ceux du moteur : n'importe quelles questions,
// des cibles s'il y en a. Le modèle, lui, les écrit avec les siens.
export type Question<
  Questions extends AnyQuestions = AnyQuestions,
  Cibles = AnyCibles | undefined,
> =
  | SingleChoice<Questions, Cibles>
  | MultipleChoice<Questions, Cibles>
  | NumberInput<Questions, Cibles>
  | TextInput<Questions, Cibles>
  | DateInput<Questions, Cibles>;

export type Page<
  Questions extends AnyQuestions = AnyQuestions,
  Cibles = AnyCibles | undefined,
> = {
  readonly id: string;
  readonly questions: readonly Question<Questions, Cibles>[];
};

/**
 * Une partie du questionnaire : ses pages, dans l'ordre. Le stepper compte les
 * parties, pas les pages. Le titre coiffe chacune de ses pages.
 */
export type QuestionnairePart<
  Questions extends AnyQuestions = AnyQuestions,
  Cibles = AnyCibles | undefined,
> = {
  readonly id: string;
  readonly title: string;
  readonly pages: readonly Page<Questions, Cibles>[];
};

/** Les pages de ces parties, dans l'ordre du questionnaire. */
export function pagesOf(parts: readonly QuestionnairePart[]): Page[] {
  return parts.flatMap((part) => part.pages);
}
