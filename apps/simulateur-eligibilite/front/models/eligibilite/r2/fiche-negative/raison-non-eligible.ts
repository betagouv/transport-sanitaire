// La raison de la fiche patient négative (#134) : celle des textes de
// `ISSUE_NON_ELIGIBLE` que la trace prouve. Une fonction pure, sans React.
//
// Le catalogue de l'éditeur donne à chaque raison une `condition` en mots, une
// `priority` et la cible `reason` dont elle explique le code. La plus haute
// `priority` gagne ; `AUCUN_GENERIQUE` ne sert que de repli. Une raison
// inactive n'est jamais prise.
//
// Une condition n'est vraie que si la trace la PROUVE. Un fait ou une cible
// inconnus ne sont jamais « non » : ils se lisent par `isOui()` et `isNon()`,
// une précision par `=== true`, `=== false` ou sa présence. « Je ne peux pas préciser » (Q1.3.a) n'est jamais
// « Non ». Cinq raisons ne se prouvent par aucune de nos réponses (voir la
// table) : leur condition est codée, elle ne devient jamais vraie, et la
// raison n'est donc jamais choisie.
//
// Chaque condition déclare ce qu'elle lit de la trace (#196) :
// `uneRaisonNonEligible("AUCUN_IMAGERIE").lit("careFamily").prouveeSi(…)`.
// Le code de la raison (`codeDeLaRaison`) se lit hors de la table : il choisit
// les raisons candidates, il n'en prouve aucune.

import type { IssueNegative } from "../../../../../core/models/eligibilite/declarations/catalogue-resultats";
import type { Cibles } from "../../../../../core/models/eligibilite/declarations/cibles";
import type { Faits } from "../../../../../core/models/eligibilite/declarations/faits";
import type { Inconnu } from "../../../../../core/models/eligibilite/question";
import { DeclaredReads } from "../../../../socle";
import type { CiblesLues, FaitsLus } from "../../lectures";
import { PRECISIONS, type Prouvables } from "../precisions-du-resultat";
import type { Trace } from "../trace-du-resultat";

/** Une raison du catalogue : son texte, son code, sa priorité. */
export type RaisonNonEligible = IssueNegative["reasons"][number];

/** Un fait, une cible ou une précision : ce qu'une condition peut lire. */
type LisibleParUneRaison = keyof Faits | keyof Cibles | keyof Prouvables;

/** La condition d'une raison : ce qu'elle lit, et si la trace la prouve. */
export type ConditionDUneRaison = {
  readonly id: string;
  readonly lit: readonly LisibleParUneRaison[];
  readonly estProuvee: (trace: Trace) => boolean;
};

/** La raison de la fiche : la plus prioritaire que la trace prouve, ou le repli. */
export function raisonNonEligible(
  issue: IssueNegative,
  trace: Trace,
): RaisonNonEligible {
  const prouvee = issue.reasons
    .filter(
      ({ id, inactive, reason }) =>
        !inactive &&
        reason === codeDeLaRaison(trace) &&
        PAR_IDENTIFIANT.get(id)?.estProuvee(trace) === true,
    )
    .sort((a, b) => b.priority - a.priority)[0];
  return prouvee ?? repli(issue);
}

