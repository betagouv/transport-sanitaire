// Le texte médical de la PMT et de la DAP (#159) : ses segments, leur ordre et
// leur forme (D-141 à D-147), depuis les réponses d'un parcours et les cibles
// que les règles calculent. `CONTRAT_ELEMENTS_MEDICAUX.json` en v10.1.3.

import { describe, expect, it } from "vitest";
import type { Faits } from "../../../core/models/eligibilite/declarations/faits";
import { SEEDS } from "../../../core/models/eligibilite/seeds-catalogue";
import { Fait } from "../../../core/socle";
import type { Donnees } from "../../../front/models/eligibilite/r3/rubriques/rubrique";
import {
  TEXTE_MEDICAL,
  type TexteMedical,
} from "../../../front/models/eligibilite/r3/rubriques/texte-medical";
import { ENTREE, MATERNITE_ETABLIE } from "./reponses-de-la-branche";
import { donnees, PMT, type Reponses } from "./reponses-du-cerfa";
import type { ValeursDesCibles } from "./traces-du-prescripteur";

const SEANCE = "Ce déplacement concerne une séance de dialyse en centre";
const PAS_AUTONOME =
  "ne peut pas se déplacer de manière autonome sur une longue distance, utiliser seul les transports en commun ou conduire un véhicule personnel en raison de sa pathologie, de son traitement ou d’un handicap";
const MALAISE =
  "présente un risque d’effets secondaires, de malaise ou de complications pendant le transport";
const MINEUR =
  "Mineur nécessitant des soins prolongés en raison d’un handicap, d’une incapacité ou d’un accident";

describe("le texte médical", () => {
  it("joint le soin et les besoins par « ; », sans majuscule après", () => {
    expect(texte(PMT)).toEqual({
      elements_medicaux: `${SEANCE} ; ${PAS_AUTONOME} ; ${MALAISE}`,
      elements_medicaux_precision: "Dialyse.",
    });
  });

  it("finit par un point quand il n'a pas de précision", () => {
    const { "Q3.4": _, ...sansPrecision } = PMT;

    expect(texte(sansPrecision)).toEqual({
      elements_medicaux: `${SEANCE} ; ${PAS_AUTONOME} ; ${MALAISE}.`,
      elements_medicaux_precision: undefined,
    });
  });

  it("garde la casse de la précision, et normalise ses espaces", () => {
    const reponses = { ...PMT, "Q3.4": "  Centre de\n dialyse  Necker. " };

    expect(texte(reponses).elements_medicaux_precision).toBe(
      "Centre de dialyse Necker.",
    );
  });

  it("ne donne rien quand aucun segment n'est établi", () => {
    expect(texte({})).toEqual({
      elements_medicaux: undefined,
      elements_medicaux_precision: undefined,
    });
  });
});

describe("le soin", () => {
  it("reprend le libellé de Q2.1, sans la définition d'un sigle", () => {
    expect(texte(ENTREE).elements_medicaux).toBe(
      "Entrée ou sortie d’hospitalisation, ou admission en HAD.",
    );
  });

  it("ne vient ni d'« Autre soin » ni d'« Aucun »", () => {
    for (const motif of ["14_AUTRE", "15_AUCUN"] as const)
      expect(texte({ ...ENTREE, "Q2.1": motif }).elements_medicaux).toBe(
        undefined,
      );
  });
});

describe("les besoins", () => {
  it("suivent l'ordre de Q1.2, les critères d'ambulance en mots courts", () => {
    const reponses: Reponses = {
      ...PMT,
      "Q1.2": ["8_BRANCARDAGE", "1_PAS_AUTONOME", "7_ALLONGE"],
    };

    expect(texte(reponses).elements_medicaux).toBe(
      `${SEANCE} ; ${PAS_AUTONOME} ; position allongée ou semi-assise sur brancard nécessaire ; brancardage ou portage nécessaire`,
    );
  });

  it("comptent le proche de Q1.1", () => {
    const reponses = { ...ENTREE, "Q1.1": "2_AVEC_UN_PROCHE" } as const;

    expect(texte(reponses).elements_medicaux).toBe(
      "Entrée ou sortie d’hospitalisation, ou admission en HAD ; nécessite l’accompagnement d’un proche pour se déplacer ou transmettre les informations nécessaires à l’équipe soignante, sans intervention d’un professionnel pendant le transport.",
    );
  });
});

