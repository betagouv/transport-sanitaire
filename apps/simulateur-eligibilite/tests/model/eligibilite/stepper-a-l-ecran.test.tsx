// Le stepper et le titre du résultat du modèle de l'éditeur, comme à l'écran
// (#219) : le vrai simulateur, ouvert sur une seed. Chaque partie titre son
// stepper ; P0 et P1 annoncent la suivante, P2 et P3 rien. Le titre de R2 est
// vert pour les issues avec fiche et complétion, noir ailleurs.

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { SEEDS } from "../../../core/models/eligibilite/seeds-catalogue";
import type { Seed } from "../../../core/socle/seeds/seed";
import { model } from "../../../front/models/eligibilite";
import { catalogueResultats } from "../../../front/models/eligibilite/r2/catalogue-resultats";
import { rangerRattachement } from "../../../front/socle/rattachement/session";
import {
  detailsDuStepper,
  ouvrirLeSimulateur,
} from "../../socle/simulateur/questionnaire";
import { PATIENT_SEUL } from "./reponses-de-la-permission";

// Le catalogue des textes est chargé une fois : la première fiche n'attend
// pas ses 900 ko.
await catalogueResultats();

// L'écran des seeds met plus que la seconde par défaut sous la charge de la
// suite entière. Un test attend trois fois : son délai couvre les trois.
const ATTENTE = { timeout: 4000 };
const DELAI_D_UN_TEST = { timeout: 3 * ATTENTE.timeout };

beforeEach(() => rangerRattachement(null));

describe(
  "le stepper des parties du modèle de l'éditeur",
  DELAI_D_UN_TEST,
  () => {
    it("titre P0 « Mon besoin », et annonce P1", async () => {
      await ouvrirSur({});

      expect(titreDeLEcran()).toBe("Mon besoin Étape 1 sur 4");
      expect(detailsDuStepper()).toBe(
        "Étape suivante : Autonomie et état de santé",
      );
    });

    it("pose P0 : la question en titre de page, les libellés en gras, les durées sans point", async () => {
      await ouvrirSur({});

      expect(
        screen.getByRole("group", { name: /^Quel est votre besoin \?/ }),
      ).toBeInTheDocument();
      for (const libelle of [
        "Vérifier une éligibilité",
        "Vérifier et prescrire si la situation le permet",
      ]) {
        expect(screen.getByText(libelle)).toHaveClass("fr-text--bold");
      }
      expect(screen.getByText("Environ 3 minutes")).toHaveClass("fr-hint-text");
      expect(screen.getByText("Environ 10 minutes")).toHaveClass(
        "fr-hint-text",
      );
    });

    it("titre P1, et annonce P2", async () => {
      await ouvrirSur({ "Q0.1": "1_VERIFIER" });

      expect(titreDeLEcran()).toBe("Autonomie et état de santé Étape 2 sur 4");
      expect(detailsDuStepper()).toBe("Étape suivante : Éligibilité");
    });

    it("titre P2, sans ligne : la complétion n'y est pas encore connue", async () => {
      await ouvrirSur(sansP2(PATIENT_SEUL));

      expect(titreDeLEcran()).toBe("Éligibilité Étape 3 sur 4");
      expect(detailsDuStepper()).toBeUndefined();
    });

    it("titre P3, sans ligne", async () => {
      await ouvrirLaSeed("issue-pmt");
      await userEvent
        .setup()
        .click(
          screen.getByRole("button", { name: "Compléter la prescription" }),
        );

      expect(
        await screen.findByRole("heading", {
          level: 1,
          name: "Informations permettant de compléter la prescription Étape 4 sur 4",
        }),
      ).toBeInTheDocument();
      expect(detailsDuStepper()).toBeUndefined();
    });
  },
);

describe("la couleur du titre de R2", DELAI_D_UN_TEST, () => {
  it.each([
    ["issue-pmt", true],
    ["issue-s3141", true],
    ["issue-dap-sans-urgence", true],
    ["issue-dap-urgence-attestee", true],
    ["issue-dap-etranger-a-examiner", false],
    ["issue-non-eligible", false],
    ["issue-caisse", false],
    ["orientation-penitentiaire", false],
  ])("%s : vert, %s", async (id, vert) => {
    await ouvrirLaSeed(id);

    expect(
      screen
        .getByRole("heading", { level: 1 })
        .classList.contains("socle-result-title--success"),
    ).toBe(vert);
  });
});

// ---- implémentation ----

// Ouvre le simulateur sur ces réponses, par une seed écrite pour le test.
async function ouvrirSur(answers: Seed["answers"]) {
  const seed = { id: "test", label: "Seed du test", description: "", answers };
  await ouvrir(seed, [seed]);
  await screen.findByRole("heading", { level: 1 }, ATTENTE);
}

// Ouvre une seed du catalogue, et attend son résultat.
async function ouvrirLaSeed(id: string) {
  const seed = SEEDS.find((candidate) => candidate.id === id);
  if (!seed) throw new Error(`Seed inconnue : ${id}`);
  await ouvrir(seed, SEEDS);
  // Le `h1` vient avec le résultat, une fois ses textes chargés.
  await screen.findByRole("heading", { level: 1 }, ATTENTE);
}

async function ouvrir(
  seed: Pick<Seed, "label">,
  seeds: readonly Omit<Seed, "expected">[],
) {
  const user = await ouvrirLeSimulateur({
    produit: true,
    modele: model,
    seeds: seeds.map((s) => ({ expected: {}, ...s })),
  });
  await user.click(
    await screen.findByRole("button", { name: "Seeds" }, ATTENTE),
  );
  await user.click(
    await screen.findByRole(
      "button",
      { name: `Ouvrir : ${seed.label}` },
      ATTENTE,
    ),
  );
}

function titreDeLEcran() {
  return screen.getByRole("heading", { level: 1 }).textContent;
}

// Les réponses de P0 et P1 seules : la seed s'ouvre sur la première page de P2.
function sansP2(reponses: Seed["answers"]): Seed["answers"] {
  return Object.fromEntries(
    Object.entries(reponses).filter(([id]) => !id.startsWith("Q2.")),
  );
}
