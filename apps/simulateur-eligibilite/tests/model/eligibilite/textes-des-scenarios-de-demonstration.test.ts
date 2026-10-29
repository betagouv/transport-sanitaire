// Les textes des scénarios de démonstration de l'éditeur, comparés aux nôtres.
// Ils viennent de son paquet v10.1.3
// (`integration_resultats/scenarios-demonstration.json`) : pour chaque scénario,
// le texte que lit le patient ou le prescripteur.
//
// Un scénario prend ses faits dans `scenarios-de-demonstration.json`, par son
// identifiant. Ses réponses et ses précisions sont dans cette fixture. On en
// tire la trace, puis notre texte. L'assertion compare ce texte à celui de
// l'éditeur, champ par champ.
//
// La fixture range le texte de l'éditeur sous ses noms à lui. Elle le découpe
// comme le nôtre : les consignes en lignes, sans `<br>` ni puce, et sans la
// marque ` [badges]`.
//
// Cinq des 133 scénarios sont écartés :
// - les quatre trajets mixtes (avion ou bateau, puis une partie terrestre).
//   L'éditeur y donne les consignes du mode terrestre. Aucune question ne pose
//   cette partie : notre app ne peut pas y arriver ;
// - `ISSUE_NON_ELIGIBLE--AUCUN_ALD_CADRE_NON_QUALIFIANT`. L'éditeur y lit l'ALD
//   dans un fait ; nous la lisons dans une précision. L'écart reste à trier.
//
// Ne sont pas comparés :
// - les faits que la page du prescripteur liste chez l'éditeur. Il les dit
//   phrases de démonstrateur : nous ne les montrons pas ;
// - les boutons et l'introduction de la fiche (`completeLabel`, `canComplete`,
//   `patientSheetIntro`) ;
// - les codes, la raison, la variante et le diagnostic. La raison est une cible,
//   que teste déjà `scenarios-de-demonstration.test.ts`.

import { describe, expect, it } from "vitest";
import { cibles } from "../../../core/models/eligibilite/evaluation-des-regles";
import { texteDeLaFicheNegative } from "../../../front/models/eligibilite/r2/fiche-negative/texte-de-la-fiche-negative";
import {
  type IssueAvecFichePositive,
  texteDeLaFichePositive,
} from "../../../front/models/eligibilite/r2/fiche-positive/texte-de-la-fiche-positive";
import {
  type IssueSansFiche,
  texteDuPrescripteur,
} from "../../../front/models/eligibilite/r2/prescripteur/texte-du-prescripteur";
import type { Trace } from "../../../front/models/eligibilite/r2/trace-du-resultat";
import { type Changements, faitsDuCas } from "./faits-de-l-oracle";
import { catalogue } from "./fiches-du-test";
import DEMONSTRATION from "./scenarios-de-demonstration.json" with {
  type: "json",
};
import FIXTURE from "./textes-des-scenarios-de-demonstration.json" with {
  type: "json",
};

type Scenario = {
  readonly id: string;
  readonly issue: string;
  readonly template: string;
  readonly criteres: readonly number[];
  readonly permissionRepeated: boolean;
  readonly precisions: Trace["precisions"];
  readonly textes: unknown;
};

const SCENARIOS = FIXTURE.scenarios as readonly Scenario[];

const FAITS = new Map<
  string,
  Readonly<Record<string, boolean | null | undefined>>
>(DEMONSTRATION.scenarios.map(({ id, faits }) => [id, faits]));

describe("les textes des scénarios de démonstration de l'éditeur", () => {
  it("sont 128 : les 133 actifs, moins les 5 écartés", () => {
    expect(SCENARIOS).toHaveLength(128);
  });

  it.each(SCENARIOS.map((scenario) => [scenario.id, scenario] as const))(
    "%s",
    (_id, scenario) => {
      expect(texteDe(scenario)).toEqual(scenario.textes);
    },
  );
});

// ---- implémentation ----

