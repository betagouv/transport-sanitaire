// L'agrégat du parcours, sans écran : où une simulation s'ouvre, ce que valider
// une page en fait, ce que « Précédent » et le verrou gardent, et où des
// réponses reprennent.

import { describe, expect, it } from "vitest";
import { Simulation } from "../../../core/socle/simulation/simulation";
import { modeleDeTest } from "../modele-de-test";

const core = modeleDeTest.core;
const ids = (simulation: Simulation) =>
  simulation.pages().map((page) => page.id);

const THE_AU_LAIT = { boisson: "the", accompagnements: ["lait"] };

describe("une simulation qui commence", () => {
  it("s'ouvre sur la première page du questionnaire, sans précédent", () => {
    const simulation = Simulation.start(core);

    expect(simulation.stage).toEqual({ name: "questionnaire" });
    expect(simulation.page.id).toBe("boisson");
    expect(simulation.hasPrevious()).toBe(false);
    expect(simulation.answers).toEqual({});
  });
});

describe("valider la page ouverte", () => {
  it("garde ses réponses et ouvre la page qui suit", () => {
    const simulation = Simulation.start(core).validate({ boisson: "the" });

    expect(simulation.answers).toEqual({ boisson: "the" });
    expect(simulation.page.id).toBe("accompagnements");
    expect(ids(simulation)).toEqual(["boisson", "accompagnements"]);
    expect(simulation.hasPrevious()).toBe(true);
  });

  it("achève le questionnaire sur le résultat quand rien ne suit", () => {
    const simulation = Simulation.start(core).validate({ boisson: "rien" });

    expect(simulation.stage).toEqual({ name: "resultat" });
    expect(simulation.isComplete()).toBe(true);
    expect(simulation.page.id).toBe("boisson");
  });

  it("efface les réponses qui dépendaient d'une réponse changée", () => {
    const simulation = Simulation.resume(core, THE_AU_LAIT)
      .reopen()
      .back()
      .validate({ boisson: "cafe" });

    expect(simulation.answers).toEqual({ boisson: "cafe" });
    expect(simulation.page.id).toBe("accompagnements");
  });
});

describe("« Précédent »", () => {
  it("rouvre la page d'avant sans rien valider", () => {
    const simulation = Simulation.start(core)
      .validate({ boisson: "the" })
      .back();

    expect(simulation.page.id).toBe("boisson");
    expect(simulation.answers).toEqual({ boisson: "the" });
  });

  it("ne change rien sur la première page", () => {
    const simulation = Simulation.start(core);

    expect(simulation.back()).toBe(simulation);
  });

  it("rouvre, depuis le résultat, le questionnaire sur la page quittée", () => {
    const simulation = Simulation.resume(core, THE_AU_LAIT).reopen();

    expect(simulation.stage).toEqual({ name: "questionnaire" });
    expect(simulation.page.id).toBe("accompagnements");
    expect(simulation.answers).toEqual(THE_AU_LAIT);
  });
});

describe("le verrou", () => {
  it("fige la préconisation et ouvre le complément sur sa première page", () => {
    const simulation = Simulation.resume(core, THE_AU_LAIT).lock();

    expect(simulation.stage.name).toBe("complement");
    expect(simulation.page.id).toBe("quantite");
    expect(ids(simulation)).toEqual(["quantite"]);
    expect(simulation.hasPrevious()).toBe(false);
    expect(simulation.answers).toEqual(THE_AU_LAIT);
    expect("locked" in simulation.stage && simulation.stage.locked).toEqual({
      answers: THE_AU_LAIT,
      preconisation: simulation.preconisation,
    });
  });

  it("ne garde pas une réponse qu'un retour en arrière a laissée sans objet", () => {
    const simulation = Simulation.resume(core, {
      boisson: "rien",
      accompagnements: ["lait"],
    }).lock();

    expect(simulation.answers).toEqual({ boisson: "rien" });
  });

  it("mène au cerfa, daté, quand le complément est validé", () => {
    const jour = new Date("2026-11-03");
    const simulation = Simulation.resume(core, THE_AU_LAIT)
      .lock()
      .validate({ quantite: 2 }, jour);

    expect(simulation.stage).toMatchObject({
      name: "cerfa",
      completedAt: jour,
    });
    expect(simulation.answers).toEqual({ ...THE_AU_LAIT, quantite: 2 });
    expect(simulation.reopen().stage.name).toBe("complement");
  });
});

describe("reprendre des réponses", () => {
  it("ouvre le questionnaire sur la première page qui attend une réponse", () => {
    const simulation = Simulation.resume(core, { boisson: "the" });

    expect(simulation.stage).toEqual({ name: "questionnaire" });
    expect(simulation.page.id).toBe("accompagnements");
  });

  it("ouvre le résultat quand elles le complètent", () => {
    const simulation = Simulation.resume(core, THE_AU_LAIT);

    expect(simulation.stage).toEqual({ name: "resultat" });
    expect(simulation.page.id).toBe("accompagnements");
  });

  it("passe le verrou dès qu'une réponse d'après lui est donnée", () => {
    const jour = new Date("2026-11-03");
    const simulation = Simulation.resume(
      core,
      { ...THE_AU_LAIT, quantite: 2 },
      jour,
    );

    expect(simulation.stage).toMatchObject({
      name: "cerfa",
      completedAt: jour,
    });
    expect(simulation.reopen().answers).toEqual({
      ...THE_AU_LAIT,
      quantite: 2,
    });
    expect(simulation.preconisation).toEqual(
      Simulation.resume(core, THE_AU_LAIT).preconisation,
    );
  });
});
