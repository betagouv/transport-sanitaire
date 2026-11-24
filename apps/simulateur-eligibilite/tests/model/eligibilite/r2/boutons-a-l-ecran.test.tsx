// Les boutons du résultat du modèle de l'éditeur, comme à l'écran : le vrai
// simulateur, ouvert sur une seed de l'écran des seeds. Chaque issue a ses
// boutons, et seulement eux. Les libellés se testent issue par issue dans
// `boutons-du-resultat.test.ts`.

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { SEEDS } from "../../../../core/models/eligibilite/seeds-catalogue";
import { model } from "../../../../front/models/eligibilite";
import { catalogueResultats } from "../../../../front/models/eligibilite/r2/components/textes-de-l-editeur";
import { rangerRattachement } from "../../../../front/socle/rattachement";
import { ouvrirLeSimulateur } from "../../../socle/simulateur/questionnaire";
import { MODELE_AUX_GABARITS_DU_DISQUE } from "../modele-aux-gabarits-du-disque";

// Le catalogue des textes et celui des seeds sont chargés une fois : la
// première fiche n'attend pas leurs 900 ko.
await catalogueResultats();
await model.core.seeds();

const PRECEDENT = "Précédent";
const NOUVELLE = "Faire une nouvelle simulation";
const COMPLETER = "Compléter la prescription";
const ACCORD = "Compléter la demande d’accord préalable";
// La fiche à remettre au patient, en PDF : seules les issues à fiche l'ont.
const TELECHARGER = "Télécharger";

beforeEach(() => rangerRattachement(null));

async function ouvrirLaSeed(id: string) {
  const seed = SEEDS.find((candidate) => candidate.id === id);
  if (!seed) throw new Error(`Seed inconnue : ${id}`);
  // L'écran des seeds rejoue chacune de celles qu'il liste : il n'a que celle-ci.
  const user = await ouvrirLeSimulateur({
    modele: MODELE_AUX_GABARITS_DU_DISQUE,
    seeds: [seed],
  });
  await user.click(await screen.findByRole("button", { name: "Seeds" }));
  await user.click(
    await screen.findByRole("button", { name: `Ouvrir : ${seed.label}` }),
  );
  // Le `h1` vient avec le résultat, une fois ses textes chargés.
  await screen.findByRole("heading", { level: 1 });
}

// Les boutons que le résultat peut poser, dans l'ordre où il les pose. Ceux des
// developer tools et de la trace de debug n'y figurent pas.
const boutonsDuResultat = () =>
  [
    PRECEDENT,
    NOUVELLE,
    COMPLETER,
    ACCORD,
    "Compléter la demande d’examen",
    TELECHARGER,
  ].filter((nom) => screen.queryByRole("button", { name: nom }) !== null);

describe("les boutons du modèle de l'éditeur", () => {
  it.each([
    ["issue-caisse", [PRECEDENT, NOUVELLE]],
    ["issue-etablissement", [PRECEDENT, NOUVELLE]],
    ["issue-permission-patient", [PRECEDENT, NOUVELLE]],
    ["issue-convocation", [PRECEDENT, NOUVELLE]],
    ["issue-non-eligible", [PRECEDENT, NOUVELLE, TELECHARGER]],
    ["issue-pmt", [PRECEDENT, NOUVELLE, COMPLETER, TELECHARGER]],
    ["issue-dap-sans-urgence", [PRECEDENT, NOUVELLE, ACCORD, TELECHARGER]],
    ["issue-dap-urgence-attestee", [PRECEDENT, NOUVELLE, ACCORD, TELECHARGER]],
    ["issue-s3141", [PRECEDENT, NOUVELLE, COMPLETER, TELECHARGER]],
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
      await screen.findByRole("group", {
        name: /^Quel trajet cette prescription doit-elle couvrir/,
      }),
    ).toBeInTheDocument();
  });

  it("pose R3 : son titre, son texte et ses deux actions", async () => {
    await ouvrirLaSeed("issue-pmt");
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: COMPLETER }));

    await user.click(await screen.findByLabelText("Aller simple"));
    await user.type(
      await screen.findByLabelText(/^Combien d’allers simples/),
      "2",
    );
    await user.click(screen.getByRole("button", { name: "Suivant" }));
    await user.selectOptions(
      await screen.findByRole("combobox", {
        name: /^Quel est le lieu de départ/,
      }),
      "Domicile",
    );
    await saisirUneAdresse(user, "1 rue A", "75001");
    await user.click(screen.getByRole("button", { name: "Suivant" }));
    await user.type(
      await screen.findByLabelText(/^Nom de la structure/),
      "Hôpital B",
    );
    await saisirUneAdresse(user, "2 rue B", "75002");
    await user.click(screen.getByRole("button", { name: "Suivant" }));
    // Le centre de référence, seul sur sa page, avance de lui-même.
    await user.click(await screen.findByLabelText("Non"));
    await user.click(await screen.findByLabelText(/^Non, aucun autre cas/));
    await user.click(screen.getByRole("button", { name: "Terminer" }));

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: /^Prescription préremplie prête à imprimer/,
      }),
    ).toBeInTheDocument();
    // Le texte attend le PDF.
    expect(
      await screen.findByText(/^Le document est prêt à être imprimé\./),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Imprimer" })).toBeVisible();
    expect(
      screen.getByRole("button", {
        name: /^(Télécharger|Préparation du PDF)$/,
      }),
    ).toBeVisible();
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
