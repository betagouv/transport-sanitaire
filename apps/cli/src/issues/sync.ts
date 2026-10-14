// Projeter le tableau, puis tenir le ticket Notion d'un chantier : le créer,
// puis faire avancer son statut. L'issue fait foi, à sens unique. Notion ne
// porte que le suivi macro : les tâches n'y ont pas de ticket.

import type { Invocation } from "../core/invocation.ts";
import { section } from "../core/markdown.ts";
import { print, printError, section as titled } from "../core/output.ts";
import { type Issue, writeIssueBody } from "../git/issues.ts";
import {
  advances,
  type Block,
  createTicket,
  type Notion,
  notionAccess,
  readTicket,
  ticketId,
  updateTicket,
} from "../notion/notion.ts";
import {
  type Chantier,
  type Etat,
  readSuivi,
  type Suivi,
} from "./chantiers.ts";
import { withNotionLink } from "./notion-link.ts";
import { projectSuivi } from "./tableau.ts";

/**
 * `tsp issue sync [n]` : le tableau d'abord, toujours en entier, puis le ticket
 * Notion du chantier `n`, ou de tous.
 */
export async function syncCommand(invocation: Invocation): Promise<number> {
  const { root, args } = invocation;
  const suivi = readSuivi(root);
  if (!suivi) {
    printError("GitHub : gh ne répond pas.");
    return 1;
  }
  const projected = syncTableau(root, suivi);
  const synced = await syncNotion(root, suivi, args[0]);
  return projected && synced === 0 ? 0 : 1;
}

// ---- implémentation ----

/** Dit ce qui a bougé sur le tableau. Rend faux s'il ne répond pas. */
function syncTableau(root: string, suivi: Suivi): boolean {
  try {
    const moved = projectSuivi(root, suivi);
    print(
      moved.length === 0
        ? "Tableau : à jour"
        : titled("Tableau", moved.join("\n")),
    );
    return true;
  } catch (error) {
    printError(`Tableau : ${(error as Error).message}`);
    return false;
  }
}

async function syncNotion(
  root: string,
  suivi: Suivi,
  asked?: string,
): Promise<number> {
  const notion = notionAccess(root);
  if (typeof notion === "string") {
    printError(
      `Notion : ${notion}. Renseigne NOTION_TOKEN et NOTION_DATABASE_ID dans .env.`,
    );
    return 1;
  }
  const chantiers = chantiersToSync(suivi, asked);
  if (chantiers.length === 0) {
    printError(
      `Aucun chantier à synchroniser${asked ? ` : « ${asked} »` : ""}.`,
    );
    return 1;
  }
  return syncAll(root, notion, suivi, chantiers);
}

/** `Reviewing dev` et `Prod / Done` se posent à la main. Un chantier abandonné ne pose rien. */
const STATUT_BY_ETAT: Record<Etat, string | undefined> = {
  "à faire": "Ready To Dev",
  bloquée: "Ready To Dev",
  "en cours": "Doing Dev",
  fait: "Staging",
  abandonnée: undefined,
};

/** Les sections de l'issue recopiées dans le corps du ticket, à sa création. */
const COPIED_SECTIONS = ["Problème", "Solution"];

/**
 * Sans numéro : les chantiers ouverts, et les fermés qui ont un ticket à faire
 * avancer. Une tâche ne se synchronise pas : seule une issue sans parente.
 */
function chantiersToSync(suivi: Suivi, asked?: string): Chantier[] {
  if (asked !== undefined) {
    const number = Number(asked.replace(/^#/, ""));
    return suivi.chantiers.filter((chantier) => chantier.number === number);
  }
  return suivi.chantiers.filter(
    (chantier) =>
      STATUT_BY_ETAT[chantier.etat] !== "Staging" ||
      chantier.notion !== undefined,
  );
}

async function syncAll(
  root: string,
  notion: Notion,
  suivi: Suivi,
  chantiers: Chantier[],
): Promise<number> {
  let failures = 0;
  for (const chantier of chantiers) {
    const issue = issueOf(suivi, chantier);
    try {
      const done = await syncChantier(root, notion, chantier, issue);
      print(`#${chantier.number}  ${done}`);
    } catch (error) {
      failures += 1;
      printError(`#${chantier.number}  ${(error as Error).message}`);
    }
  }
  return failures === 0 ? 0 : 1;
}

/** Crée ou met à jour le ticket d'un chantier, et dit ce qui a été fait. */
async function syncChantier(
  root: string,
  notion: Notion,
  chantier: Chantier,
  issue: Issue,
): Promise<string> {
  if (chantier.brouillon) return "brouillon, pas de ticket";
  const statut = STATUT_BY_ETAT[chantier.etat];
  if (chantier.notion) return refresh(notion, issue, chantier.notion, statut);
  if (!statut) return `${chantier.etat}, pas de ticket`;
  const ticket = await createTicket(notion, {
    title: issue.title,
    statut,
    link: issue.url,
    body: blocks(issue.body),
  });
  writeIssueBody(root, issue.number, withNotionLink(issue.body, ticket.url));
  return `ticket créé (${statut}), lien écrit dans l'issue : ${ticket.url}`;
}

/** Le corps du ticket n'est jamais réécrit, et son statut ne recule jamais. */
async function refresh(
  notion: Notion,
  issue: Issue,
  link: string,
  statut: string | undefined,
): Promise<string> {
  const id = ticketId(link);
  if (!id) return `lien Notion illisible : ${link}`;
  const current = await readTicket(notion, id);
  const forward = statut !== undefined && advances(current.statut, statut);
  await updateTicket(notion, id, {
    title: issue.title,
    link: issue.url,
    statut: forward ? statut : undefined,
  });
  return forward
    ? `ticket mis à jour (${current.statut} → ${statut})`
    : `ticket mis à jour (statut gardé : ${current.statut})`;
}

function issueOf(suivi: Suivi, chantier: Chantier): Issue {
  return suivi.issues.find((issue) => issue.number === chantier.number)!;
}

function blocks(body: string): Block[] {
  return COPIED_SECTIONS.flatMap((heading) => {
    const text = section(body.replaceAll("\r", ""), heading);
    if (text === "") return [];
    const paragraphs = text
      .split(/\n{2,}/)
      .map((each): Block => ({ kind: "paragraph", text: each }));
    return [{ kind: "heading", text: heading }, ...paragraphs];
  });
}
