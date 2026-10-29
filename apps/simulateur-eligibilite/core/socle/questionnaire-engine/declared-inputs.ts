// Les saisies libres déclarées : un nombre, un texte, une date, une case seule,
// une adresse. Chacune n'a que ses réglages : `min` n'existe pas sur un texte.

import { AskedAddress } from "./asked-address.ts";
import type { AskedCommonData } from "./asked-common.ts";
import {
  AskedCheckbox,
  AskedDate,
  AskedNumber,
  AskedText,
} from "./asked-inputs.ts";
import { type CommonSettings, DeclaredQuestion } from "./declared-question.ts";
import type { AnyQuestions } from "./question.ts";
import type { QuestionContext } from "./question-context.ts";

/** Un nombre déclaré. */
export class DeclaredNumber<
  Questions extends AnyQuestions,
  Cibles,
  Faits,
> extends DeclaredQuestion<Questions, Cibles, Faits, NumberOwn> {
  readonly kind = "number";

  /** N'accepte qu'un nombre entier : une décimale est refusée. */
  integer(): this {
    return this.withOwn({ integer: true });
  }

  min(min: number): this {
    return this.withOwn({ min });
  }

  max(max: number): this {
    return this.withOwn({ max });
  }

  /** L'unité, affichée après le champ : `semaine(s)`. */
  unit(unit: string): this {
    return this.withOwn({ unit });
  }

  protected override askedWith(common: AskedCommonData) {
    return new AskedNumber({ ...common, kind: this.kind, ...this.own });
  }

  protected override rebuilt(
    settings: CommonSettings<Questions, Cibles, Faits>,
    own: NumberOwn,
  ) {
    return new DeclaredNumber(settings, own) as this;
  }
}

/** Un texte déclaré, sur une ligne ou sur plusieurs (`long text`). */
export class DeclaredText<
  Questions extends AnyQuestions,
  Cibles,
  Faits,
> extends DeclaredQuestion<Questions, Cibles, Faits, TextOwn> {
  get kind(): TextOwn["kind"] {
    return this.own.kind;
  }

  protected override askedWith(common: AskedCommonData) {
    return new AskedText({ ...common, kind: this.kind });
  }

  protected override rebuilt(
    settings: CommonSettings<Questions, Cibles, Faits>,
    own: TextOwn,
  ) {
    return new DeclaredText(settings, own) as this;
  }
}

/**
 * Une date déclarée, ou une date et une heure (`datetime`). Ses bornes
 * s'écrivent comme sa réponse : `2026-10-12`, ou `2026-10-12T08:30`.
 */
export class DeclaredDate<
  Questions extends AnyQuestions,
  Cibles,
  Faits,
> extends DeclaredQuestion<
  Questions,
  Cibles,
  Faits,
  DateOwn<Questions, Cibles, Faits>
> {
  get kind(): DateOwn<Questions, Cibles, Faits>["kind"] {
    return this.own.kind;
  }

  min(min: string): this {
    return this.withOwn({ min });
  }

  max(max: string): this {
    return this.withOwn({ max });
  }

  /** Les bornes, quand elles dépendent des réponses ou du jour. */
  boundsFrom(
    bounds: (context: QuestionContext<Questions, Cibles, Faits>) => DateBounds,
  ): this {
    return this.withOwn({ boundsFrom: bounds });
  }

  protected override askedWith(
    common: AskedCommonData,
    context: QuestionContext<Questions, Cibles, Faits>,
  ) {
    const { min, max, boundsFrom } = this.own;
    const bounds = { min, max, ...boundsFrom?.(context) };
    return new AskedDate({ ...common, kind: this.kind, ...bounds });
  }

  protected override rebuilt(
    settings: CommonSettings<Questions, Cibles, Faits>,
    own: DateOwn<Questions, Cibles, Faits>,
  ) {
    return new DeclaredDate(settings, own) as this;
  }
}

/**
 * Une case seule déclarée. Son libellé coiffe la case, et `box` est le texte
 * de la case. Sans `box`, le libellé est celui de la case, sans titre au-dessus. Sa réponse est `true` ou `false` : décochée sur une page
 * validée, elle vaut `false`.
 */
export class DeclaredCheckbox<
  Questions extends AnyQuestions,
  Cibles,
  Faits,
> extends DeclaredQuestion<Questions, Cibles, Faits, CheckboxOwn> {
  readonly kind = "checkbox";

  protected override askedWith(common: AskedCommonData) {
    return new AskedCheckbox({ ...common, kind: this.kind, box: this.own.box });
  }

  protected override rebuilt(
    settings: CommonSettings<Questions, Cibles, Faits>,
    own: CheckboxOwn,
  ) {
    return new DeclaredCheckbox(settings, own) as this;
  }
}

/** Une adresse déclarée, saisie champ par champ (`address.ts`). */
export class DeclaredAddress<
  Questions extends AnyQuestions,
  Cibles,
  Faits,
> extends DeclaredQuestion<
  Questions,
  Cibles,
  Faits,
  AddressOwn<Questions, Cibles, Faits>
> {
  readonly kind = "address";

  /** Demande aussi le nom du lieu, avant la voie. */
  withPlaceName(): this {
    return this.withOwn({ withPlaceName: true });
  }

  /** L'adresse est à l'étranger : le pays se demande, le code postal est libre. */
  abroad(): this {
    return this.abroadIf(() => true);
  }

  /**
   * L'adresse est-elle à l'étranger, vu les réponses ? Sans `dependsOn`, une
   * adresse déjà saisie survit au changement : elle se relit dans le nouveau
   * mode.
   */
  abroadIf(
    condition: (context: QuestionContext<Questions, Cibles, Faits>) => boolean,
  ): this {
    return this.withOwn({ abroadIf: condition });
  }

  protected override askedWith(
    common: AskedCommonData,
    context: QuestionContext<Questions, Cibles, Faits>,
  ) {
    const { withPlaceName, abroadIf } = this.own;
    return new AskedAddress({
      ...common,
      kind: this.kind,
      withPlaceName,
      abroad: abroadIf?.(context) ?? false,
    });
  }

  protected override rebuilt(
    settings: CommonSettings<Questions, Cibles, Faits>,
    own: AddressOwn<Questions, Cibles, Faits>,
  ) {
    return new DeclaredAddress(settings, own) as this;
  }
}

/** Ce qu'un nombre règle de plus qu'une question. */
export type NumberOwn = {
  readonly min?: number;
  readonly max?: number;
  readonly integer?: boolean;
  readonly unit?: string;
};

/** Ce qu'un texte règle de plus qu'une question : sa sorte. */
export type TextOwn = { readonly kind: "text" | "long text" };

/** Ce qu'une date règle de plus qu'une question. */
export type DateOwn<
  Questions extends AnyQuestions,
  Cibles,
  Faits,
> = DateBounds & {
  readonly kind: "date" | "datetime";
  boundsFrom?(context: QuestionContext<Questions, Cibles, Faits>): DateBounds;
};

/**
 * Ce qu'une case seule règle de plus qu'une question : le texte de la case,
 * quand un titre la coiffe.
 */
export type CheckboxOwn = { readonly box?: string };

/** Ce qu'une adresse règle de plus qu'une question. */
export type AddressOwn<Questions extends AnyQuestions, Cibles, Faits> = {
  readonly withPlaceName?: boolean;
  abroadIf?(context: QuestionContext<Questions, Cibles, Faits>): boolean;
};

// ---- implémentation ----

// Les bornes d'une date, écrites comme sa réponse.
type DateBounds = { readonly min?: string; readonly max?: string };
