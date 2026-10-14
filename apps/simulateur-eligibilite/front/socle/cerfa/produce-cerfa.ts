// Produit un cerfa rempli puis aplati, et le propose au téléchargement.
//
// Le cerfa ne sait pas d'où viennent ses données : il reçoit son DTO, que le
// simulateur calcule, et qu'une autre source pourrait calculer.
//
// `pdf-lib` et le gabarit ne se chargent qu'ici, au clic : le chunk d'entrée
// n'en porte rien, et `scripts/verifier-bundle.ts` le vérifie.

import type { BoxBinding, Cerfa, CerfaDto, TextBinding } from "./cerfa";
import type { FieldEntry } from "./fill-cerfa";
import type { Mark } from "./flatten-cerfa";

/** Le cerfa rempli d'après `dto`, aplati, prêt à télécharger. */
export async function produceCerfa<Dto extends CerfaDto>(
  cerfa: Cerfa<Dto>,
  dto: Dto,
): Promise<Blob> {
  const [template, { fillCerfa }, { flattenCerfa }] = await Promise.all([
    cerfa.template(),
    import("./fill-cerfa"),
    import("./flatten-cerfa"),
  ]);
  const { entries, singleLineFields, marks } = instructionsOf(cerfa, dto);
  const filled = await fillCerfa(template, entries, { singleLineFields });
  const pdf = await flattenCerfa(filled, marks);
  // `pdf` est une vue typée trop large pour `BlobPart` : on la repasse telle
  // quelle.
  return new Blob([pdf as BlobPart], { type: "application/pdf" });
}

/**
 * Ce que le DTO demande au PDF, dans les noms du gabarit. Une entrée absente,
 * vide ou fausse laisse sa place vide.
 */
function instructionsOf<Dto extends CerfaDto>(cerfa: Cerfa<Dto>, dto: Dto) {
  const bound = Object.entries(
    cerfa.fields as Readonly<Record<string, TextBinding | BoxBinding>>,
  );
  const filled = bound.filter(([key]) => isGiven(dto.fields[key]));
  return {
    entries: filled.flatMap(([key, binding]) =>
      entryOf(binding, dto.fields[key]),
    ),
    singleLineFields: bound.flatMap(([, binding]) =>
      "singleLine" in binding && binding.singleLine ? [binding.field] : [],
    ),
    marks: filled.flatMap(([, binding]): Mark[] =>
      "drawn" in binding && binding.drawn ? [binding] : [],
    ),
  };
}

/**
 * Le chargeur d'un gabarit servi comme asset de l'app : un modèle l'importe par
 * `import url from "./gabarit.pdf?url"`.
 */
export function templateAt(url: string): () => Promise<ArrayBuffer> {
  return async () => {
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`Gabarit indisponible (HTTP ${response.status}).`);
    return response.arrayBuffer();
  };
}

/** Le nom du fichier : sa racine, puis la date du document. */
export function fileNameOf(root: string, date: Date): string {
  // La locale suédoise écrit la date en `AAAA-MM-JJ`, qui se trie.
  const day = date.toLocaleDateString("sv-SE", {
    timeZone: "Europe/Paris",
  });
  return `${root}-${day}.pdf`;
}

/** Déclenche le téléchargement de `blob` sous `name`, puis libère son URL. */
export function download(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// ---- implémentation ----

function isGiven<Value>(value: Value | undefined): value is Value {
  return value !== undefined && value !== "" && value !== false;
}

// Une case dessinée n'est pas un champ à remplir : elle part dans les marques.
function entryOf(
  binding: TextBinding | BoxBinding,
  value: string | boolean | undefined,
): FieldEntry[] {
  if ("state" in binding)
    return binding.drawn
      ? []
      : [{ field: binding.field, checked: binding.state }];
  const text = String(value);
  return binding.measured
    ? [{ field: binding.field, measuredText: text }]
    : [{ field: binding.field, text }];
}
