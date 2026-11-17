// Les textes qu'un prescripteur réécrit sur un résultat, par entrée : son
// brouillon, et le texte qu'il a validé (D-303). La simulation les porte d'une
// transition à l'autre, et une nouvelle simulation repart sans.
//
// Une entrée est un nom que le résultat choisit : le socle ne sait pas ce
// qu'elle désigne. Un texte validé, même vide, remplace celui que le résultat
// composerait. Le brouillon garde la saisie telle quelle, à une chose près :
// un retour CRLF devient LF, pour que la mesure et l'écriture voient le même
// texte (spec médicale § 7).

type Texts = Readonly<Record<string, string>>;

export class TextEdits {
  static none(): TextEdits {
    return new TextEdits({}, {});
  }

  /** Les brouillons en cours, par entrée. */
  readonly drafts: Texts;
  /** Les textes validés, par entrée. */
  readonly accepted: Texts;

  private constructor(drafts: Texts, accepted: Texts) {
    this.drafts = drafts;
    this.accepted = accepted;
  }

  /** Le brouillon de `entry` devient `text`. */
  draft(entry: string, text: string): TextEdits {
    const drafts = { ...this.drafts, [entry]: text.replace(/\r\n?/g, "\n") };
    return new TextEdits(drafts, this.accepted);
  }

  /** Le brouillon de `entry` devient son texte validé. Sans brouillon, rien. */
  accept(entry: string): TextEdits {
    const text = this.drafts[entry];
    if (text === undefined) return this;
    const { [entry]: _, ...drafts } = this.drafts;
    return new TextEdits(drafts, { ...this.accepted, [entry]: text });
  }
}
