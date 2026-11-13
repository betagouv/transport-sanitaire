// Ce qu'un événement de la mesure d'audience garde du rattachement : l'id du
// service, rien d'autre.

import { describe, expect, it } from "vitest";
import { AudienceEvent } from "../../../front/socle/analytics/audience-event.entity";
import type { RattachementSaisi } from "../../../shared/rattachement-saisi";

describe("un événement de la mesure d'audience", () => {
  it("porte l'id du service rattaché", () => {
    const rattachement: RattachementSaisi = { etabId: "7", serviceId: "42" };

    expect(AudienceEvent.of("simulation_step", rattachement, 3)).toEqual({
      name: "simulation_step",
      serviceId: "42",
      value: 3,
    });
  });

  it("service saisi sous « Autre » : garde l'id de l'entrée « Autre », jamais le libellé saisi", () => {
    const autre: RattachementSaisi = {
      etabId: "7",
      serviceId: "99",
      serviceEstAutre: true,
      serviceLibre: "Néphrologie",
    };

    expect(AudienceEvent.of("simulation_start", autre)).toEqual({
      name: "simulation_start",
      serviceId: "99",
    });
  });

  it("sans rattachement, ne porte pas de service", () => {
    expect(
      AudienceEvent.of("simulation_start", null).serviceId,
    ).toBeUndefined();
  });
});
