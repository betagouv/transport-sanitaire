// Les boutons du résultat du modèle de l'éditeur, comme à l'écran (#137) : le
// vrai simulateur, ouvert sur une seed de l'écran des seeds. Chaque issue a ses
// boutons, et seulement eux. Les libellés se testent issue par issue dans
// `boutons-du-resultat.test.ts`.

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { model } from "../../../front/models/eligibilite";
import { catalogueResultats } from "../../../front/models/eligibilite/r2/catalogue-resultats";
import { SEEDS } from "../../../front/models/eligibilite/seeds-catalogue";
import { rangerRattachement } from "../../../front/socle/rattachement/session";
import { ouvrirLeSimulateur } from "../../socle/simulateur/questionnaire";

// Le catalogue des textes et celui des seeds sont chargés une fois : la
// première fiche n'attend pas leurs 900 ko.
await catalogueResultats();
await model.seeds();

const PRECEDENT = "Précédent";
const NOUVELLE = "Faire une nouvelle simulation";
const COMPLETER = "Compléter la prescription";

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
    COMPLETER,
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
    ["issue-pmt", [PRECEDENT, NOUVELLE, COMPLETER]],
    [
      "issue-dap-sans-urgence",
      [PRECEDENT, NOUVELLE, "Compléter la demande d’accord préalable"],
    ],
    [
      "issue-dap-urgence-attestee",
      [PRECEDENT, NOUVELLE, "Compléter la demande d’accord préalable"],
    ],
    ["issue-s3141", [PRECEDENT, NOUVELLE, COMPLETER]],
    [
      "issue-dap-etranger-a-examiner",
      [PRECEDENT, NOUVELLE, "Compléter la demande d’examen"],
    ],
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

  it("compte P3 dans le stepper : le résultat en est l'avant-dernière étape", async () => {
    await ouvrirLaSeed("issue-pmt");

    expect(
      screen.getByRole("heading", {
        name: "Résultat de l’éligibilité Étape 3 sur 4",
      }),
    ).toBeInTheDocument();
  });

  it("ouvre P3 par « Compléter la prescription »", async () => {
    await ouvrirLaSeed("issue-pmt");
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: COMPLETER }));

    expect(
      await screen.findByLabelText(/^Combien de transports faut-il prescrire/),
    ).toBeInTheDocument();
  });

  it("récapitule sur R3 les réponses de P3, en attendant le PDF", async () => {
    await ouvrirLaSeed("issue-pmt");
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: COMPLETER }));

    await user.type(
      await screen.findByLabelText(/^Combien de transports faut-il prescrire/),
      "2",
    );
    await user.click(screen.getByLabelText("Aller simple"));
    await user.click(screen.getByRole("button", { name: "Suivant" }));
    await user.selectOptions(
      await screen.findByRole("combobox", {
        name: /^Quel est le lieu de départ/,
      }),
      "Domicile ou autre lieu de vie",
    );
    await saisirUneAdresse(user, "1 rue A", "75001");
    await user.click(screen.getByRole("button", { name: "Suivant" }));
    await screen.findByRole("group", { name: /^Adresse du lieu d’arrivée/ });
    await saisirUneAdresse(user, "2 rue B", "75002");
    await user.click(screen.getByRole("button", { name: "Suivant" }));
    await user.click(await screen.findByLabelText("Non"));
    await user.click(screen.getByRole("button", { name: "Terminer" }));

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: /^Informations recueillies/,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("2 transport(s)")).toBeInTheDocument();
    expect(screen.getByText("Aller simple")).toBeInTheDocument();
  });
});

// Une adresse à Paris, dans les champs de la page ouverte.
async function saisirUneAdresse(
  user: ReturnType<typeof userEvent.setup>,
  voie: string,
  codePostal: string,
) {
  const champ = (libelle: string) =>
    screen.getByRole("textbox", { name: (nom) => nom.startsWith(libelle) });
  await user.type(champ("Numéro et voie"), voie);
  await user.type(champ("Code postal"), codePostal);
  await user.type(champ("Commune"), "Paris");
}
