// Ce que la police d'un champ sait écrire.
//
// Les polices standard du PDF n'écrivent que les caractères de WinAnsi. Un
// seul caractère de plus, et `pdf-lib` lève une erreur : le PDF ne se génère
// pas. Un « ᵉ » d'un libellé, une lettre roumaine d'un nom saisi suffisent.

import type { PDFFont } from "pdf-lib";

/**
 * `text`, où chaque caractère que `font` ne sait pas écrire prend sa forme
 * simple (« ᵉ » donne « e », « ț » donne « t »), sinon « ? ».
 */
export function writableIn(font: PDFFont, text: string): string {
  const known = new Set(font.getCharacterSet());
  const writable = (character: string) =>
    [...character].every((c) => known.has(c.codePointAt(0) as number));
  return [...text]
    .map((character) => {
      if (writable(character)) return character;
      const simple = [...character.normalize("NFKD")].filter(writable).join("");
      return simple === "" ? "?" : simple;
    })
    .join("");
}
