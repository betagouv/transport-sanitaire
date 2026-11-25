// @vitest-environment node
//
// Le métier d'un modèle porte ses résultats : sous Node, sans Vite ni écran, il
// sait quelles questions ne pas poser, ce que dit R2 en donnée, et ce que vaut
// le document de R3. Le test lance Node sur `core/models/eligibilite/index.ts`
// seul : aucun fichier de `front/` n'y entre.

import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { racine } from "../inspection-des-sources";

type Bilan = {
  avecPertinence: boolean;
  posees: string[];
  poseesSansPertinence: string[];
  r2: { cas: string; issue?: string };
  document: string | null;
  titre: string;
  champs: Record<string, unknown>;
};

// Un patient seul, aidé de soins que Q2.2.1.b dit : l'écran ne lui pose, de la
// distance, que la ligne régulière (`filtrage-par-le-graphe.test.ts`).
const AVEC_UN_SAMSAH = {
  "Q0.1": "1_VERIFIER",
  "Q1.1": "1_SEUL",
  "Q1.3": ["7_AUCUNE"],
  "Q1.4": "1_VEHICULE_PERSONNEL",
  "Q2.1": "1_CONSULTATION",
  "Q2.2.1": ["0_AUCUNE"],
  "Q2.2.1.b": ["7_SAMSAH"],
};
const DISTANCE = ["Q2.3.1", "Q2.3.2", "Q2.3.3"];

describe("le métier de l'éligibilité, seul sous Node", () => {
  describe("des réponses où l'écran saute des questions", () => {
    const bilan = jouer({ answers: AVEC_UN_SAMSAH });

    it("a une pertinence", () => {
      expect(bilan.avecPertinence).toBe(true);
    });

    it("saute les mêmes questions que l'écran", () => {
      expect(bilan.posees.filter((id) => DISTANCE.includes(id))).toEqual([
        "Q2.3.2",
      ]);
    });

    it("poserait la distance sans pertinence", () => {
      expect(bilan.poseesSansPertinence).toContain("Q2.3.1");
    });
  });

  describe("une seed acceptée", () => {
    const bilan = jouer({ seed: "issue-pmt" });

    it("calcule R2 en donnée", () => {
      expect(bilan.r2).toMatchObject({ cas: "acceptée", issue: "ISSUE_PMT" });
    });

    it("choisit le document, son titre et ses valeurs", () => {
      expect(bilan.document).toBe("S3138g");
      expect(bilan.titre).toBe("Prescription préremplie prête à imprimer");
      expect(Object.keys(bilan.champs).length).toBeGreaterThan(0);
    });
  });
});

// ---- implémentation ----

// Le script que Node exécute : il n'importe que des fichiers de `core/`.
const SCRIPT = `
const { seed: seedId, answers } = JSON.parse(process.argv[1]);
const { model } = await import("./core/models/eligibilite/index.ts");
const { Simulation } = await import("./core/socle/simulation/index.ts");
const { CerfaDtoService } = await import("./core/socle/cerfa/index.ts");
const reponses = answers ??
  (await model.seeds()).find(({ id }) => id === seedId).answers;
const posees = (simulation) =>
  simulation.pages().flatMap((page) =>
    simulation.questionsOn(page).map(({ id }) => id),
  );
const { relevance, ...sansPertinence } = model;
const simulation = Simulation.resume(model, reponses);
const contexte = simulation.resultContext(new Date());
const r2 = await model.result.compute(model.result.reading.in(contexte));
const document = model.cerfa.document.in(contexte);
const dto = document && CerfaDtoService.from(model.cerfa.values[document], contexte);
console.log(JSON.stringify({
  avecPertinence: relevance !== undefined,
  posees: posees(simulation),
  poseesSansPertinence: posees(Simulation.resume(sansPertinence, reponses)),
  r2: { cas: r2.cas, issue: r2.issue },
  document,
  titre: model.cerfa.title.in(contexte),
  champs: dto ? dto.fields : {},
}));
`;

function jouer(entree: { seed: string } | { answers: object }): Bilan {
  const sortie = execFileSync(
    process.execPath,
    ["--input-type=module", "--eval", SCRIPT, JSON.stringify(entree)],
    { cwd: racine, encoding: "utf-8" },
  );
  return JSON.parse(sortie) as Bilan;
}
