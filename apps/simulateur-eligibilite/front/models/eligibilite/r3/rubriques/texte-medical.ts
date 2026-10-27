// Le texte médical de la PMT (page 3) et de la DAP (page 2) : les segments que
// le parcours établit, dans l'ordre de `COMPLETION_DOCUMENTS.md`, joints par
// « ; » (`CONTRAT_ELEMENTS_MEDICAUX.json`, D-141 à D-147).
//
// Un segment reprend le libellé d'une réponse, ou le texte du contrat. Il perd
// la définition de ses sigles et son point final, et sa majuscule s'il ne
// commence pas le texte. La mention du mineur reste littérale. La précision du
// prescripteur (Q3.4) a sa propre cellule : le cerfa la joint au texte, et la
// retire faute de place. Le point final va au dernier des deux.

import { OPTIONS } from "../../../../../core/models/eligibilite/declarations/questions";
import { given } from "../../../../../core/models/eligibilite/question";
import type { Value } from "../../../../../core/socle";
import type { Rubrique } from "./rubrique";

/** Rien n'est établi, ou rien n'est saisi : la cellule reste vide. */
type AucunSegment = undefined;

export type TexteMedical = {
  readonly elements_medicaux: string | AucunSegment;
  readonly elements_medicaux_precision: string | AucunSegment;
};

// La précision du prescripteur (Q3.4), saisie telle quelle.
const PRECISION = given.question("Q3.4").answer().compute(lueTelleQuelle);

// Ce que lit le texte : les réponses du soin et des besoins, et les cibles et
// les faits qui portent la condition des segments du contrat.
const ENTREES = given.all({
  motif: given.question("Q2.1").answer(),
  seances: given.question("Q1.3").answer(),
  aides: given.question("Q1.2").answer(),
  accompagnement: given.question("Q1.1").answer(),
  motifMaternite: given.question("Q2.14.motif").answer(),
  justification: given
    .question("Q3.4.distance")
    .answer()
    .compute(lueTelleQuelle),
  precision: PRECISION,
  bariatrique: given.cible("cible_ambulance_equipement_bariatrique").isOui(),
  aldLiee: given.fait("fait_ald_liee").isOui(),
  atmp: given.cible("cible_situation_at_mp").isOui(),
  camsp: given.cible("cible_dap_motif_camsp_cmpp").isOui(),
  mineur: given.cible("cible_mineur_ald_non_exonerante_reconnue").isOui(),
  etranger: given.cible("cible_issue_id").is("ISSUE_DAP_ETRANGER_A_EXAMINER"),
  maternite: given.cible("cible_dap_motif_engagement_maternite").isOui(),
  htnm: given.fait("fait_htnm_hors_maternite").isOui(),
});

export const TEXTE_MEDICAL: Rubrique<TexteMedical> = {
  elements_medicaux: ENTREES.compute(texteMedical),
  elements_medicaux_precision: PRECISION.compute((saisie) =>
    saisie === undefined ? undefined : `${saisie}.`,
  ),
};

// ---- implémentation ----

type Entrees = typeof ENTREES extends Value<infer Lues> ? Lues : never;

function texteMedical(entrees: Entrees): string | AucunSegment {
  const segments = [
    ...soin(entrees),
    ...besoins(entrees),
    ...complements(entrees),
  ]
    .map(forme)
    .map((segment) => segment.replace(VARIABLE, entrees.justification ?? ""));
  if (segments.length === 0) return undefined;
  const texte = segments
    .map((segment, rang) => (rang === 0 ? segment : enMinuscule(segment)))
    .join(" ; ");
  return entrees.precision === undefined ? `${texte}.` : texte;
}

// Les textes du contrat, tels qu'il les donne.
const CONTRAT = {
  allonge: "Position allongée ou semi-assise sur brancard nécessaire",
  brancard: "Brancardage ou portage nécessaire",
  surveillance:
    "Surveillance constante par une personne qualifiée avec matériel de secours",
  oxygene: "Administration d’oxygène nécessaire pendant le transport",
  asepsie: "Transport en conditions d’asepsie nécessaire",
  ald: "Soins en lien avec une ALD (Affection Longue Durée) reconnue",
  atmp: "Transport en lien avec un accident du travail ou une maladie professionnelle",
  bariatrique: "Équipement bariatrique adapté nécessaire",
  camsp:
    "Soins dans le cadre d’un parcours CAMSP (Centre d’Action Médico-Sociale Précoce) ou CMPP (Centre Médico-Psycho-Pédagogique)",
  examen:
    "Engagement maternité : examen obligatoire du 8ᵉ ou du 9ᵉ mois de grossesse",
  hebergement:
    "Engagement maternité : trajet lié à l’hébergement temporaire non médicalisé",
  htnm: "Trajet lié à un hébergement temporaire non médicalisé, hors dispositif Engagement maternité",
  distance:
    "Justification médicale du lieu de soins éloigné : [précision du prescripteur]",
  etranger: "Demande d’examen de la prise en charge du transport à l’étranger",
  mineur:
    "Mineur nécessitant des soins prolongés en raison d’un handicap, d’une incapacité ou d’un accident",
} as const;

