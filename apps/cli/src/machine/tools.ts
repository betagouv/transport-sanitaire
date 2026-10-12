// Les outils du projet, hors du dépôt : les lister, en ouvrir un dans le
// navigateur.

import fs from "node:fs";
import path from "node:path";
import type { Invocation } from "../core/invocation.ts";
import { columns, emit, print, printError } from "../core/output.ts";
import { captureProgram } from "../core/run-program.ts";
import { TOOLS_FILE } from "./local-files.ts";

/** `tsp open`, `tsp open <outil> […]` */
export function openCommand(invocation: Invocation): number {
  const { root, args, options } = invocation;
  const tools = readTools(root);
  if (args.length === 0) {
    emit(options.json, tools, render);
    return 0;
  }
  for (const name of args) {
    const tool = findTool(tools, name);
    if (!tool) {
      printError(unknownTool(tools, name));
      return 1;
    }
    const code = openInBrowser(tool, root);
    if (code !== 0) return code;
  }
  return 0;
}

// ---- implémentation ----

type Tool = { name: string; description: string; url: string };

function readTools(root: string): Tool[] {
  const file = path.join(root, TOOLS_FILE);
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, "utf8")) as Tool[];
}

/** Par son nom, ou par un début de nom sans ambiguïté. */
function findTool(tools: Tool[], name: string): Tool | undefined {
  const exact = tools.find((tool) => tool.name === name);
  if (exact) return exact;
  const close = tools.filter((tool) => tool.name.startsWith(name));
  return close.length === 1 ? close[0] : undefined;
}

function unknownTool(tools: Tool[], name: string): string {
  if (tools.length === 0) return `Aucun outil : ${hint()}`;
  const names = tools.map((tool) => tool.name).join(", ");
  return `Outil inconnu ou ambigu : « ${name} ». Outils : ${names}.`;
}

/** L'adresse est toujours affichée : si rien ne s'ouvre, elle se copie. */
function openInBrowser(tool: Tool, root: string): number {
  print(`${tool.name} : ${tool.url}`);
  const opener = process.platform === "darwin" ? "open" : "xdg-open";
  const result = captureProgram(opener, [tool.url], root);
  if (result.code !== 0) {
    printError(`${opener} n'a rien ouvert : ${result.stderr}`);
  }
  return result.code;
}

function render(tools: Tool[]): string {
  if (tools.length === 0) return `Aucun outil : ${hint()}`;
  return columns(tools.map((tool) => [tool.name, tool.description, tool.url]));
}

function hint(): string {
  return `${TOOLS_FILE} est absent ou vide. tsp setup le crée depuis son gabarit.`;
}
