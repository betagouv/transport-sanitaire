// L'avis du modèle de l'éditeur, comme à l'écran (#195, COR-13) : le vrai
// simulateur, ouvert sur une seed dont Q0.1 dit ce que le prescripteur est
// venu faire. En R2, l'avis vient s'il vérifie, ou si rien ne se complète. En
// R3, il vient dans les deux cas, une fois le document prêt : les gabarits se
// lisent sur le disque, le PDF se génère.

import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { SEEDS } from "../../../core/models/eligibilite/seeds-catalogue";
import { model } from "../../../front/models/eligibilite";
import { catalogueResultats } from "../../../front/models/eligibilite/r2/catalogue-resultats";
import type { Model } from "../../../front/socle/model";
import { rangerRattachement } from "../../../front/socle/rattachement/rattachement-en-session";
import { ouvrirLeSimulateur } from "../../socle/simulateur/questionnaire";
import { completerP3 } from "./completer-p3";
import { MODELE_AUX_GABARITS_DU_DISQUE } from "./modele-aux-gabarits-du-disque";

// Le catalogue des textes et celui des seeds sont chargés une fois : la
// première fiche n'attend pas leurs 900 ko.
await catalogueResultats();
await model.core.seeds();

const ATTENTE = { timeout: 4000 };
const DELAI_D_UN_TEST = { timeout: 6 * ATTENTE.timeout };

// Le § 2.3 de `REFERENTIEL/03` de la v10.1.4 : le libellé et l'adresse.
const LIBELLE = "Donner mon avis";
const ADRESSE =
  "https://grist.numerique.gouv.fr/o/transports-sanitaires/forms/5Pftvy64N7M7i1ZeP9zs3f/6";

const VERIFIER = "1_VERIFIER";
const PRESCRIRE = "2_VERIFIER_ET_PRESCRIRE";

beforeEach(() => rangerRattachement(null));

describe("l'avis du modèle de l'éditeur en R2", DELAI_D_UN_TEST, () => {
  it.each([
    ["issue-pmt", VERIFIER, 1],
    ["issue-pmt", PRESCRIRE, 0],
    ["issue-s3141", VERIFIER, 1],
    ["issue-s3141", PRESCRIRE, 0],
    ["issue-dap-sans-urgence", VERIFIER, 1],
    ["issue-dap-sans-urgence", PRESCRIRE, 0],
    ["issue-dap-urgence-attestee", VERIFIER, 1],
    ["issue-dap-urgence-attestee", PRESCRIRE, 0],
    ["issue-dap-etranger-a-examiner", VERIFIER, 1],
    ["issue-dap-etranger-a-examiner", PRESCRIRE, 0],
    ["issue-non-eligible", VERIFIER, 1],
    ["issue-non-eligible", PRESCRIRE, 1],
    ["issue-caisse", VERIFIER, 1],
    ["issue-caisse", PRESCRIRE, 1],
    ["issue-etablissement", VERIFIER, 1],
    ["issue-etablissement", PRESCRIRE, 1],
    ["issue-permission-patient", VERIFIER, 1],
    ["issue-permission-patient", PRESCRIRE, 1],
    ["issue-convocation", VERIFIER, 1],
    ["issue-convocation", PRESCRIRE, 1],
    ["orientation-penitentiaire", VERIFIER, 1],
    ["orientation-penitentiaire", PRESCRIRE, 1],
  ])("%s, Q0.1 « %s » : %i avis", async (id, besoin, attendus) => {
    await ouvrirLaSeed(id, besoin);

    expect(avis()).toHaveLength(attendus);
  });

  it("ouvre l'adresse exacte du questionnaire, dans un nouvel onglet", async () => {
    await ouvrirLaSeed("issue-caisse", VERIFIER);

    const [lien] = avis();
    expect(lien).toHaveAttribute("href", ADRESSE);
    expect(lien).toHaveAttribute("target", "_blank");
  });
});

describe("l'avis du modèle de l'éditeur en R3", DELAI_D_UN_TEST, () => {
  it.each([
    ["issue-pmt", VERIFIER, "Compléter la prescription"],
    ["issue-pmt", PRESCRIRE, "Compléter la prescription"],
    [
      "issue-dap-sans-urgence",
      PRESCRIRE,
      "Compléter la demande d’accord préalable",
    ],
  ])(
    "%s, Q0.1 « %s » : un avis, le document prêt",
    async (id, besoin, completer) => {
      const user = await ouvrirLaSeed(
        id,
        besoin,
        MODELE_AUX_GABARITS_DU_DISQUE,
      );
      await user.click(
        await screen.findByRole("button", { name: completer }, ATTENTE),
      );
      await completerP3(user);

      expect(avis()).toHaveLength(1);
    },
  );
});

// ---- implémentation ----

const avis = () =>
  screen.queryAllByRole("link", { name: `${LIBELLE} (nouvel onglet)` });

// La seed `id`, où Q0.1 vaut `besoin`, ouverte par l'écran des seeds jusqu'à
// son résultat.
async function ouvrirLaSeed(id: string, besoin: string, modele: Model = model) {
  const seed = SEEDS.find((candidate) => candidate.id === id);
  if (!seed) throw new Error(`Seed inconnue : ${id}`);
  const user = await ouvrirLeSimulateur({
    produit: true,
    modele,
    seeds: [{ ...seed, answers: { ...seed.answers, "Q0.1": besoin } }],
  });
  await user.click(
    await screen.findByRole("button", { name: "Seeds" }, ATTENTE),
  );
  await user.click(
    await screen.findByRole(
      "button",
      { name: `Ouvrir : ${seed.label}` },
      ATTENTE,
    ),
  );
  // Le `h1` vient avec le résultat, une fois ses textes chargés.
  await screen.findByRole("heading", { level: 1 }, ATTENTE);
  return user;
}
