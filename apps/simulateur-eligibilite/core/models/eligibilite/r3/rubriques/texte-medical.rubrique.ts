// Le texte médical de la PMT (page 3) et de la DAP (page 2) : les segments que
// le parcours établit, dans l'ordre de `COMPLETION_DOCUMENTS.md`, joints par
// « ; » (`CONTRAT_ELEMENTS_MEDICAUX.json`). Rien n'y vient de
// l'autonomie, des critères de Q1.2, du mode, de l'accompagnement ni de son
// équipement : les cases du mode le disent (DOC-COMMENTAIRES-MEDICAUX-20261104).
//
// Un segment reprend le libellé d'une réponse, ou le texte du contrat. Il perd
// la définition de ses sigles et son point final, et sa majuscule s'il ne
// commence pas le texte. La mention du mineur reste littérale. Le point final
// va à la fin du tout. Aucune précision libre ne s'y ajoute : la cellule est
// un seul texte, que le prescripteur réécrit en R3 s'il veut la préciser, ou
// s'il ne tient pas.

import type {
  AddressData,
  Reading,
  Unanswered,
} from "../../../../socle/index.ts";
import { Q1_3 } from "../../questions/p1/questions/q1-3.question.ts";
import { Q2_1 } from "../../questions/p2/questions/q2-1.question.ts";
import { given } from "../../questions/reponses.ts";
import { LieuxDuCerfa } from "./lieux-du-cerfa.service.ts";
import type { Rubrique } from "./rubrique.types.ts";

/** Rien n'est établi, ou rien n'est saisi : la cellule reste vide. */
type AucunSegment = undefined;

export type TexteMedical = {
  readonly elements_medicaux: string | AucunSegment;
};

// La maternité de l'Engagement maternité, son niveau, et l'hébergement du
// dispositif s'il n'est pas un lieu du trajet (Q3.8). Le lieu du trajet
// s'écrit déjà dans sa rubrique.
const MATERNITE = given
  .all({
    nom: given.question("Q3.8.maternite.nom").answer().compute(lueTelleQuelle),
    adresse: given.question("Q3.8.maternite.adresse").answer(),
    niveau: given.question("Q3.8.niveau").answer(),
    nomHebergement: given
      .question("Q3.8.hebergement.nom")
      .answer()
      .compute(lueTelleQuelle),
    adresseHebergement: given.question("Q3.8.hebergement.adresse").answer(),
  })
  .compute(coordonneesDeLaMaternite);

// Ce que lit le texte : les réponses du soin, et les cibles et
// les faits qui portent la condition des segments du contrat.
const ENTREES = given.all({
  motif: given.question("Q2.1").answer(),
  seances: given.question("Q1.3").answer(),
  examen: given.question("Q2.2.1").answer().checked("14_EXAMEN_MATERNITE"),
  hebergement: given
    .question("Q2.14.motif")
    .answer()
    .checked("2_HEBERGEMENT_ENGAGEMENT"),
  justification: given
    .question("Q3.4.distance")
    .answer()
    .compute(lueTelleQuelle),
  aldLiee: given.fait("fait_ald_liee").isOui(),
  atmp: given.cible("cible_situation_at_mp").isOui(),
  camsp: given.cible("cible_dap_motif_camsp_cmpp").isOui(),
  mineur: given.cible("cible_mineur_ald_non_exonerante_reconnue").isOui(),
  etranger: given.cible("cible_issue_id").is("ISSUE_DAP_ETRANGER_A_EXAMINER"),
  maternite: given.cible("cible_dap_motif_engagement_maternite").isOui(),
  htnm: given.fait("fait_htnm_hors_maternite").isOui(),
  coordonnees: MATERNITE,
});

export const TEXTE_MEDICAL: Rubrique<TexteMedical> = {
  elements_medicaux: ENTREES.compute(texteMedical),
};

// ---- implémentation ----

type Entrees = typeof ENTREES extends Reading<infer Lues> ? Lues : never;

function texteMedical(entrees: Entrees): string | AucunSegment {
  const segments = [...soin(entrees), ...complements(entrees)]
    .map(forme)
    .map((segment) => segment.replace(VARIABLE, entrees.justification ?? ""));
  const texte = segments
    .map((segment, rang) => (rang === 0 ? segment : enMinuscule(segment)))
    .join(" ; ");
  return texte === "" ? undefined : `${texte}.`;
}

// Les textes du contrat, tels qu'il les donne.
const CONTRAT = {
  ald: "Soins en lien avec une ALD (Affection Longue Durée) reconnue",
  atmp: "Transport en lien avec un accident du travail ou une maladie professionnelle",
  camsp:
    "Soins dans le cadre d’un parcours CAMSP (Centre d’Action Médico-Sociale Précoce) ou CMPP (Centre Médico-Psycho-Pédagogique)",
  examen:
    "Engagement maternité : examen obligatoire du 8ᵉ ou du 9ᵉ mois de grossesse",
  hebergement:
    "Engagement maternité : trajet lié à l’hébergement temporaire non médicalisé",
  maternite: "Maternité : ",
  niveau: "Niveau de maternité requis : type ",
  lieuHebergement: "Hébergement temporaire non médicalisé : ",
  htnm: "Trajet lié à un hébergement temporaire non médicalisé, hors dispositif Engagement maternité",
  distance:
    "Justification médicale du lieu de soins éloigné : [précision du prescripteur]",
  etranger: "Demande d’examen de la prise en charge du transport à l’étranger",
  mineur:
    "Mineur nécessitant des soins prolongés en raison d’un handicap, d’une incapacité ou d’un accident",
} as const;

