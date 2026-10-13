// Les chantiers : une issue et ses sous-issues en arbre, l'état de chacune, et
// l'endroit où son travail se trouve.

import { columns } from "../core/output.ts";
import { type Issue, readIssues } from "../git/issues.ts";
import { listPullRequests, type PullRequest } from "../git/pull-requests.ts";
import { type Lieu, readLieux, renderLieu } from "./lieux.ts";

/** Jamais rédigé : déduit de l'issue, de ses blocages, de sa branche et de sa PR. */
export type Etat = "à faire" | "bloquée" | "en cours" | "fait" | "abandonnée";

/** Une issue et ses sous-issues. Sans sous-issue, c'est une tâche : elle tient en une PR. */
export type Chantier = {
  number: number;
  title: string;
  url: string;
  etat: Etat;
  /** Les issues encore ouvertes qui la bloquent. */
  bloqueePar: number[];
  /** Où son travail se trouve, tant qu'elle est ouverte. */
  lieu?: Lieu;
  taches: Chantier[];
  /** Les tâches faites sous elle, elle comprise si elle n'en a pas. */
  fait: number;
  /** Les tâches à faire ou faites, sans les abandonnées. */
  total: number;
};

export type Suivi = {
  issues: Issue[];
  prs: PullRequest[];
  lieux: Lieu[];
  /** Les issues sans parente, ouvertes ou fermées. */
  chantiers: Chantier[];
};

/** Rien si `gh` ne répond pas. */
export function readSuivi(root: string): Suivi | undefined {
  const issues = readIssues(root);
  const prs = listPullRequests(root);
  if (!issues || !prs) return undefined;
  const lieux = readLieux(root, issues, prs);
  const byNumber = new Map(issues.map((issue) => [issue.number, issue]));
  const chantiers = issues
    .filter((issue) => issue.parent === undefined)
    .sort((a, b) => a.number - b.number)
    .map((issue) => toChantier(issue, byNumber, lieux));
  return { issues, prs, lieux, chantiers };
}

/** Le chantier de ce numéro, ou la tâche qui le porte dans un chantier. */
export function findChantier(
  chantiers: Chantier[],
  number: number,
): Chantier | undefined {
  for (const chantier of chantiers) {
    if (chantier.number === number) return chantier;
    const within = findChantier(chantier.taches, number);
    if (within) return within;
  }
  return undefined;
}

export function isOpen(chantier: Chantier): boolean {
  return chantier.etat !== "fait" && chantier.etat !== "abandonnée";
}

/** Vrai pour un chantier dont une tâche est dans cet état. */
export function hasTache(etat: Etat): (chantier: Chantier) => boolean {
  return function has(chantier) {
    if (chantier.taches.length === 0) return chantier.etat === etat;
    return chantier.taches.some(has);
  };
}

/** Un arbre par chantier. `keep` choisit les tâches montrées sous chacun. */
export function renderChantiers(
  chantiers: Chantier[],
  keep: (tache: Chantier) => boolean = () => true,
): string {
  return columns(chantiers.flatMap((chantier) => rows(chantier, 0, keep)));
}

// ---- implémentation ----

function toChantier(
  issue: Issue,
  byNumber: Map<number, Issue>,
  lieux: Lieu[],
): Chantier {
  const taches = issue.subIssues.flatMap((number) => {
    const sub = byNumber.get(number);
    return sub ? [toChantier(sub, byNumber, lieux)] : [];
  });
  const lieu = issue.closed
    ? undefined
    : lieux.find((each) => each.issue === issue.number);
  const etat = etatOf(issue, taches, lieu);
  return {
    number: issue.number,
    title: issue.title,
    url: issue.url,
    etat,
    bloqueePar: issue.blockedBy,
    lieu,
    taches,
    ...progress(etat, taches),
  };
}

/** Un travail commencé l'emporte sur un blocage : c'est ce qui se passe vraiment. */
function etatOf(
  issue: Issue,
  taches: Chantier[],
  lieu: Lieu | undefined,
): Etat {
  if (issue.closed) return issue.abandoned ? "abandonnée" : "fait";
  if (lieu || taches.some(hasStarted)) return "en cours";
  return issue.blockedBy.length > 0 ? "bloquée" : "à faire";
}

function hasStarted(tache: Chantier): boolean {
  return tache.etat === "en cours" || tache.etat === "fait";
}

function progress(
  etat: Etat,
  taches: Chantier[],
): { fait: number; total: number } {
  if (taches.length === 0) {
    return {
      fait: etat === "fait" ? 1 : 0,
      total: etat === "abandonnée" ? 0 : 1,
    };
  }
  return {
    fait: taches.reduce((sum, tache) => sum + tache.fait, 0),
    total: taches.reduce((sum, tache) => sum + tache.total, 0),
  };
}

function rows(
  chantier: Chantier,
  depth: number,
  keep: (tache: Chantier) => boolean,
): string[][] {
  const name = `${"  ".repeat(depth)}#${chantier.number} ${chantier.title}`;
  const row = [name, etatLabel(chantier), ...renderLieu(chantier.lieu)];
  const below = chantier.taches
    .filter(keep)
    .flatMap((tache) => rows(tache, depth + 1, keep));
  return [row, ...below];
}

function etatLabel(chantier: Chantier): string {
  if (chantier.taches.length > 0) {
    return `${chantier.etat} ${chantier.fait}/${chantier.total}`;
  }
  if (chantier.etat !== "bloquée") return chantier.etat;
  const blockers = chantier.bloqueePar.map((number) => `#${number}`);
  return `bloquée par ${blockers.join(", ")}`;
}
