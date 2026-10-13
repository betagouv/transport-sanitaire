// Les worktrees du clone : le dossier où chaque branche est extraite.

import path from "node:path";
import { git } from "./git.ts";

export type Worktree = {
  /** Son dossier, relatif au clone principal. `.` pour le clone lui-même. */
  dir: string;
  /** Absente sur une tête détachée. */
  branch?: string;
};

/** Les worktrees, le clone principal en premier. */
export function listWorktrees(root: string): Worktree[] {
  const blocks = git(root, ["worktree", "list", "--porcelain"]).split("\n\n");
  const main = value(blocks[0]!, "worktree") ?? root;
  return blocks.flatMap((block) => {
    const dir = value(block, "worktree");
    if (dir === undefined) return [];
    const branch = value(block, "branch")?.replace(/^refs\/heads\//, "");
    return [{ dir: path.relative(main, dir) || ".", branch }];
  });
}

// ---- implémentation ----

/** Ce qui suit `clé ` sur une ligne de `git worktree list --porcelain`. */
function value(block: string, key: string): string | undefined {
  const line = block.split("\n").find((each) => each.startsWith(`${key} `));
  return line?.slice(key.length + 1);
}
