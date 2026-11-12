import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "../../../front/socle/app";
import {
  DeveloperTools,
  ToolButton,
} from "../../../front/socle/developer-tools/DeveloperTools";
import { developerToolsUnlocked } from "../../../front/socle/developer-tools/unlock";
import { Simulateur } from "../../../front/socle/simulateur";
import { snapshotReferentiel } from "../../../shared/referentiel";
import { modeleDeTest, seulModele } from "../modele-de-test";
import { seRattacher } from "../se-rattacher";

// Les developer tools court-circuitent le questionnaire. Ils sont regroupés dans
// un encadré à part, distinct des actions normales. Ils s'ouvrent en local, quel
// que soit le service, jamais sur un build de production (D-279).

const ENCADRE = { name: "Developer tools" } as const;
const ECRAN_SEEDS = { name: "Seeds" } as const;

describe("encadré des developer tools, début du parcours", () => {
  it("y range l'accès à l'écran des seeds, hors du parcours", () => {
    render(
      <Simulateur
        model={modeleDeTest}
        onNewSimulation={() => {}}
        developerToolsPanel={
          <DeveloperTools>
            <ToolButton onClick={() => {}}>Seeds</ToolButton>
          </DeveloperTools>
        }
      />,
    );

    const encadre = screen.getByRole("region", ENCADRE);
    expect(
      within(encadre).getByRole("button", ECRAN_SEEDS),
    ).toBeInTheDocument();
    // Le stepper reste hors de l'encadré. La première question est à choix
    // unique : elle avance seule, sans bouton de navigation.
    expect(encadre).not.toContainElement(
      screen.getByRole("heading", { name: /étape \d+ sur \d+$/i }),
    );
  });

  it("n'apparaît pas quand l'accès n'est pas fourni", () => {
    render(<Simulateur model={modeleDeTest} onNewSimulation={() => {}} />);
    expect(screen.queryByRole("region", ENCADRE)).toBeNull();
  });
});

describe("App câble les developer tools", () => {
  it("les propose au début du parcours en local, quel que soit le service", async () => {
    const user = userEvent.setup();
    render(
      <App
        models={seulModele(modeleDeTest)}
        referentiel={snapshotReferentiel}
        declarer={() => {}}
      />,
    );

    await seRattacher(user);

    const encadre = await screen.findByRole("region", ENCADRE);
    expect(within(encadre).getAllByRole("button")).toHaveLength(1);
    expect(
      within(encadre).getByRole("button", ECRAN_SEEDS),
    ).toBeInTheDocument();
  });

  it("ne les propose jamais sur un build de production", async () => {
    const user = userEvent.setup();
    render(
      <App
        models={seulModele(modeleDeTest)}
        referentiel={snapshotReferentiel}
        declarer={() => {}}
        developerTools={developerToolsUnlocked({ DEV: false })}
      />,
    );

    await seRattacher(user);

    expect(
      await screen.findByRole("group", {
        name: /^quelle boisson souhaitez-vous/i,
      }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("region", ENCADRE)).toBeNull();
  });
});
