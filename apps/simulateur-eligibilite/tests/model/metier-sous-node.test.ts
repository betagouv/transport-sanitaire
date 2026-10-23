// @vitest-environment node
//
// Le métier d'un modèle se charge sous Node, sans Vite ni navigateur : un
// script ou le serveur peuvent calculer une préconisation. Le test lance Node
// sur `core/models/<nom>/index.ts`, rejoue les seeds qui annoncent des
// attendus, et compte celles que la préconisation dément.

import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { racine } from "../inspection-des-sources";

describe.each(readdirSync(join(racine, "core/models")))(
  "le métier du modèle %s",
  (nom) => {
    it("se charge sous Node et confirme ses seeds", () => {
      const { rejouees, dementies } = rejouerSousNode(nom);
      expect(rejouees).toBeGreaterThan(0);
      expect(
        dementies,
        "Une seed démentie sous Node l'est aussi à l'écran : " +
          "`tests/model/conformite.test.ts` dit laquelle.",
      ).toEqual([]);
    });
  },
);

// ---- implémentation ----

type Bilan = { rejouees: number; dementies: string[] };

// Le script que Node exécute : il n'importe que des fichiers de `core/`.
const SCRIPT = `
const [nom] = process.argv.slice(1);
const { model } = await import(\`./core/models/\${nom}/index.ts\`);
const { preconisationOf } = await import("./core/socle/model.ts");
const { evaluateSeed } = await import("./core/socle/seeds/seed.ts");
const avecAttendus = (await model.seeds()).filter(
  (seed) => Object.keys(seed.expected).length > 0,
);
const preconise = (answers) => preconisationOf(model, answers).cibles;
const dementies = avecAttendus
  .filter((seed) => evaluateSeed(preconise, seed).mismatches.length > 0)
  .map((seed) => seed.id);
console.log(JSON.stringify({ rejouees: avecAttendus.length, dementies }));
`;

function rejouerSousNode(nom: string): Bilan {
  const sortie = execFileSync(
    process.execPath,
    ["--input-type=module", "--eval", SCRIPT, nom],
    { cwd: racine, encoding: "utf-8" },
  );
  return JSON.parse(sortie) as Bilan;
}
