// Ce que le simulateur envoie au journal des parcours sur P0 (#383) : le début
// d'une simulation, une seule fois, et l'intention du premier choix validé.
// Voir docs/knowledge/adr/analytics.md, ADR-6 et ADR-7.

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "../../../front/socle/app";
import type { Model } from "../../../front/socle/model";
import type { AnalyticsEvent } from "../../../shared/analytics/analytics-event";
import type { Referentiel } from "../../../shared/referentiel";
import { chargee, journalDeTest } from "../analytics/journal-de-test";
import { given, modeleDeTest, seulModele } from "../modele-de-test";
import {
  ACCOMPAGNEMENTS,
  allerAuResultat,
  BOISSON,
  bouton,
  ouvrirLeSimulateur,
  question,
  radio,
} from "./questionnaire";

// On vient goûter un thé, et commander un café.
const venuPourUneBoisson: Model = {
  ...modeleDeTest,
  intent: given
    .question("boisson")
    .answer()
    .compute((boisson) => {
      if (boisson.is("the")) return "check";
      if (boisson.is("cafe")) return "prescribe";
      return null;
    }),
};

async function ouvrirAvecUnJournal() {
  const { analytics, envoyes } = journalDeTest();
  const user = await ouvrirLeSimulateur({
    analytics,
    modele: venuPourUneBoisson,
  });
  await question(BOISSON);
  return { user, envoyes };
}

const types = (envoyes: { type: string }[]) => envoyes.map((e) => e.type);

// Le début et l'intention, sans les questions ni les phases (ADR-8).
const duParcours = (envoyes: AnalyticsEvent[]) =>
  envoyes.filter(({ type }) =>
    ["simulation_started", "intent_selected"].includes(type),
  );

describe("le journal des parcours sur P0", () => {
  it("P0 ouverte sans choix : un début, sans intention", async () => {
    const { envoyes } = await ouvrirAvecUnJournal();

    expect(duParcours(envoyes)).toEqual([
      expect.objectContaining({
        type: "simulation_started",
        sequence: 1,
        screen: "P0",
        establishment_id: "e_chu_grenoble",
        service_id: "s_grenoble_cardio",
      }),
    ]);
  });

  it("le premier choix validé donne l'intention, dans la même simulation", async () => {
    const { user, envoyes } = await ouvrirAvecUnJournal();

    await user.click(radio("Un thé"));
    await question(ACCOMPAGNEMENTS);

    const [debut, intention] = duParcours(envoyes);
    expect(intention).toEqual(
      expect.objectContaining({
        type: "intent_selected",
        simulation_id: debut?.simulation_id,
        screen: "P0",
        intent: "eligibilite_seule",
      }),
    );
  });

  it("un retour à P0 garde la simulation et sa première intention", async () => {
    const { user, envoyes } = await ouvrirAvecUnJournal();
    await user.click(radio("Un thé"));
    await question(ACCOMPAGNEMENTS);

    await user.click(bouton("Précédent"));
    await question(BOISSON);
    await user.click(radio("Un café"));
    await question(ACCOMPAGNEMENTS);

    const parcours = duParcours(envoyes);
    expect(types(parcours)).toEqual(["simulation_started", "intent_selected"]);
    expect(parcours[1]?.intent).toBe("eligibilite_seule");
  });

  it("une nouvelle simulation a son propre identifiant", async () => {
    const { analytics, envoyes } = journalDeTest();
    const user = await ouvrirLeSimulateur({
      analytics,
      modele: venuPourUneBoisson,
    });
    await allerAuResultat(user);

    await user.click(bouton("Faire une nouvelle simulation"));
    await question(BOISSON);

    const debuts = envoyes.filter((e) => e.type === "simulation_started");
    expect(debuts).toHaveLength(2);
    expect(debuts[1]?.simulation_id).not.toBe(debuts[0]?.simulation_id);
    expect(debuts[1]?.sequence).toBe(1);
  });

  it("ouverte sur une page rechargée, la simulation le dit, et pas la suivante", async () => {
    const { analytics, envoyes } = journalDeTest(chargee("reload"));
    const user = await ouvrirLeSimulateur({
      analytics,
      modele: venuPourUneBoisson,
    });
    await allerAuResultat(user);

    await user.click(bouton("Faire une nouvelle simulation"));
    await question(BOISSON);

    const debuts = envoyes.filter((e) => e.type === "simulation_started");
    expect(debuts.map(({ navigation }) => navigation)).toEqual([
      "reload",
      undefined,
    ]);
  });

  it("chaque événement dit l'app : les règles du modèle ouvert, la version et le commit du build", async () => {
    const { analytics, envoyes } = journalDeTest();
    const user = await ouvrirLeSimulateur({
      analytics,
      modele: venuPourUneBoisson,
    });

    await allerAuResultat(user);

    expect(envoyes.length).toBeGreaterThan(2);
    for (const evenement of envoyes) {
      expect(evenement).toMatchObject({
        version: modeleDeTest.version,
        app_version: "0.8.0",
        commit_sha: "f30aafe",
      });
    }
  });

  it("deux services de même nom, dans deux établissements, gardent leur identifiant", async () => {
    const services = [];
    for (const etablissement of ["Hôpital Nord", "Hôpital Sud"]) {
      const { envoyes } = await seRattacherA(etablissement, "Cardiologie");
      services.push(envoyes[0]?.service_id);
    }

    expect(services).toEqual(["s_nord_cardio", "s_sud_cardio"]);
  });
});

// ---- implémentation ----

// Deux établissements qui ont chacun un service « Cardiologie ».
const DEUX_CARDIOLOGIES: Referentiel = {
  async listerEtablissements() {
    return [
      { id: "e_nord", libelle: "Hôpital Nord" },
      { id: "e_sud", libelle: "Hôpital Sud" },
    ];
  },
  async listerServices(etabId) {
    const id = etabId === "e_nord" ? "s_nord_cardio" : "s_sud_cardio";
    return [{ id, libelle: "Cardiologie" }];
  },
};

async function seRattacherA(etablissement: string, service: string) {
  const { analytics, envoyes } = journalDeTest();
  const user = userEvent.setup();
  const { unmount } = render(
    <App
      models={seulModele(modeleDeTest)}
      referentiel={DEUX_CARDIOLOGIES}
      declarer={() => {}}
      analytics={analytics}
    />,
  );
  await choisir(user, /Établissement/, etablissement);
  await choisir(user, /Nom du service/, service);
  await question(BOISSON);
  unmount();
  return { envoyes };
}

async function choisir(
  user: ReturnType<typeof userEvent.setup>,
  label: RegExp,
  option: string,
) {
  const select = screen.getByRole("combobox", { name: label });
  await within(select).findByRole("option", { name: option });
  await user.selectOptions(select, option);
}
