import { describe, expect, it } from "vitest";
import { RattachementSessionService } from "../../../front/socle/rattachement/rattachement-session.service";
import { RattachementDuReferentiel } from "../../../shared/rattachement-du-referentiel.vo";

const rattachement = RattachementDuReferentiel.choisi({
  etabId: "7",
  serviceId: "42",
});

describe("session de rattachement", () => {
  it("conserve le rattachement renseigné", () => {
    RattachementSessionService.ranger(rattachement);
    expect(RattachementSessionService.enSession()).toEqual(rattachement);
  });

  it("n'a rien tant que personne ne s'est rattaché", () => {
    RattachementSessionService.ranger(null);
    expect(RattachementSessionService.enSession()).toBeNull();
  });
});
