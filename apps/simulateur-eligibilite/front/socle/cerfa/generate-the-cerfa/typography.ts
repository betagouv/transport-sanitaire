// La taille des textes imprimés d'un cerfa, par identifiant de mesure. Elle sert
// à mesurer ce que le prescripteur imprime : jamais le texte, seulement son
// identifiant et sa taille. Un texte sans identifiant se mesure sous sa clé du DTO.
//
// Un texte porté par plusieurs volets, ou deux textes du même identifiant,
// gardent la plus petite taille.

/** Les tailles des textes imprimés d'un cerfa, et ceux qui n'en ont pas. */
export type Typography = {
  /** La taille de chaque texte imprimé, en points, par identifiant. */
  readonly sizes: Readonly<Record<string, number>>;
  /** Les identifiants des textes imprimés dont la taille n'a pas pu se lire. */
  readonly unmeasured: readonly string[];
};

/** La taille d'un texte dessiné ne s'est pas lue. */
type Unread = undefined;

/** Ce qui s'est imprimé, et à quelle taille. */
type Printed = {
  /** Chaque texte écrit dans un champ : sa clé du DTO, et le nom du champ. */
  readonly texts: readonly (readonly [key: string, field: string])[];
  /** La taille imprimée de chaque champ écrit, par nom de champ. */
  readonly fieldSizes: ReadonlyMap<string, number>;
  /** Chaque texte dessiné hors des champs : sa clé du DTO, et sa taille. */
  readonly drawn: readonly (readonly [key: string, size: number | Unread])[];
  /** L'identifiant de mesure de chaque texte, par clé du DTO. */
  readonly ids?: Readonly<Record<string, string>>;
};

export function typographyOf({
  texts,
  fieldSizes,
  drawn,
  ids = {},
}: Printed): Typography {
  const measured = [
    ...texts.map(([key, field]) => [key, fieldSizes.get(field)] as const),
    ...drawn,
  ].map(([key, size]) => [ids[key] ?? key, size] as const);
  const sizes: Record<string, number> = {};
  const unmeasured = new Set<string>();
  for (const [key, size] of measured) {
    if (size === undefined) unmeasured.add(key);
    else sizes[key] = Math.min(size, sizes[key] ?? size);
  }
  // Une taille non lue pourrait être la plus petite : le texte n'en a aucune.
  for (const key of unmeasured) delete sizes[key];
  return { sizes, unmeasured: [...unmeasured] };
}
