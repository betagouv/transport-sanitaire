import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RattachementForm } from "../../../front/socle/rattachement/RattachementForm";
import type { Referentiel } from "../../../shared/referentiel";

// Les structures sous le trait : une liste fixe, reconnue parmi les services de
// l'établissement fourre-tout, où arrivent aussi les saisies des prescripteurs.

// Le fourre-tout tel que Grist le sert : ses structures, CNAM et CPAM, et des
// services saisis par les prescripteurs, dans le désordre et avec des espaces.
const FOURRE_TOUT_DE_GRIST: Referentiel = {
  async listerEtablissements() {
    return [
      { id: "11", libelle: "Libéral / CNAM / CPAM / Autre" },
      { id: "20", libelle: "CHU Grenoble Alpes" },
    ];
  },
  async listerServices(etabId) {
    if (etabId !== "11") return [];
    return [
      { id: "3", libelle: "CNAM" },
      { id: "5", libelle: "Recette avis" },
      { id: "1", libelle: "Autre" },
      { id: "6", libelle: "Transport Sanitaire" },
      { id: "12", libelle: " assurance  maladie " },
      { id: "4", libelle: "CPAM" },
      { id: "2", libelle: "Libéral" },
    ];
  },
};

const premiereListe = () =>
  screen.getByRole("combobox", { name: "Établissement" });

async function optionsSousLeTrait() {
  const select = premiereListe();
  await within(select).findByRole("option", { name: "Libéral" });
  const libelles = within(select)
    .getAllByRole("option")
    .map((o) => o.textContent);
  return libelles.slice(libelles.indexOf("──────────") + 1);
}

describe("les structures sous le trait", () => {
  it("sont toujours « Libéral », « Assurance Maladie », « Autre », dans cet ordre", async () => {
    render(
      <RattachementForm
        referentiel={FOURRE_TOUT_DE_GRIST}
        onValide={vi.fn()}
      />,
    );

    expect(await optionsSousLeTrait()).toEqual([
      "Autre établissement",
      "Libéral",
      "Assurance Maladie",
      "Autre",
    ]);
  });

  it("gardent l'id Grist de leur service", async () => {
    const onValide = vi.fn();
    render(
      <RattachementForm
        referentiel={FOURRE_TOUT_DE_GRIST}
        onValide={onValide}
      />,
    );

    await optionsSousLeTrait();
    await userEvent.selectOptions(premiereListe(), "Assurance Maladie");

    expect(onValide).toHaveBeenCalledWith(
      { etabId: "11", serviceId: "12" },
      "Assurance Maladie",
    );
  });

  it("ne montrent pas une structure absente du référentiel", async () => {
    const referentiel: Referentiel = {
      ...FOURRE_TOUT_DE_GRIST,
      async listerServices() {
        return [
          { id: "3", libelle: "CNAM" },
          { id: "1", libelle: "Autre" },
          { id: "2", libelle: "Libéral" },
        ];
      },
    };
    render(<RattachementForm referentiel={referentiel} onValide={vi.fn()} />);

    expect(await optionsSousLeTrait()).toEqual([
      "Autre établissement",
      "Libéral",
      "Autre",
    ]);
  });
});
