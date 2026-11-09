// La recette des deux pages des situations particulières, livrée avec la
// v10.1.6 (`Recette_Q221_pages_v10.1.6.json`, REC-Q221-PAGES-1016), sous
// l'identifiant de chaque cas chez l'éditeur. Elle éprouve
// NAV-Q221-PROGRESSIF-001 : le premier bloc et ses précisions sur une page,
// le second sur la suivante, une validation chacune (D-252).
//
// L'éditeur nomme ces pages `P2/contextes-situations` et `P2/contextes-soins`.
// Elles restent ici `P2/contextes` et `P2/soins` : seule la mesure d'audience,
// qui n'est pas prévue (#305), lirait ces identifiants.
//
// Les cas qui ne s'appliquent pas :
// - second-seul et aucun : Q2.2.1 se pose sur tout parcours (D-98), le premier
//   bloc n'est jamais acquis d'avance et la page du second ne s'atteint pas
//   sans lui ;
// - analytics : la mesure d'audience par page n'est pas prévue (#305).

import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Faits } from "../../../../core/models/eligibilite/faits/noms";
import type { AskedQuestion } from "../../../../core/socle/questionnaire-engine";
import { Simulation } from "../../../../core/socle/simulation";
import { model } from "../../../../front/models/eligibilite";
import { afficherLaPage, cocher, page, suivant } from "../formulaire-du-modele";
import {
  BRANCARD,
  CONSULTATION,
  type Reponses,
} from "./reponses-des-contextes";

// Les faits que dit le second bloc.
const DU_SECOND = [
  "fait_atmp_lie",
  "fait_motif_camsp",
  "fait_motif_samsah",
  "fait_motif_pension",
  "fait_convocation",
] as const;

const RETOUR = ["10_RETOUR_PENITENTIAIRE"] as const;

const reprise = (reponses: Reponses) => Simulation.resume(model.core, reponses);

const idsSur = (simulation: Simulation, brouillon?: Reponses) =>
  simulation.questionsOn(simulation.page, brouillon).map(({ id }) => id);

const duSecond = (simulation: Simulation) =>
  DU_SECOND.map((nom) => (simulation.preconisation.faits as Faits)[nom].value);

const question = (simulation: Simulation, id: string): AskedQuestion => {
  const posee = simulation
    .questionsOn(simulation.page)
    .find((candidate) => candidate.id === id);
  if (posee === undefined) throw new Error(`${id} ne se pose pas ici`);
  return posee;
};

const SITUATIONS = /^L’une de ces situations/;
const SOINS = /^L’un de ces soins/;
const INDICATION = /^Ce retour nécessite-t-il/;
const boutonSuivant = () => screen.getByRole("button", { name: "Suivant" });