describe("les compléments", () => {
  it("suivent l'ordre de COMPLETION_DOCUMENTS, la mention du mineur telle quelle", () => {
    const cibles: ValeursDesCibles = {
      cible_situation_at_mp: true,
      cible_ambulance_equipement_bariatrique: true,
      cible_dap_motif_camsp_cmpp: true,
      cible_mineur_ald_non_exonerante_reconnue: true,
      cible_issue_id: "ISSUE_DAP_ETRANGER_A_EXAMINER",
    };
    const { "Q3.4": _, ...sansPrecision } = PMT;

    const faits = { fait_ald_liee: Fait.oui("test") };

    expect(texte(sansPrecision, cibles, faits).elements_medicaux).toBe(
      [
        SEANCE,
        PAS_AUTONOME,
        MALAISE,
        "équipement bariatrique adapté nécessaire",
        "soins en lien avec une ALD reconnue",
        "transport en lien avec un accident du travail ou une maladie professionnelle",
        "soins dans le cadre d’un parcours CAMSP ou CMPP",
        MINEUR,
        "demande d’examen de la prise en charge du transport à l’étranger.",
      ].join(" ; "),
    );
  });

  it("commencent par une majuscule quand ils ouvrent le texte", () => {
    const cibles = { cible_situation_at_mp: true };

    expect(texte({}, cibles).elements_medicaux).toBe(
      "Transport en lien avec un accident du travail ou une maladie professionnelle.",
    );
  });

  it("justifient la distance par la saisie du prescripteur, telle quelle", () => {
    const reponses = {
      ...dap(),
      "Q3.4.distance":
        "Seul le CHU (centre hospitalier universitaire) de Lyon. ",
    };

    expect(texte(reponses).elements_medicaux).toMatch(
      / ; justification médicale du lieu de soins éloigné : Seul le CHU \(centre hospitalier universitaire\) de Lyon$/,
    );
  });

  it("n'impriment pas la distance sans sa justification", () => {
    expect(texte(dap()).elements_medicaux).not.toMatch(/justification|\[/);
  });

  it("disent l'examen de l'Engagement maternité, en doublon du soin (D-146)", () => {
    expect(texte(MATERNITE_ETABLIE).elements_medicaux).toBe(
      "À un examen obligatoire du 8ᵉ ou du 9ᵉ mois de grossesse en maternité, ou à un hébergement temporaire prévu en raison de l’éloignement de la maternité ; engagement maternité : examen obligatoire du 8ᵉ ou du 9ᵉ mois de grossesse.",
    );
  });

  it("disent l'hébergement de l'Engagement maternité", () => {
    const reponses: Reponses = {
      ...MATERNITE_ETABLIE,
      "Q2.14.motif": ["2_HEBERGEMENT_ENGAGEMENT"],
    };

    expect(texte(reponses).elements_medicaux).toMatch(
      / ; engagement maternité : trajet lié à l’hébergement temporaire non médicalisé\.$/,
    );
  });

  it("disent l'HTNM hors Engagement maternité", () => {
    const faits = { fait_htnm_hors_maternite: Fait.oui("test") };

    expect(texte({}, {}, faits).elements_medicaux).toBe(
      "Trajet lié à un hébergement temporaire non médicalisé, hors dispositif Engagement maternité.",
    );
  });
});

// ---- implémentation ----

function texte(
  reponses: Reponses,
  cibles: ValeursDesCibles = {},
  faits: Partial<Faits> = {},
): TexteMedical {
  const calculees = donnees(reponses, cibles);
  const lues: Donnees = {
    ...calculees,
    faits: { ...calculees.faits, ...faits },
  };
  return {
    elements_medicaux: TEXTE_MEDICAL.cellules.elements_medicaux(lues),
    elements_medicaux_precision:
      TEXTE_MEDICAL.cellules.elements_medicaux_precision(lues),
  };
}

// Une DAP pour une dialyse à plus de 150 km, P3 répondue comme la PMT :
// Q3.4.distance se pose.
function dap(): Reponses {
  const seed = SEEDS.find(({ id }) => id === "issue-dap-sans-urgence");
  const complement = Object.entries(PMT).filter(([id]) => id.startsWith("Q3."));
  return {
    ...(seed?.answers as Reponses),
    ...Object.fromEntries(complement),
  };
}
