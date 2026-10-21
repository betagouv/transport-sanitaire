// Les boutons du résultat du modèle de l'éditeur, comme à l'écran (#137) : le
// vrai simulateur, ouvert sur une seed de l'écran des seeds. Chaque issue a ses
// boutons, et seulement eux. Les libellés se testent issue par issue dans
// `boutons-du-resultat.test.ts`.

import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { model } from "../../../front/models/eligibilite";
import { catalogueResultats } from "../../../front/models/eligibilite/catalogue-resultats";
import { SEEDS } from "../../../front/models/eligibilite/seeds-catalogue";
import { rangerRattachement } from "../../../front/socle/rattachement/session";
import { ouvrirLeSimulateur } from "../../socle/simulateur/questionnaire";

// Le catalogue des textes et celui des seeds sont chargés une fois : la
// première fiche n'attend pas leurs 900 ko.
await catalogueResultats();
await model.seeds();

const PRECEDENT = "Précédent";
const NOUVELLE = "Faire une nouvelle simulation";

// L'écran des seeds liste une trentaine de situations : sous la charge de la
// suite entière, il met plus que la seconde par défaut. Un test attend trois
// fois : son délai couvre les trois.
const ATTENTE = { timeout: 4000 };
const DELAI_D_UN_TEST = { timeout: 3 * ATTENTE.timeout };

beforeEach(() => rangerRattachement(null));

async function ouvrirLaSeed(id: string) {
  const seed = SEEDS.find((candidate) => candidate.id === id);
  if (!seed) throw new Error(`Seed inconnue : ${id}`);
  const user = await ouvrirLeSimulateur({ produit: true, modele: model });
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

// Les boutons que le résultat peut poser, dans l'ordre où il les pose. Ceux des
// developer tools et de la trace de debug n'y figurent pas.
const boutonsDuResultat = () =>
  [
    PRECEDENT,
    NOUVELLE,
    "Compléter la prescription",
    "Compléter la demande d’accord préalable",
    "Compléter la demande d’examen",
  ].filter((nom) => screen.queryByRole("button", { name: nom }) !== null);

describe("les boutons du modèle de l'éditeur", DELAI_D_UN_TEST, () => {
  it.each([
    ["issue-caisse", [PRECEDENT, NOUVELLE]],
    ["issue-etablissement", [PRECEDENT, NOUVELLE]],
    ["issue-permission-patient", [PRECEDENT, NOUVELLE]],
    ["issue-convocation", [PRECEDENT, NOUVELLE]],
    ["issue-non-eligible", [PRECEDENT, NOUVELLE]],
    ["issue-pmt", [PRECEDENT, NOUVELLE]],
    ["issue-dap-sans-urgence", [PRECEDENT, NOUVELLE]],
    ["issue-dap-urgence-attestee", [PRECEDENT, NOUVELLE]],
    ["issue-s3141", [PRECEDENT, NOUVELLE]],
    ["issue-dap-etranger-a-examiner", [PRECEDENT, NOUVELLE]],
  ])("%s a ses boutons, et seulement eux", async (id, attendus) => {
    await ouvrirLaSeed(id);

    expect(boutonsDuResultat()).toEqual(attendus);
  });

  it("oriente un retour pénitentiaire administratif, sans rien à compléter", async () => {
    await ouvrirLaSeed("orientation-penitentiaire");

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Ce retour relève de l’organisation pénitentiaire",
      }),
    ).toBeInTheDocument();
    expect(boutonsDuResultat()).toEqual([PRECEDENT, NOUVELLE]);
  });

  it("garde le stepper sur le résultat : P3 n'a pas encore de page", async () => {
    await ouvrirLaSeed("issue-pmt");

    expect(
      screen.getByRole("heading", {
        name: "Résultat de l’éligibilité Étape 3 sur 3",
      }),
    ).toBeInTheDocument();
  });
});
