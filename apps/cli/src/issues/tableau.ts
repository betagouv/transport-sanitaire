// Le tableau des chantiers : le GitHub Project du dépôt, projeté depuis l'état
// que `tsp` déduit des issues. À sens unique : une carte déplacée à la main
// reprend sa place à la projection suivante.

import type { Command, Invocation } from "../core/invocation.ts";
import { printError } from "../core/output.ts";
import {
  addCard,
  archiveCard,
  moveCard,
  type Project,
  readProject,
} from "../git/project.ts";
import {
  type Chantier,
  type Etat,
  isOpen,
  readSuivi,
  type Suivi,
} from "./chantiers.ts";

/**
 * Pose chaque issue dans la colonne de son état, et dit ce qui a bougé. Une
 * issue ouverte absente du tableau y est ajoutée, une abandonnée en est
 * archivée. Lève une erreur si le tableau ne répond pas.
 */
export function projectSuivi(root: string, suivi: Suivi): string[] {
  const project = readProject(root);
  return everyIssue(suivi.chantiers).flatMap((chantier) =>
    placeCard(root, project, chantier),
  );
}

/**
 * Lance la commande, puis projette le tableau si elle a réussi. Le tableau ne
 * fait jamais échouer la commande. Il écrit sur la sortie d'erreur, pour
 * laisser la sortie standard à ce que la commande rend.
 */
export function withTableau(
  command: Command,
  when: (invocation: Invocation) => boolean = () => true,
): Command {
  return async (invocation) => {
    const code = await command(invocation);
    if (code === 0 && when(invocation)) refresh(invocation.root);
    return code;
  };
}

// ---- implémentation ----

/** Une issue abandonnée n'a pas de colonne : elle quitte le tableau. */
const COLUMNS: Record<Etat, string | undefined> = {
  "à faire": "À faire",
  bloquée: "Bloquée",
  "en cours": "En cours",
  fait: "Fait",
  abandonnée: undefined,
};

/** Ce que la projection a fait pour une issue, rien si sa carte était à sa place. */
function placeCard(
  root: string,
  project: Project,
  chantier: Chantier,
): string[] {
  const column = columnOf(chantier);
  const card = project.cards.find((each) => each.url === chantier.url);
  const name = `#${chantier.number}`;
  if (column === undefined) {
    if (!card) return [];
    archiveCard(root, card);
    return [`${name} archivée`];
  }
  // Une issue fermée hors du tableau y a été archivée : elle n'y revient pas.
  if (!card && !isOpen(chantier)) return [];
  const placed = card ?? addCard(root, chantier.url);
  if (placed.column === column) return [];
  moveCard(root, project, placed, column);
  if (!card) return [`${name} ajoutée en ${column}`];
  return [`${name} ${placed.column ?? "sans colonne"} → ${column}`];
}

/** Un brouillon ne se distingue qu'à faire : commencé, il est en cours comme un autre. */
function columnOf(chantier: Chantier): string | undefined {
  if (chantier.brouillon && chantier.etat === "à faire") return "Brouillon";
  return COLUMNS[chantier.etat];
}

/** Les chantiers et leurs tâches, à tous les niveaux. */
function everyIssue(chantiers: Chantier[]): Chantier[] {
  return chantiers.flatMap((chantier) => [
    chantier,
    ...everyIssue(chantier.taches),
  ]);
}

function refresh(root: string): void {
  try {
    const suivi = readSuivi(root);
    if (!suivi) throw new Error("gh ne répond pas");
    const moved = projectSuivi(root, suivi);
    printError(
      `Tableau : ${moved.length === 0 ? "à jour" : moved.join(", ")}.`,
    );
  } catch (error) {
    printError(`Tableau : ${(error as Error).message}`);
  }
}