// La saisie du prescripteur la remplace, sans prendre la forme des segments.
const VARIABLE = "[précision du prescripteur]";

type Besoin = keyof (typeof OPTIONS)["Q1.2"];

// Les critères d'ambulance prennent le texte court du contrat (D-142).
const CRITERES_D_AMBULANCE: Partial<Record<Besoin, string>> = {
  "7_ALLONGE": CONTRAT.allonge,
  "8_BRANCARDAGE": CONTRAT.brancard,
  "9_SURVEILLANCE": CONTRAT.surveillance,
  "10_OXYGENE": CONTRAT.oxygene,
  "11_ASEPSIE": CONTRAT.asepsie,
};

const SEANCES = ["3_CHIMIOTHERAPIE", "4_RADIOTHERAPIE", "5_DIALYSE"] as const;
const SANS_SOIN: readonly string[] = ["14_AUTRE", "15_AUCUN"];

// Le soin : Q2.1 si elle est posée, sinon les séances de Q1.3 (D-143).
function soin({ motif, seances }: Entrees): readonly string[] {
  const lu = motif.value;
  if (lu !== undefined)
    return SANS_SOIN.includes(lu) ? [] : [OPTIONS["Q2.1"][lu]];
  return SEANCES.filter((seance) => seances.checked(seance)).map(
    (seance) => OPTIONS["Q1.3"][seance],
  );
}

// Les besoins de Q1.2 dans leur ordre, puis le proche de Q1.1.
function besoins({ aides, accompagnement }: Entrees): readonly string[] {
  const cochees = (Object.keys(OPTIONS["Q1.2"]) as Besoin[])
    .filter((besoin) => aides.checked(besoin))
    .map((besoin) => CRITERES_D_AMBULANCE[besoin] ?? OPTIONS["Q1.2"][besoin]);
  const proche = accompagnement.is("2_AVEC_UN_PROCHE")
    ? [OPTIONS["Q1.1"]["2_AVEC_UN_PROCHE"]]
    : [];
  return [...cochees, ...proche];
}

// Les segments du contrat, chacun sur la cible ou le fait qui porte sa
// condition (D-147).
function complements(entrees: Entrees): readonly string[] {
  const { maternite, motifMaternite } = entrees;
  const segments = [
    [entrees.bariatrique, CONTRAT.bariatrique],
    [entrees.aldLiee, CONTRAT.ald],
    [entrees.atmp, CONTRAT.atmp],
    [entrees.camsp, CONTRAT.camsp],
    [entrees.mineur, CONTRAT.mineur],
    [entrees.etranger, CONTRAT.etranger],
    [entrees.justification !== undefined, CONTRAT.distance],
    [
      maternite &&
        motifMaternite.checked("1_EXAMEN_DU_HUITIEME_OU_NEUVIEME_MOIS"),
      CONTRAT.examen,
    ],
    [
      maternite && motifMaternite.checked("2_HEBERGEMENT_ENGAGEMENT"),
      CONTRAT.hebergement,
    ],
    [entrees.htnm, CONTRAT.htnm],
  ] as const;
  return segments.filter(([etabli]) => etabli).map(([, texte]) => texte);
}

// Une saisie telle quelle, ses espaces normalisés et son point final retiré.
function lueTelleQuelle({
  value,
}: {
  readonly value: string | undefined;
}): string | AucunSegment {
  const texte = value;
  const normale = texte?.replace(/\s+/g, " ").trim().replace(/\.$/, "");
  return normale ? normale : undefined;
}

// Le sigle sans sa définition, et sans point final (D-141).
function forme(texte: string): string {
  return texte.replace(/(\p{Lu}{2,}) \([^()]*\)/gu, "$1").replace(/\.$/, "");
}

// Sauf un sigle, et la mention du mineur, que le contrat veut littérale.
function enMinuscule(segment: string): string {
  if (segment === CONTRAT.mineur || /^\p{Lu}{2,}/u.test(segment))
    return segment;
  return segment.charAt(0).toLocaleLowerCase("fr") + segment.slice(1);
}
