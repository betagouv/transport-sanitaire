// La ligne `Notion :` du corps d'une issue : elle garde l'adresse du ticket du
// chantier. La lire, l'écrire.

/** L'adresse du ticket, ou rien tant que la ligne vaut `—` ou manque. */
export function notionLink(body: string): string | undefined {
  return /^Notion : (https:\/\/\S+)/m.exec(body)?.[1];
}

/** Remplace la ligne du gabarit, ou l'ajoute en tête d'un corps qui n'en a pas. */
export function withNotionLink(body: string, url: string): string {
  const line = `Notion : ${url}`;
  return NOTION_LINE.test(body)
    ? body.replace(NOTION_LINE, line)
    : `${line}\n\n${body}`;
}

// ---- implémentation ----

const NOTION_LINE = /^Notion : .*$/m;