// Notre texte du scénario, sous les noms de l'éditeur.
function texteDe(scenario: Scenario): unknown {
  const trace = traceDe(scenario);
  if (scenario.template === "patient-positive") {
    const issue = scenario.issue as IssueAvecFichePositive;
    return fichePositive(texteDeLaFichePositive(catalogue, trace, issue));
  }
  if (scenario.template === "patient-negative") {
    return ficheNegative(texteDeLaFicheNegative(catalogue, trace));
  }
  const issue = scenario.issue as IssueSansFiche;
  return prescripteur(texteDuPrescripteur(catalogue, issue, trace));
}

function traceDe(scenario: Scenario): Trace {
  const faits = faitsDuCas(changementsDe(scenario.id));
  return {
    cibles: cibles(faits),
    faits,
    criteres: scenario.criteres,
    permissionRepeated: scenario.permissionRepeated,
    precisions: scenario.precisions,
  };
}

// Les faits du scénario. Un `null` devient un fait absent.
function changementsDe(id: string): Changements {
  const faits = FAITS.get(id);
  if (!faits) throw new Error(`Scénario sans faits : ${id}`);
  return Object.fromEntries(
    Object.entries(faits).map(([fait, value]) => [fait, value ?? undefined]),
  );
}

type FichePositive = NonNullable<ReturnType<typeof texteDeLaFichePositive>>;

function fichePositive(texte: FichePositive | undefined) {
  if (!texte) return undefined;
  const { consignes } = texte;
  return {
    title: texte.titreDuPatient,
    prescriberTitle: texte.titreDuPrescripteur,
    eligibility: texte.raison ?? null,
    cards: texte.cartes.map(({ retenue, titre, texte }) => ({
      selected: retenue,
      title: titre,
      text: texte,
    })),
    badges: pucesDe(texte).flatMap((puce) => puce.badges ?? []),
    instructions: {
      intro: consignes.introduction,
      subtitle: consignes.complement,
      steps: consignes.etapes.map(({ titre, blocs }) => ({
        title: titre,
        lines: lignesDe(blocs),
      })),
    },
    blueReminder: texte.rappel?.texte ?? null,
    finance: texte.finance,
  };
}

type Blocs = FichePositive["consignes"]["etapes"][number]["blocs"];

const pucesDe = (texte: FichePositive) =>
  texte.consignes.etapes
    .flatMap(({ blocs }) => blocs)
    .flatMap((bloc) => (bloc.type === "liste" ? bloc.puces : []));

// Un paragraphe donne une ligne par retour à la ligne ; une liste, une par puce.
function lignesDe(blocs: Blocs): string[] {
  return blocs
    .flatMap((bloc) =>
      bloc.type === "paragraphe"
        ? bloc.texte.split("\n")
        : bloc.puces.map((puce) => puce.texte),
    )
    .map((ligne) => ligne.trim())
    .filter((ligne) => ligne !== "");
}

function ficheNegative(texte: ReturnType<typeof texteDeLaFicheNegative>) {
  const { consignes } = texte;
  return {
    title: texte.titreDuPatient,
    prescriberTitle: texte.titreDuPrescripteur,
    eligibility: texte.raison,
    cardIntro: texte.introDesCartes,
    cards: texte.cartes,
    instructions: {
      title: consignes.titre,
      subtitle: consignes.sousTitre ?? null,
      body: consignes.texte,
      steps: consignes.etapes,
    },
    aldAdvice: texte.conseilAld ?? null,
    finance: texte.finance,
  };
}

function prescripteur(texte: ReturnType<typeof texteDuPrescripteur>) {
  return {
    prescriberTitle: texte.titre,
    practitionerIntro: texte.introduction ?? null,
    whyTitle: texte.pourquoi?.titre ?? null,
    whyItems: (texte.pourquoi?.elements ?? []).map(({ titre, texte }) => ({
      title: titre ?? null,
      body: texte,
    })),
    questions: texte.questions,
    actions: texte.actions,
    notice: texte.avertissement ?? null,
  };
}
