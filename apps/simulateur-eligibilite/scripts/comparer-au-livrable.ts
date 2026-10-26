// Dit si les fichiers recopiés du livrable de l'éditeur sont identiques à
// l'octet près (D-70). Le dépôt n'en garde que trois, dans
// `core/models/eligibilite/rules/` : le YAML du modèle, `VERSION` et
// `catalogue-resultats.json` (D-103). À lancer après chaque recopie :
//
//   pnpm livrable ../../tmp/<version>
//
// Le script compare chaque recopie au manifeste du livrable,
// `MANIFEST_LIVRAISON_SHA256.json`. Il ne lit rien d'autre du livrable et n'y
// écrit rien : son inventaire doit rester exact. Il sort en erreur sur le
// moindre écart.

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Où vivent les recopies. Un second argument en donne un autre, pour les tests. */
const REGLES = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../core/models/eligibilite/rules",
);

type Manifeste = { version: string; files: Record<string, string> };

/** Ce qui ne va pas dans une recopie. Une liste vide : elle est fidèle. */
type Controle = { fichier: string; ecarts: string[] };

const [livrable, regles = REGLES] = process.argv.slice(2);
if (livrable === undefined) {
  console.error("Usage : pnpm livrable <dossier du livrable>");
  process.exit(2);
}
const manifeste = lireManifeste(livrable);
const controles = [
  recopie(
    "regles.publicodes",
    `transports-sanitaires.publicodes.v${manifeste.version}.yaml`,
  ),
  version(),
  recopie(
    "catalogue-resultats.json",
    "integration_resultats/catalogue-resultats.json",
  ),
  empreinte(),
];
for (const { fichier, ecarts } of controles) {
  console.log(
    ecarts.length === 0
      ? `✓ ${fichier}`
      : `✗ ${fichier} : ${ecarts.join(" ; ")}`,
  );
}
process.exit(controles.some(({ ecarts }) => ecarts.length > 0) ? 1 : 0);

// ---- implémentation ----

function lireManifeste(dossier: string): Manifeste {
  return JSON.parse(
    readFileSync(join(dossier, "MANIFEST_LIVRAISON_SHA256.json"), "utf-8"),
  ) as Manifeste;
}

/** Une recopie a l'empreinte que le manifeste donne à son original. */
function recopie(fichier: string, original: string): Controle {
  const attendue = manifeste.files[original];
  if (attendue === undefined) {
    return { fichier, ecarts: [`${original} manque au manifeste`] };
  }
  const ecarts =
    sha256(lire(fichier)) === attendue ? [] : [`diffère de ${original}`];
  return { fichier, ecarts };
}

/** `VERSION` porte la version du livrable, suivie d'un saut de ligne. */
function version(): Controle {
  const attendu = `${manifeste.version}\n`;
  const lu = lire("VERSION").toString("utf-8");
  return {
    fichier: "VERSION",
    ecarts:
      lu === attendu
        ? []
        : [`vaut ${JSON.stringify(lu)}, pas ${JSON.stringify(attendu)}`],
  };
}

/** Le catalogue porte l'empreinte du YAML recopié (décision A, #131). */
function empreinte(): Controle {
  const attendue = sha256(lire("regles.publicodes"));
  const lue = modelSha256DuCatalogue();
  return {
    fichier: "modelSha256",
    ecarts:
      lue === attendue
        ? []
        : [`le catalogue porte ${lue}, le YAML a pour empreinte ${attendue}`],
  };
}

/** Le `modelSha256` du catalogue recopié, ou ce qui empêche de le lire. */
function modelSha256DuCatalogue(): string {
  try {
    const catalogue = JSON.parse(lire("catalogue-resultats.json").toString());
    return String(catalogue.modelSha256);
  } catch {
    return "un JSON illisible";
  }
}

function lire(fichier: string): Buffer {
  return readFileSync(join(regles, fichier));
}

function sha256(octets: Buffer): string {
  return createHash("sha256").update(octets).digest("hex");
}