// La saisie du prescripteur la remplace, sans prendre la forme des segments.
const VARIABLE = "[précision du prescripteur]";

const SEANCES = ["3_CHIMIOTHERAPIE", "4_RADIOTHERAPIE", "5_DIALYSE"] as const;
// L'autre motif ne dit aucun soin (QST-Q21-AUTRE-MOTIF).
const SANS_SOIN: readonly string[] = ["14_AUTRE"];

// Le soin : Q2.1 si elle est posée, sinon les séances de Q1.3.
function soin({ motif, seances }: Entrees): readonly string[] {
  const lu = motif.value;
  if (lu !== undefined) return SANS_SOIN.includes(lu) ? [] : [Q2_1.labels[lu]];
  return SEANCES.filter((seance) => seances.checked(seance)).map(
    (seance) => Q1_3.labels[seance],
  );
}

// Les segments du contrat, chacun sur la cible ou le fait qui porte sa
// condition. Ce que Q3.8 recueille suit le motif de l'Engagement
// maternité, avant l'HTNM. L'examen se coche en Q2.2.1, l'hébergement du
// dispositif se dit en Q2.14.
function complements(entrees: Entrees): readonly string[] {
  return [
    ...etablis([
      [entrees.aldLiee, CONTRAT.ald],
      [entrees.atmp, CONTRAT.atmp],
      [entrees.camsp, CONTRAT.camsp],
      [entrees.mineur, CONTRAT.mineur],
      [entrees.etranger, CONTRAT.etranger],
      [entrees.justification !== undefined, CONTRAT.distance],
    ]),
    ...engagementMaternite(entrees),
    ...etablis([[entrees.htnm, CONTRAT.htnm]]),
  ];
}

function engagementMaternite(entrees: Entrees): readonly string[] {
  const { maternite, examen, hebergement } = entrees;
  if (!maternite) return [];
  return [
    ...etablis([
      [examen, CONTRAT.examen],
      [hebergement, CONTRAT.hebergement],
    ]),
    ...entrees.coordonnees,
  ];
}

function etablis(
  segments: readonly (readonly [boolean, string])[],
): readonly string[] {
  return segments.filter(([etabli]) => etabli).map(([, texte]) => texte);
}

type Coordonnees = {
  readonly nom: string | undefined;
  readonly adresse: { readonly value: AddressData | Unanswered };
  readonly niveau: { readonly value: keyof typeof TYPES | Unanswered };
  readonly nomHebergement: string | undefined;
  readonly adresseHebergement: { readonly value: AddressData | Unanswered };
};

// Le niveau tel que le contrat l'écrit, après « type ».
const TYPES = {
  "1_TYPE_I": "I",
  "2_TYPE_IIA": "IIA",
  "3_TYPE_IIB": "IIB",
  "4_TYPE_III": "III",
} as const;

function coordonneesDeLaMaternite(lues: Coordonnees): readonly string[] {
  const niveau = lues.niveau.value;
  return [
    lieu(CONTRAT.maternite, lues.nom, lues.adresse.value),
    niveau && `${CONTRAT.niveau}${TYPES[niveau]}`,
    lieu(
      CONTRAT.lieuHebergement,
      lues.nomHebergement,
      lues.adresseHebergement.value,
    ),
  ].filter((segment): segment is string => Boolean(segment));
}

// Un lieu à reporter : son nom, puis son adresse sur une ligne.
function lieu(
  intitule: string,
  nom: string | undefined,
  adresse: AddressData | Unanswered,
): string | AucunSegment {
  const parties = LieuxDuCerfa.adresseEnParties(adresse);
  if (nom === undefined || parties.length === 0) return undefined;
  return `${intitule}${nom} — ${parties.join(", ")}`;
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

// Le sigle sans sa définition, et sans point final. Le contrat met le
// sigle d'abord, « ALD (Affection Longue Durée) » ; les libellés le mettent
// après, « Affection Longue Durée (ALD) ». Une définition est une suite
// de mots à majuscule, que peuvent lier « à », « de », « d’ »…
const SIGLE_PUIS_DEFINITION = /(\p{Lu}{2,}) \([^()]*\)/gu;
const DEFINITION_PUIS_SIGLE =
  /\p{Lu}[\p{L}-]*(?: (?:(?:à|de|des|du|la|le|et) )?(?:d’)?\p{Lu}[\p{L}-]*)* \((\p{Lu}{2,})\)/gu;

function forme(texte: string): string {
  return texte
    .replace(SIGLE_PUIS_DEFINITION, "$1")
    .replace(DEFINITION_PUIS_SIGLE, "$1")
    .replace(/\.$/, "");
}

// Sauf un sigle, et la mention du mineur, que le contrat veut littérale.
function enMinuscule(segment: string): string {
  if (segment === CONTRAT.mineur || /^\p{Lu}{2,}/u.test(segment))
    return segment;
  return segment.charAt(0).toLocaleLowerCase("fr") + segment.slice(1);
}