// La condition de chaque raison. Une raison qui n'y est pas (les trois
// inactives) n'est jamais prise.
//
// Jamais prouvées par nos réponses (arbitrages [ÉDITEUR], D-113) :
// AUCUN_ALD_SANS_LIEN, AUCUN_ALD_CADRE_NON_QUALIFIANT, AUCUN_SERIE_NON_QUALIFIANTE,
// AUCUN_AUTRE_DEPLACEMENT et TRANSPORT_EXCLU.
export const CONDITIONS: readonly ConditionDUneRaison[] = [
  // « ALD confirmée ; soin sans lien avec cette ALD prouvé ». Q1.3 option 2
  // dit le lien avec l'ALD : `aldRelated` n'est jamais « faux ».
  uneRaisonNonEligible("AUCUN_ALD_SANS_LIEN")
    .lit("aldRecognized", "aldRelated")
    .prouveeSi(
      ({ precisions }) =>
        aldConfirmee(precisions) && precisions.aldRelated === false,
    ),
  // « Lien établi ; Q1.1/Q1.2 prouve l'absence de déficience ». Avec Q1.3
  // option 2, `fait_ald_liee` ne vaut « non » que si Q1.1 dit « seul ».
  uneRaisonNonEligible("AUCUN_ALD_SANS_DEFICIENCE")
    .lit("aldRecognized", "aldRelated", "fait_ald_liee")
    .prouveeSi(
      ({ precisions, faits }) =>
        aldLiee(precisions) && faits.fait_ald_liee.isNon(),
    ),
  // « Réponse prouvée hors fondement 3°/4° ; exception mineur non applicable ».
  // Q1.3 option 2 dit le 100 % : le fondement n'est jamais prouvé « non ».
  uneRaisonNonEligible("AUCUN_ALD_CADRE_NON_QUALIFIANT")
    .lit(
      "aldRecognized",
      "aldRelated",
      "fait_ald_exonerante_3_ou_4",
      "fait_mineur_soins_prolonges_reconnus",
    )
    .prouveeSi(
      ({ precisions, faits }) =>
        aldLiee(precisions) &&
        faits.fait_ald_exonerante_3_ou_4.isNon() &&
        faits.fait_mineur_soins_prolonges_reconnus.isNon(),
    ),
  uneRaisonNonEligible("AUCUN_DIALYSE_NON_HEMO")
    .lit("dialysisType", "sejourReel")
    .prouveeSi(
      ({ precisions }) =>
        precisions.dialysisType === "non-hemodialyse" && sansSejour(precisions),
    ),
  uneRaisonNonEligible("AUCUN_DIALYSE_TYPE_INCONNU")
    .lit("dialysisType", "sejourReel")
    .prouveeSi(
      ({ precisions }) =>
        precisions.dialysisType === "inconnu" && sansSejour(precisions),
    ),
  uneRaisonNonEligible("AUCUN_APPAREILLAGE_HORS_CATEGORIES")
    .lit("deviceCategory")
    .prouveeSi(
      ({ precisions }) => precisions.deviceCategory === "hors-categories",
    ),
  // « Transports répétés effectivement prévus, mais série Q2.3.3 non
  // qualifiante prouvée ». Seul Q2.3.3 « Oui » prouve des transports répétés,
  // et il qualifie la série : les deux ne vont jamais ensemble.
  uneRaisonNonEligible("AUCUN_SERIE_NON_QUALIFIANTE")
    .lit("repeatedTripsPlanned", "fait_serie_qualifiante")
    .prouveeSi(
      ({ precisions, faits }) =>
        precisions.repeatedTripsPlanned === true &&
        faits.fait_serie_qualifiante.isNon(),
    ),
  familleDeSoin("AUCUN_CONSULTATION", 1),
  familleDeSoin("AUCUN_SOINS_DENTAIRES_SAGE_FEMME", 2),
  familleDeSoin("AUCUN_IMAGERIE", 3),
  familleDeSoin("AUCUN_BIOLOGIE", 4),
  familleDeSoin("AUCUN_PARAMEDICAL", 5),
  familleDeSoin("AUCUN_PSYCHOLOGUE", 7),
  familleDeSoin("AUCUN_AUTRE_SOIN", 14),
  // « Q2.1 = 15 prouvé et finalité clarifiée ». Aucune question ne clarifie la
  // finalité : `eventFinalityClarified` n'est jamais là.
  uneRaisonNonEligible("AUCUN_AUTRE_DEPLACEMENT")
    .lit("careFamily", "eventFinalityClarified")
    .prouveeSi(
      ({ precisions }) =>
        precisions.careFamily === 15 &&
        precisions.eventFinalityClarified === true,
    ),
  // « fait_exclusion_transport_prouvee = oui + règle officielle datée
  // conservée en preuve ». Notre fait vaut toujours « non » (D-111).
  uneRaisonNonEligible("TRANSPORT_EXCLU")
    .lit("fait_exclusion_transport_prouvee", "transportExclusionRule")
    .prouveeSi(
      ({ precisions, faits }) =>
        faits.fait_exclusion_transport_prouvee.isOui() &&
        precisions.transportExclusionRule !== undefined,
    ),
];

