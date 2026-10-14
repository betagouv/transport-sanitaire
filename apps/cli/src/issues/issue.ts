// Tenir les chantiers par leurs issues GitHub : lister ceux qui sont ouverts,
// montrer l'avancement de l'un d'eux, en ouvrir un, lui ajouter une tâche,
// projeter le tableau et synchroniser les tickets Notion.

import type { Command, Invocation } from "../core/invocation.ts";
import { emit, printError } from "../core/output.ts";
import {
  findChantier,
  isOpen,
  readSuivi,
  renderChantiers,
} from "./chantiers.ts";
import { addCommand, newCommand } from "./new.ts";
import { syncCommand } from "./sync.ts";
import { withTableau } from "./tableau.ts";

/** `tsp issue list`, `show`, `new`, `add`, `sync` */
export function issueCommand(invocation: Invocation): number | Promise<number> {
  const [verb, ...args] = invocation.args;
  const command = verb === undefined ? undefined : VERBS[verb];
  if (!command) {
    printError(`Usage : tsp issue <${Object.keys(VERBS).join("|")}> …`);
    return 1;
  }
  return command({ ...invocation, args });
}

// ---- implémentation ----

const VERBS: Record<string, Command> = {
  list: listCommand,
  show: showCommand,
  new: withTableau(newCommand),
  add: withTableau(addCommand),
  sync: syncCommand,
};

const GH_SILENT = "GitHub : gh ne répond pas.";

/** Les chantiers ouverts, sans leurs tâches : l'avancement de chacun suffit. */
function listCommand(invocation: Invocation): number {
  const suivi = readSuivi(invocation.root);
  if (!suivi) {
    printError(GH_SILENT);
    return 1;
  }
  const open = suivi.chantiers.filter(isOpen);
  emit(invocation.options.json, open, (chantiers) =>
    chantiers.length === 0
      ? "Aucun chantier ouvert."
      : renderChantiers(chantiers, () => false),
  );
  return 0;
}

function showCommand(invocation: Invocation): number {
  const number = Number(invocation.args[0]?.replace(/^#/, ""));
  if (!Number.isInteger(number)) {
    printError("Usage : tsp issue show <numéro>, ex. tsp issue show 42.");
    return 1;
  }
  const suivi = readSuivi(invocation.root);
  if (!suivi) {
    printError(GH_SILENT);
    return 1;
  }
  const chantier = findChantier(suivi.chantiers, number);
  if (!chantier) {
    printError(`Aucune issue ne porte le numéro ${number}.`);
    return 1;
  }
  emit(invocation.options.json, chantier, (found) => renderChantiers([found]));
  return 0;
}
