import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { givenOf, page, questionsOf } from "../../../core/socle";
import { afficher } from "./afficher";

// Une sous-question que la page ne pose plus perd sa réponse dès la saisie,
// sans `dependsOn` : rouverte, elle revient vide (NAV-SOUS-QUESTIONS-20261112,
// SQ-02, SQ-03, SQ-05 et SQ-08). Les pages sont écrites ici.

type Questions = {
  situations: readonly ("ald" | "autre" | "aucune")[];
  lien: "direct" | "indirect";
  precision: string;
  autre: string;
};

const question = questionsOf<Questions>();
const given = givenOf<Questions>();

const SITUATIONS = page(
  "situations",
  question
    .multipleChoice("situations", "Quelles situations ?")
    .options({ ald: "Une ALD", autre: "Une autre", aucune: "Aucune" })
    .exclusive("aucune"),
  question
    .singleChoice("lien", "Quel lien ?")
    .options({ direct: "Direct", indirect: "Indirect" })
    .appliesWhen(given.question("situations").answer().checked("ald"))
    .shownUnder("situations", "ald"),
  question
    .text("precision", "Quelle précision ?")
    .appliesWhen(given.question("lien").answer().is("indirect")),
  question
    .text("autre", "Laquelle ?")
    .appliesWhen(given.question("situations").answer().checked("autre")),
);

const ald = () => screen.getByRole("checkbox", { name: "Une ALD" });
const terminer = () =>
  screen.getByRole("button", { name: /^(Suivant|Terminer)$/ });

describe("une sous-question fermée", () => {
  it("perd sa réponse : rouverte, elle revient vide et la page attend", async () => {
    const { user } = afficher([SITUATIONS]);
    await user.click(ald());
    await user.click(screen.getByLabelText("Direct"));

    await user.click(ald());
    await user.click(ald());

    expect(screen.getByLabelText("Direct")).not.toBeChecked();
    expect(terminer()).toBeDisabled();
  });

  it("emporte ce qui ne se posait que grâce à elle", async () => {
    const { user } = afficher([SITUATIONS]);
    await user.click(ald());
    await user.click(screen.getByLabelText("Indirect"));
    await user.type(screen.getByLabelText("Quelle précision ?"), "une chute");

    await user.click(ald());
    await user.click(ald());
    await user.click(screen.getByLabelText("Indirect"));

    expect(screen.getByLabelText("Quelle précision ?")).toHaveValue("");
  });

  it("laisse une sous-question voisine qui se pose toujours", async () => {
    const { user, reponses } = afficher([SITUATIONS]);
    await user.click(ald());
    await user.click(screen.getByLabelText("Direct"));
    await user.click(screen.getByRole("checkbox", { name: "Une autre" }));
    await user.type(screen.getByLabelText("Laquelle ?"), "une greffe");

    await user.click(ald());
    await user.click(terminer());

    expect(reponses()).toEqual({ situations: ["autre"], autre: "une greffe" });
  });
});