// ---- implémentation ----

const REPLI = "AUCUN_GENERIQUE";

// Le code de raison des règles. Avec nos réponses, il reste indéfini : sa
// première branche lit `cible_care_status`, que trois faits sans question
// (`fait_exclusion_soin_prouvee`, `fait_prestation_non_couverte_declaree`,
// `fait_preuve_prestation_absente`) laissent indéfini. Ce n'est pas un « non » :
// nous ne les posons pas. Une non-éligibilité sans motif de transport
// (`cible_motif_transport` à « non », la condition même de la règle) vaut alors
// `AUCUN_MOTIF_TRANSPORT`, comme dans la trace de l'éditeur.
function codeDeLaRaison({ cibles }: Trace): string | Inconnu {
  const code = cibles.cible_reason_code.value;
  if (code != null) return code;
  const sansMotif =
    cibles.cible_issue_id.is("ISSUE_NON_ELIGIBLE") &&
    cibles.cible_motif_transport.isNon();
  return sansMotif ? "AUCUN_MOTIF_TRANSPORT" : undefined;
}

function repli(issue: IssueNegative): RaisonNonEligible {
  const raison = issue.reasons.find(({ id }) => id === REPLI);
  if (!raison) throw new Error(`Le catalogue n'a pas la raison ${REPLI}.`);
  return raison;
}

// Ce que reçoit une condition qui déclare lire `Lus`.
type Lues<Lus extends LisibleParUneRaison> = {
  readonly faits: FaitsLus<Lus>;
  readonly cibles: CiblesLues<Lus>;
  readonly precisions: Pick<Prouvables, Extract<Lus, keyof Prouvables>>;
};

// Une condition, nommée par sa raison pour les erreurs de lecture.
function uneRaisonNonEligible(id: string) {
  return {
    lit: <const Lus extends readonly LisibleParUneRaison[]>(...lus: Lus) => ({
      prouveeSi: (
        condition: (lues: Lues<Lus[number]>) => boolean,
      ): ConditionDUneRaison => {
        const lecteur = new DeclaredReads(`La raison non éligible ${id}`, lus);
        return {
          id,
          lit: lecteur.reads,
          estProuvee: (trace) => condition(lues(lecteur, trace)),
        };
      },
    }),
  };
}

// Les précisions et le séjour réel : tous se gardent, même absents.
const PROUVABLES = [...Object.keys(PRECISIONS), "sejourReel"];

function lues<Lus extends LisibleParUneRaison>(
  lecteur: DeclaredReads<Lus>,
  { faits, cibles, precisions, sejourReel }: Trace,
): Lues<Lus> {
  return {
    faits: lecteur.record(faits),
    cibles: lecteur.record(cibles),
    precisions: lecteur.record({ ...precisions, sejourReel }, PROUVABLES),
  };
}

// « Aucun autre motif » n'est lu nulle part ici : `cible_reason_code` vaut
// `AUCUN_MOTIF_TRANSPORT` seulement quand les règles n'ont trouvé aucun motif.
function familleDeSoin(id: string, numero: number): ConditionDUneRaison {
  return uneRaisonNonEligible(id)
    .lit("careFamily")
    .prouveeSi(({ precisions }) => precisions.careFamily === numero);
}

// Un séjour réel est prouvé : le texte de la dialyse ne dirait plus le vrai.
function sansSejour(precisions: Pick<Prouvables, "sejourReel">): boolean {
  return precisions.sejourReel !== true;
}

function aldConfirmee(precisions: Pick<Prouvables, "aldRecognized">): boolean {
  return precisions.aldRecognized === true;
}

function aldLiee(
  precisions: Pick<Prouvables, "aldRecognized" | "aldRelated">,
): boolean {
  return aldConfirmee(precisions) && precisions.aldRelated === true;
}

const PAR_IDENTIFIANT = new Map(CONDITIONS.map((c) => [c.id, c]));
