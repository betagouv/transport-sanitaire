// L'invitation à donner son avis (#195, COR-13 de la v10.1.3) : un lien que
// le modèle nomme et adresse, posé après les actions d'un résultat. Il vient en
// R2 ou en R3 selon ce que le prescripteur est venu faire et selon que le
// résultat se complète. Les modèles ci-dessous sont écrits pour ces tests, sur
// le modèle factice.

import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Intent, Model } from "../../../front/socle/model";
import { modeleDeTest } from "../modele-de-test";
import { auGabarit, gabaritRetenu } from "./gabarit-retenu";
import {
  allerAuCerfa,
  allerAuResultat,
  BOISSON,
  bouton,
  ouvrirLeSimulateur,
  question,
  qui,
  radio,
  repondreJusquAuResultat,
} from "./questionnaire";

const ADRESSE = "https://exemple.test/questionnaire/6";
const LIBELLE = "Donnez votre avis";

const venuPour = (intent: Intent | null, modele = modeleDeTest): Model => ({
  ...modele,
  feedback: { url: ADRESSE, label: LIBELLE, intent: () => intent },
});

const avis = () =>
  screen.queryAllByRole("link", { name: `${LIBELLE} (nouvel onglet)` });

describe("l'avis sous le premier résultat", () => {
  it("vient après les actions quand le prescripteur est venu vérifier, même si le résultat se complète", async () => {
    const user = await ouvrirLeSimulateur({ modele: venuPour("check") });
    await allerAuResultat(user);

    const [lien] = avis();
    expect(lien).toHaveAttribute("href", ADRESSE);
    expect(lien).toHaveAttribute("target", "_blank");
    expect(lien).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("ne vient pas quand le prescripteur est venu prescrire et que le résultat se complète", async () => {
    const user = await ouvrirLeSimulateur({ modele: venuPour("prescribe") });
    await allerAuResultat(user);

    expect(bouton("Compléter la commande")).toBeInTheDocument();
    expect(avis()).toEqual([]);
  });

  it.each(["check", "prescribe"] as const)(
    "vient quand rien ne se complète, venu pour « %s »",
    async (intent) => {
      const user = await ouvrirLeSimulateur({ modele: venuPour(intent) });
      await question(BOISSON);
      await user.click(radio("Rien"));

      expect(await screen.findByText("Commande : aucune")).toBeInTheDocument();
      expect(avis()).toHaveLength(1);
    },
  );

  it("ne vient pas quand on ne sait pas ce que le prescripteur est venu faire", async () => {
    const user = await ouvrirLeSimulateur({ modele: venuPour(null) });
    await allerAuResultat(user);

    expect(avis()).toEqual([]);
  });

  it("ne vient ni pendant les questions, ni pendant que le résultat charge", async () => {
    const enAttente = venuPour(
      "check",
      qui(() => new Promise(() => {})),
    );
    const user = await ouvrirLeSimulateur({ modele: enAttente });
    await question(BOISSON);
    expect(avis()).toEqual([]);

    await repondreJusquAuResultat(user);

    expect(await screen.findByText("Chargement du résultat…")).toBeVisible();
    expect(avis()).toEqual([]);
  });

  it("suit la feuille du patient, hors d'elle, et ne s'imprime pas", async () => {
    const avecFeuille = qui(async () => ({
      title: "Le résultat",
      sheet: { title: "Votre commande", body: "Un contenu" },
    }));
    const user = await ouvrirLeSimulateur({
      modele: venuPour("check", avecFeuille),
    });
    await repondreJusquAuResultat(user);
    const visionneuse = await screen.findByRole("region", {
      name: "Aperçu de la fiche patient",
    });

    const [lien] = avis();
    if (!lien) throw new Error("Aucun avis.");
    expect(visionneuse.contains(lien)).toBe(false);
    expect(
      visionneuse.compareDocumentPosition(lien) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(lien.closest(".fr-no-print")).not.toBeNull();
  });
});

describe("l'avis sous le second résultat", () => {
  it.each(["check", "prescribe"] as const)(
    "vient une fois le document prêt, sans attendre un clic, venu pour « %s »",
    async (intent) => {
      const gabarit = gabaritRetenu();
      const user = await ouvrirLeSimulateur({
        modele: venuPour(intent, auGabarit(gabarit.charge)),
      });
      await allerAuCerfa(user);
      expect(bouton("Préparation du PDF…")).toBeDisabled();
      expect(avis()).toEqual([]);

      gabarit.lache();

      expect(
        await screen.findByRole("link", { name: /^Donnez votre avis/ }),
      ).toHaveAttribute("href", ADRESSE);
      expect(avis()).toHaveLength(1);
    },
  );

  it("ne vient pas quand le document n'a pas pu être généré", async () => {
    const enEchec = auGabarit(() =>
      Promise.reject(new Error("Gabarit introuvable.")),
    );
    const user = await ouvrirLeSimulateur({
      modele: venuPour("check", enEchec),
    });
    await allerAuCerfa(user);

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(avis()).toEqual([]);
  });
});
