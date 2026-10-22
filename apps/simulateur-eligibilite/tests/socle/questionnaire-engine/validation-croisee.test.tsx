import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type {
  Page,
  Question,
} from "../../../core/socle/questionnaire-engine/question";
import { afficher } from "./afficher";

// Une réponse peut en contredire une autre. La question qui vient en dernier
// déclare ses incohérences, un message chacune. Ici, deux réponses de la même
// page. Les pages sont écrites ici.

const page = (...questions: Question[]): Page => ({
  id: questions[0]?.id ?? "vide",
  questions,
});

const FIN_AVANT_LE_DEBUT = "La fin précède le début.";
const FERME_LE_DIMANCHE = "Le magasin est fermé le dimanche.";

const DEBUT: Question = {
  id: "debut",
  kind: "datetime",
  label: "Début du créneau",
};

// 2026-10-18 tombe un dimanche.
const FIN: Question = {
  id: "fin",
  kind: "datetime",
  label: "Fin du créneau",
  inconsistenciesFrom: (answers) => {
    const debut = answers.question("debut").value;
    const fin = answers.question("fin").value;
    return [
      ...(debut && fin && fin < debut ? [FIN_AVANT_LE_DEBUT] : []),
      ...(typeof fin === "string" && fin.startsWith("2026-10-18")
        ? [FERME_LE_DIMANCHE]
        : []),
    ];
  },
};

const CRENEAU = page(DEBUT, FIN);

const champ = (name: string) => screen.getByLabelText(name);
const valider = () =>
  screen.getByRole("button", { name: /^(Suivant|Terminer)$/ });

describe("deux réponses de la même page", () => {
  it("affiche le message sous la fin, et grise le bouton", async () => {
    const { user } = afficher([CRENEAU]);

    await user.type(champ("Début du créneau"), "2026-10-12T08:30");
    await user.type(champ("Fin du créneau"), "2026-10-12T07:00");

    expect(champ("Fin du créneau")).toHaveAccessibleDescription(
      FIN_AVANT_LE_DEBUT,
    );
    expect(valider()).toBeDisabled();
  });

  it("valide la page une fois la fin corrigée", async () => {
    const { user, reponses } = afficher([CRENEAU]);
    await user.type(champ("Début du créneau"), "2026-10-12T08:30");
    await user.type(champ("Fin du créneau"), "2026-10-12T07:00");

    await user.clear(champ("Fin du créneau"));
    await user.type(champ("Fin du créneau"), "2026-10-12T09:00");

    expect(screen.queryByText(FIN_AVANT_LE_DEBUT)).toBeNull();
    await user.click(valider());
    expect(reponses()).toEqual({
      debut: "2026-10-12T08:30",
      fin: "2026-10-12T09:00",
    });
  });

  it("affiche ensemble les messages de deux incohérences sur une même réponse", async () => {
    const { user } = afficher([CRENEAU]);

    await user.type(champ("Début du créneau"), "2026-10-19T08:30");
    await user.type(champ("Fin du créneau"), "2026-10-18T07:00");

    expect(screen.getByText(FIN_AVANT_LE_DEBUT)).toBeInTheDocument();
    expect(screen.getByText(FERME_LE_DIMANCHE)).toBeInTheDocument();
  });

  it("affiche une erreur de format seule, avant les incohérences", async () => {
    const decimale: Question = {
      id: "poids",
      kind: "number",
      label: "Poids du colis",
      integer: true,
      inconsistenciesFrom: () => ["Le colis est trop lourd pour ce mode."],
    };
    const { user } = afficher([page(decimale)]);

    await user.type(screen.getByRole("spinbutton"), "2.5");

    expect(
      screen.getByText("Indiquez un nombre entier, sans décimale."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/trop lourd/)).toBeNull();
  });
});

describe("précision obligatoire restée vide", () => {
  const RAISONS: Page = {
    id: "raisons",
    questions: [
      {
        id: "raisons",
        kind: "multiple choice",
        label: "Pourquoi ?",
        options: [
          { value: "panne", label: "Une panne" },
          { value: "autre", label: "Autre chose" },
        ],
      },
      {
        id: "precision",
        kind: "text",
        label: "Précisez",
        askedIf: (answers) => answers.question("raisons").checked("autre"),
      },
    ],
  };

  it("grise « Suivant », sans message", async () => {
    const { user } = afficher([RAISONS]);

    await user.click(screen.getByLabelText("Autre chose"));

    expect(champ("Précisez")).toBeInTheDocument();
    expect(valider()).toBeDisabled();
    expect(
      document.querySelector(".fr-error-text, .fr-message--error"),
    ).toBeNull();
  });
});
