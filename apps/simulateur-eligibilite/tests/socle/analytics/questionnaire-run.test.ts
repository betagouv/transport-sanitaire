// Ce qu'un passage dans le questionnaire compte, et ce qu'il tait : le début
// d'un questionnaire qui reprend, l'abandon d'un questionnaire fini, tout le
// questionnaire du cerfa.

import { describe, expect, it } from "vitest";
import {
  QuestionnaireRun,
  type QuestionnaireRunOptions,
} from "../../../front/socle/analytics/questionnaire-run.entity";

const passage = (options: Partial<QuestionnaireRunOptions> = {}) =>
  new QuestionnaireRun({
    rattachement: { etabId: "7", serviceId: "42" },
    counted: true,
    resumed: false,
    ...options,
  });

describe("un passage dans le questionnaire", () => {
  it("compte son début, ses étapes et sa fin, avec le service rattaché", () => {
    const run = passage();

    expect([run.start(), run.pass(2), run.complete()]).toEqual([
      { name: "simulation_start", serviceId: "42" },
      { name: "simulation_step", serviceId: "42", value: 2 },
      { name: "simulation_complete", serviceId: "42" },
    ]);
  });

  it("qui reprend, ne compte pas de début", () => {
    expect(passage({ resumed: true }).start()).toBeNull();
  });

  it("quitté en cours, compte l'abandon sur la page ouverte", () => {
    expect(passage().leave(3)).toEqual({
      name: "simulation_abandon",
      serviceId: "42",
      value: 3,
    });
  });

  it("quitté une fois fini, ne compte pas d'abandon", () => {
    const run = passage();
    run.complete();

    expect(run.leave(3)).toBeNull();
  });

  it("non compté, comme celui du cerfa, ne compte rien", () => {
    const run = passage({ counted: false });

    expect([run.start(), run.pass(2), run.complete(), run.leave(2)]).toEqual([
      null,
      null,
      null,
      null,
    ]);
  });
});
