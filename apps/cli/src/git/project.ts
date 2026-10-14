// Le GitHub Project du dépôt, tel que GitHub le tient : ses colonnes, ses
// cartes. Y ajouter une issue, déplacer une carte, en archiver une.

import { captureProgram } from "../core/run-program.ts";

export type Project = {
  id: string;
  /** Le champ dont les valeurs sont les colonnes du kanban. */
  fieldId: string;
  /** L'identifiant de chaque colonne, par son nom. */
  columns: Map<string, string>;
  /** Les cartes d'issue, hors archivées. */
  cards: Card[];
};

export type Card = {
  id: string;
  /** L'adresse de l'issue : c'est elle qui relie la carte à l'issue. */
  url: string;
  /** Rien tant qu'aucune colonne n'est posée. */
  column?: string;
};

/** Lève une erreur si `gh` échoue, par exemple sans le droit `project`. */
export function readProject(root: string): Project {
  const { id } = ghJson<{ id: string }>(root, ["view", NUMBER]);
  const { fields } = ghJson<{ fields: GhField[] }>(root, [
    "field-list",
    NUMBER,
  ]);
  const status = fields.find((field) => field.name === STATUS);
  if (!status?.options) {
    throw new Error(`le Project n'a pas de champ « ${STATUS} » à options`);
  }
  const { items } = ghJson<{ items: GhItem[] }>(root, [
    "item-list",
    NUMBER,
    "--limit",
    "1000",
  ]);
  return {
    id,
    fieldId: status.id,
    columns: new Map(status.options.map((option) => [option.name, option.id])),
    cards: items.filter((item) => item.content?.type === "Issue").map(toCard),
  };
}

/** Ajoute l'issue au Project et rend sa carte, encore sans colonne. */
export function addCard(root: string, url: string): Card {
  const { id } = ghJson<{ id: string }>(root, [
    "item-add",
    NUMBER,
    "--url",
    url,
  ]);
  return { id, url };
}

export function moveCard(
  root: string,
  project: Project,
  card: Card,
  column: string,
): void {
  const option = project.columns.get(column);
  if (!option) throw new Error(`le Project n'a pas de colonne « ${column} »`);
  gh(root, [
    "project",
    "item-edit",
    "--id",
    card.id,
    "--project-id",
    project.id,
    "--field-id",
    project.fieldId,
    "--single-select-option-id",
    option,
  ]);
}

export function archiveCard(root: string, card: Card): void {
  gh(root, ["project", "item-archive", NUMBER, ...OWNER, "--id", card.id]);
}

// ---- implémentation ----

/** Le Project « Transport Sanitaire » de l'organisation. Il est privé. */
const OWNER = ["--owner", "betagouv"];
const NUMBER = "188";

/** Le champ natif de GitHub, dont les options sont les colonnes. */
const STATUS = "Status";

type GhField = {
  id: string;
  name: string;
  options?: { id: string; name: string }[];
};

/** `gh` nomme la valeur d'un champ d'après le nom du champ, en minuscules. */
type GhItem = {
  id: string;
  status?: string;
  content?: { type: string; url: string };
};

function toCard(item: GhItem): Card {
  return { id: item.id, url: item.content!.url, column: item.status };
}

/** Une sous-commande de `gh project` qui répond en JSON. */
function ghJson<T>(root: string, args: string[]): T {
  const [verb, ...rest] = args;
  const stdout = gh(root, [
    "project",
    verb!,
    ...rest,
    ...OWNER,
    "--format",
    "json",
  ]);
  return JSON.parse(stdout) as T;
}

/** Ce que `gh` répond. Lève une erreur s'il échoue. */
function gh(root: string, args: string[]): string {
  const result = captureProgram("gh", args, root);
  if (result.code !== 0) {
    throw new Error(`gh ${args.slice(0, 2).join(" ")} : ${result.stderr}`);
  }
  return result.stdout;
}
