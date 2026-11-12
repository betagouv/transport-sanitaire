import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "../../../front/socle/app/App";
import { rangerRattachement } from "../../../front/socle/rattachement";
import { snapshotReferentiel } from "../../../shared/referentiel";
import { modeleDeTest, seulModele } from "../modele-de-test";

// Le bandeau bêta, en haut de l'écran de rattachement : il dit que les données
// sont des données de test, sur l'environnement qui le demande (#376).

const BANDEAU =
  /^Version bêta : l'ensemble des données sont des données de test\.$/;

function ouvrirLApp(bandeauBeta?: boolean) {
  render(
    <App
      models={seulModele(modeleDeTest)}
      referentiel={snapshotReferentiel}
      bandeauBeta={bandeauBeta}
    />,
  );
}

beforeEach(() => rangerRattachement(null));

describe("le bandeau bêta", () => {
  it("s'affiche sur l'écran de rattachement quand l'environnement le demande", () => {
    ouvrirLApp(true);

    expect(screen.getByText(BANDEAU)).toBeInTheDocument();
  });

  it("ne s'affiche pas par défaut", () => {
    ouvrirLApp();

    expect(screen.queryByText(BANDEAU)).not.toBeInTheDocument();
  });
});
