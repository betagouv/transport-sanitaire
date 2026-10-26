// L'avis du modèle de l'éditeur en R2, comme à l'écran (#195, COR-13) : le
// vrai simulateur, ouvert sur une seed dont Q0.1 dit ce que le prescripteur
// est venu faire. L'avis vient en R2 s'il vérifie, ou si rien ne se complète.
// Celui de R3 se vérifie sur le modèle de test du socle : le navigateur de
// test ne sert pas les gabarits de l'app, le PDF ne s'y génère pas.

import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { SEEDS } from "../../../core/models/eligibilite/seeds-catalogue";
import { model } from "../../../front/models/eligibilite";
import { catalogueResultats } from "../../../front/models/eligibilite/r2/catalogue-resultats";
import { rangerRattachement } from "../../../front/socle/rattachement/session";
import { ouvrirLeSimulateur } from "../../socle/simulateur/questionnaire";

// Le catalogue des textes est chargé une fois : la première fiche n'attend
// pas ses 900 ko.
await catalogueResultats();

const ATTENTE = { timeout: 4000 };
const DELAI_D_UN_TEST = { timeout: 3 * ATTENTE.timeout };

// `CONTRAT_SATISFACTION.json` de la v10.1.3 : `label` et `url`.
const LIBELLE = "Aidez notre équipe en donnant votre avis";
const ADRESSE =
  "https://grist.numerique.gouv.fr/o/transports-sanitaires/forms/5Pftvy64N7M7i1ZeP9zs3f/6";

const VERIFIER = "1_VERIFIER";
const PRESCRIRE = "2_VERIFIER_ET_PRESCRIRE";

beforeEach(() => rangerRattachement(null));

describe("l'avis du modèle de l'éditeur en R2", DELAI_D_UN_TEST, () => {
  it.each([
    ["issue-pmt", VERIFIER, 1],
    ["issue-pmt", PRESCRIRE, 0],
    ["issue-dap-etranger-a-examiner", VERIFIER, 1],
    ["issue-dap-etranger-a-examiner", PRESCRIRE, 0],
    ["issue-non-eligible", VERIFIER, 1],
    ["issue-non-eligible", PRESCRIRE, 1],
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

// ---- implémentation ----

const avis = () =>
  screen.queryAllByRole("link", { name: `${LIBELLE} (nouvel onglet)` });

// La seed `id`, où Q0.1 vaut `besoin`, ouverte par l'écran des seeds jusqu'à
// son résultat.
async function ouvrirLaSeed(id: string, besoin: string) {
  const seed = SEEDS.find((candidate) => candidate.id === id);
  if (!seed) throw new Error(`Seed inconnue : ${id}`);
  const user = await ouvrirLeSimulateur({
    produit: true,
    modele: model,
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
}
