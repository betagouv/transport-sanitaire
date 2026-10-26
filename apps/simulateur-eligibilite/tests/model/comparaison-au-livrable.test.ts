// @vitest-environment node
//
// `pnpm livrable <dossier>` dit si les fichiers recopiés du livrable de
// l'éditeur sont identiques à l'octet près (D-70). Le test fabrique un livrable
// et sa recopie, puis lance le script comme on le lance à la main.

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { racine } from "../inspection-des-sources";

describe("la comparaison au livrable", () => {
  it("passe sur une recopie fidèle", () => {
    const { livrable, regles } = livraison();
    expect(comparer(livrable, regles).status).toBe(0);
  });

  it.each(["regles.publicodes", "VERSION", "catalogue-resultats.json"])(
    "échoue sur un caractère modifié dans %s",
    (fichier) => {
      const { livrable, regles } = livraison();
      modifierUnCaractere(join(regles, fichier));
      const { status, stdout } = comparer(livrable, regles);
      expect(status).toBe(1);
      expect(stdout).toContain(`✗ ${fichier}`);
    },
  );

  it("échoue si le catalogue ne porte pas l'empreinte du YAML", () => {
    const { livrable, regles } = livraison({ modelSha256: "0".repeat(64) });
    const { status, stdout } = comparer(livrable, regles);
    expect(status).toBe(1);
    expect(stdout).toContain("✗ modelSha256");
  });

  it("n'écrit rien dans le livrable", () => {
    const { livrable, regles } = livraison();
    modifierUnCaractere(join(regles, "VERSION"));
    const avant = inventaire(livrable);
    comparer(livrable, regles);
    expect(inventaire(livrable)).toEqual(avant);
  });
});

// ---- implémentation ----

const VERSION = "1.2.3";
const YAML = `transports-sanitaires.publicodes.v${VERSION}.yaml`;
const CATALOGUE = "integration_resultats/catalogue-resultats.json";

type Livraison = { livrable: string; regles: string };

/**
 * Un livrable de l'éditeur, son manifeste, et la recopie de ses trois fichiers.
 * Le catalogue porte l'empreinte du YAML, sauf si on lui en donne une autre.
 */
function livraison({ modelSha256 = "" } = {}): Livraison {
  const dossier = mkdtempSync(join(tmpdir(), "livrable-"));
  const livrable = join(dossier, VERSION);
  const regles = join(dossier, "rules");
  const modele = "regle:\n  valeur: oui\n";
  const catalogue = `${JSON.stringify({ packageVersion: VERSION, modelSha256: modelSha256 || sha256(modele) }, null, 2)}\n`;
  ecrire(livrable, YAML, modele);
  ecrire(livrable, CATALOGUE, catalogue);
  ecrire(
    livrable,
    "MANIFEST_LIVRAISON_SHA256.json",
    JSON.stringify({
      version: VERSION,
      files: { [YAML]: sha256(modele), [CATALOGUE]: sha256(catalogue) },
    }),
  );
  ecrire(regles, "regles.publicodes", modele);
  ecrire(regles, "VERSION", `${VERSION}\n`);
  ecrire(regles, "catalogue-resultats.json", catalogue);
  return { livrable, regles };
}

function comparer(livrable: string, regles: string) {
  return spawnSync(
    process.execPath,
    ["scripts/comparer-au-livrable.ts", livrable, regles],
    { cwd: racine, encoding: "utf-8" },
  );
}

function ecrire(dossier: string, fichier: string, contenu: string): void {
  const chemin = join(dossier, fichier);
  mkdirSync(join(chemin, ".."), { recursive: true });
  writeFileSync(chemin, contenu);
}

/** Change la première lettre ou le premier chiffre du fichier. */
function modifierUnCaractere(chemin: string): void {
  const texte = readFileSync(chemin, "utf-8");
  writeFileSync(
    chemin,
    texte.replace(/[0-9a-z]/i, (c) => (c === "x" ? "y" : "x")),
  );
}

/** Chaque fichier du dossier, avec sa taille et sa date de modification. */
function inventaire(dossier: string): string[] {
  return readdirSync(dossier, { recursive: true, encoding: "utf-8" })
    .sort()
    .map((fichier) => {
      const { size, mtimeMs } = statSync(join(dossier, fichier));
      return `${fichier} ${size} ${mtimeMs}`;
    });
}

function sha256(contenu: string): string {
  return createHash("sha256").update(contenu).digest("hex");
}
