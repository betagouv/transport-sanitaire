import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { givenOf, page, questionsOf } from "../../../core/socle";
import { afficher } from "./afficher";

// Une question peut s'afficher juste sous l'option d'une liste de cases qui la
// fait apparaître, et non à son rang (`shownUnder`). Elle reste une question à
// part : sa légende, son groupe, sa garde. Les pages sont écrites ici.

type Questions = {
  situations: readonly ("ald" | "autre" | "aucune")[];
  lien: "direct" | "indirect";
};

const OPTIONS = {
  situations: {
    ald: "Une affection de longue durée",
    autre: "Une autre situation",
    aucune: "Aucune de ces situations",
  },
  lien: { direct: "Un lien direct", indirect: "Un lien indirect" },
} as const;

const question = questionsOf<Questions>({ options: OPTIONS });
const given = givenOf<Questions>();

const SITUATIONS = question
  .multipleChoice("situations", "Quelles situations concernent ce trajet ?")
  .exclusive("aucune");
const LIEN = question
  .singleChoice("lien", "Quel lien avec l'affection ?")
  .appliesWhen(given.question("situations").answer().checked("ald"));

const SOUS_L_OPTION = page(
  "situations",
  SITUATIONS,
  LIEN.shownUnder("situations", "ald"),
);

const caseACocher = (name: RegExp) => screen.getByRole("checkbox", { name });
const groupeDuLien = () =>
  screen.getByRole("group", { name: /^quel lien avec l'affection/i });
const precede = (avant: Element, apres: Element) =>
  Boolean(
    avant.compareDocumentPosition(apres) & Node.DOCUMENT_POSITION_FOLLOWING,
  );

describe("une question sous une option", () => {
  it("s'affiche juste sous son option, avant la suivante", async () => {
    const { user } = afficher([SOUS_L_OPTION]);

    await user.click(caseACocher(/^une affection/i));

    expect(precede(caseACocher(/^une affection/i), groupeDuLien())).toBe(true);
    expect(precede(groupeDuLien(), caseACocher(/^une autre/i))).toBe(true);
  });

  it("reste un groupe à part, hors du libellé de l'option", async () => {
    const { user } = afficher([SOUS_L_OPTION]);

    await user.click(caseACocher(/^une affection/i));

    expect(groupeDuLien().closest("label")).toBeNull();
    expect(
      screen.getAllByRole("radio").map((radio) => radio.closest("fieldset")),
    ).toEqual([groupeDuLien(), groupeDuLien()]);
  });

  it("suit sa garde : l'option décochée, elle disparaît", async () => {
    const { user } = afficher([SOUS_L_OPTION]);

    await user.click(caseACocher(/^une affection/i));
    await user.click(caseACocher(/^une affection/i));

    expect(screen.queryByRole("group", { name: /^quel lien/i })).toBeNull();
  });

  it("se place sous la liste quand elle s'affiche à son rang", async () => {
    const { user } = afficher([page("situations", SITUATIONS, LIEN)]);

    await user.click(caseACocher(/^une affection/i));

    expect(precede(caseACocher(/^aucune de ces/i), groupeDuLien())).toBe(true);
  });

  it("ne se déclare pas avant la liste de son option", () => {
    expect(() =>
      page("situations", LIEN.shownUnder("situations", "ald"), SITUATIONS),
    ).toThrow(
      "lien s'affiche sous situations, qui ne la précède pas sur la page situations.",
    );
  });
});