describe("la recette des deux pages des contextes (REC-Q221-PAGES-1016)", () => {
  it("deux-pages : le second bloc s'ouvre sur sa page, sans réponse", () => {
    const contextes = reprise(BRANCARD);
    expect(contextes.page.id).toBe("P2/contextes");

    const soins = contextes.validate({ "Q2.2.1": ["0_AUCUNE"] });

    expect(soins.page.id).toBe("P2/soins");
    expect(idsSur(soins)).toEqual(["Q2.2.1.b"]);
    expect(duSecond(soins)).toEqual(Array(5).fill(undefined));
  });

  it("deux-pages, à l'écran : un Suivant par page", async () => {
    const user = afficherLaPage("P2/contextes", BRANCARD);
    await page(SITUATIONS);
    await cocher(user, /^Non, aucune de ces situations/);
    await suivant(user);

    expect(await page(SOINS)).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: SITUATIONS })).toBeNull();
  });

  it("premier-seul : un retour vers la prison hors indication s'arrête au premier bloc", () => {
    const contextes = reprise(CONSULTATION);

    const fin = contextes.validate({
      "Q2.2.1": RETOUR,
      "Q2.2.1.indication": "2_NON",
    });

    expect(fin.stage.name).toBe("resultat");
    expect(fin.pages().map(({ id }) => id)).not.toContain("P2/soins");
    expect(duSecond(fin)).toEqual(Array(5).fill(undefined));
  });

  it("qualifications : la précision se pose sur la première page, puis décide du second", () => {
    const contextes = reprise(CONSULTATION);
    const brouillon = { "Q2.2.1": RETOUR };

    expect(idsSur(contextes, brouillon)).toEqual([
      "Q2.2.1",
      "Q2.2.1.indication",
    ]);
    expect(
      contextes.validate({ ...brouillon, "Q2.2.1.indication": "1_OUI" }).page
        .id,
    ).toBe("P2/soins");
  });

  it("qualifications, à l'écran : Suivant attend la précision", async () => {
    const user = afficherLaPage("P2/contextes", CONSULTATION);
    await page(SITUATIONS);
    await cocher(user, /^Retour vers un établissement pénitentiaire/);

    expect(await page(INDICATION)).toBeInTheDocument();
    expect(boutonSuivant()).toBeDisabled();

    await user.click(screen.getByRole("radio", { name: /^Oui/ }));
    expect(boutonSuivant()).toBeEnabled();
  });

  it.each([
    ["l'examen", "14_EXAMEN_MATERNITE"],
    ["l'hébergement", "15_HEBERGEMENT_MATERNITE"],
  ] as const)(
    "incompatible : %s de la maternité et l'HTNM ensemble ne répondent pas, et restent tels quels",
    (_, maternite) => {
      const ensemble = [maternite, "5_HTNM"] as const;
      const contextes = reprise({ ...BRANCARD, "Q2.2.1": ensemble });
      const q221 = question(contextes, "Q2.2.1");

      expect(contextes.page.id).toBe("P2/contextes");
      expect(q221.isAnsweredBy(ensemble)).toBe(false);
      expect(q221.problemsWith(ensemble)).toEqual([
        { kind: "stated", text: expect.stringContaining("pas des deux") },
      ]);
      expect(contextes.answers["Q2.2.1"]).toEqual(ensemble);
    },
  );

  it("vide : aucune case ne répond à l'un ou l'autre bloc", () => {
    const contextes = reprise(BRANCARD);
    const soins = contextes.validate({ "Q2.2.1": ["0_AUCUNE"] });

    for (const posee of [
      question(contextes, "Q2.2.1"),
      question(soins, "Q2.2.1.b"),
    ]) {
      expect(posee.isAnsweredBy(undefined)).toBe(false);
      expect(posee.problemsWith([])).toEqual([{ kind: "nothing checked" }]);
    }
  });

  it("vide, à l'écran : Suivant reste inactif sur chaque page", async () => {
    const user = afficherLaPage("P2/contextes", BRANCARD);
    await page(SITUATIONS);
    expect(boutonSuivant()).toBeDisabled();

    await cocher(user, /^Non, aucune de ces situations/);
    await suivant(user);
    await page(SOINS);
    expect(boutonSuivant()).toBeDisabled();
  });

  it("retour : Précédent rouvre les pages vues, réponses validées restaurées et gardées sans changement", () => {
    const apres = reprise(BRANCARD)
      .validate({ "Q2.2.1": ["0_AUCUNE"] })
      .validate({ "Q2.2.1.b": ["1_ATMP"] });

    const soins = apres.back();
    const contextes = soins.back();

    expect(soins.page.id).toBe("P2/soins");
    expect(soins.answers["Q2.2.1.b"]).toEqual(["1_ATMP"]);
    expect(contextes.page.id).toBe("P2/contextes");
    expect(contextes.answers["Q2.2.1"]).toEqual(["0_AUCUNE"]);
    expect(
      contextes.validate({ "Q2.2.1": ["0_AUCUNE"] }).answers["Q2.2.1.b"],
    ).toEqual(["1_ATMP"]);
  });

  it("retour, à l'écran : Précédent rend le focus au titre du premier bloc", async () => {
    const user = afficherLaPage("P2/contextes", BRANCARD);
    await page(SITUATIONS);
    await cocher(user, /^Non, aucune de ces situations/);
    await suivant(user);
    await page(SOINS);

    await user.click(screen.getByRole("button", { name: "Précédent" }));

    expect(
      await screen.findByText(SITUATIONS, { selector: "legend" }),
    ).toHaveFocus();
  });

  it("brouillon : changer le premier bloc sans valider ne touche ni au second ni aux faits", () => {
    const contextes = reprise(CONSULTATION)
      .validate({ "Q2.2.1": ["0_AUCUNE"] })
      .validate({ "Q2.2.1.b": ["1_ATMP"] })
      .back()
      .back();

    expect(idsSur(contextes, { "Q2.2.1": RETOUR })).toContain(
      "Q2.2.1.indication",
    );
    expect(contextes.answers["Q2.2.1.b"]).toEqual(["1_ATMP"]);
    expect(duSecond(contextes)).toEqual([true, false, false, false, false]);
  });

  it("modification : valider un autre premier bloc efface sa précision et le second bloc, garde le reste, et les repose au besoin", () => {
    const qualifie: Reponses = {
      ...CONSULTATION,
      "Q2.2.1": RETOUR,
      "Q2.2.1.indication": "1_OUI",
      "Q2.2.1.b": ["0_AUCUN"],
      "Q2.3.1": "1_CINQUANTE_KM_OU_MOINS",
    };
    const contextes = reprise(qualifie).back().back();
    expect(contextes.page.id).toBe("P2/contextes");

    const sansRetour = contextes.validate({ "Q2.2.1": ["0_AUCUNE"] });
    expect(sansRetour.answers).not.toHaveProperty("Q2.2.1.indication");
    expect(sansRetour.answers).not.toHaveProperty("Q2.2.1.b");
    expect(sansRetour.answers["Q2.3.1"]).toBe("1_CINQUANTE_KM_OU_MOINS");
    expect(sansRetour.page.id).toBe("P2/soins");

    const deNouveau = sansRetour.back();
    expect(idsSur(deNouveau, { "Q2.2.1": RETOUR })).toContain(
      "Q2.2.1.indication",
    );
  });

  it("ald : un soin lié à l'ALD ne pose que les deux blocs, et garde son résultat", () => {
    const ald: Reponses = {
      ...BRANCARD,
      "Q1.3": ["2_ALD"],
      "Q1.3.b": "1_LIEN_DIRECT",
    };
    const contextes = reprise(ald);
    const soins = contextes.validate({ "Q2.2.1": ["0_AUCUNE"] });
    const fin = reprise({
      ...ald,
      "Q2.2.1": ["0_AUCUNE"],
      "Q2.2.1.b": ["0_AUCUN"],
      "Q2.3.1": "1_CINQUANTE_KM_OU_MOINS",
      "Q2.3.2": false,
    });

    expect([...idsSur(contextes), ...idsSur(soins)]).toEqual([
      "Q2.2.1",
      "Q2.2.1.b",
    ]);
    expect(fin.preconisation.cibles.cible_issue_id?.value).toBe("ISSUE_PMT");
  });
});
