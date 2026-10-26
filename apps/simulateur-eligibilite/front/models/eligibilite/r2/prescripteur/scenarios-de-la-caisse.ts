// Les raisons d'une issue que les règles laissent ouvertes pour la caisse, et
// le scénario de l'éditeur qui dit chacune (D-112).
//
// La trace ne porte qu'une raison, `cible_reason_code`, celle de la première.
// Les autres se relisent dans les cibles et les faits, aux conditions mêmes
// des règles : `cible_reason_code` les teste dans cet ordre, et
// `cible_point_cnam` regroupe les raisons propres à la caisse. Chaque raison
// déclare ce qu'elle lit de la trace (#196).

import type {
  IssuePrescripteur,
  ScenarioPrescripteur,
} from "../../../../../core/models/eligibilite/declarations/catalogue-resultats";
import type { Cibles } from "../../../../../core/models/eligibilite/declarations/cibles";
import type { Faits } from "../../../../../core/models/eligibilite/declarations/faits";
import { DeclaredReads } from "../../../../socle";
import type { CiblesLues, FaitsLus } from "../../lectures";
import type { Trace } from "../trace-du-resultat";

/**
 * Les scénarios des raisons ouvertes, dans l'ordre des règles. Si aucune ne se
 * relit, le seul scénario qui porte la raison des règles ; sinon aucun, et la
 * fiche n'a que son titre.
 */
export function scenariosDeLaCaisse(
  { scenarios }: IssuePrescripteur,
  trace: Trace,
): readonly ScenarioPrescripteur[] {
  const actifs = scenarios.filter(({ inactive }) => !inactive);
  const ouvertes = RAISONS.filter((raison) => raison.estOuverte(trace)).flatMap(
    ({ scenario }) => actifs.filter(({ id }) => id === scenario),
  );
  return ouvertes.length > 0 ? ouvertes : parSaRaison(actifs, trace);
}

/** Une raison ouverte pour la caisse : son scénario, ce qu'elle lit, sa condition. */
export type RaisonIssueCaisse = {
  readonly scenario: string;
  readonly lit: readonly (keyof Faits | keyof Cibles)[];
  readonly estOuverte: (trace: Trace) => boolean;
};

// Dans l'ordre de `cible_reason_code`. Les deux scénarios de
// AUTRE_DROIT_NON_VERIFIABLE se séparent comme `cible_couverture_inconnue_decisive`.
export const RAISONS: readonly RaisonIssueCaisse[] = [
  uneRaisonIssueCaisse("ald-base")
    .lit("cible_preuve_ald_inconnue_decisive")
    .ouverteSi(({ cibles }) =>
      cibles.cible_preuve_ald_inconnue_decisive.isOui(),
    ),
  uneRaisonIssueCaisse("mineur")
    .lit("cible_reconnaissance_mineur_inconnue_decisive")
    .ouverteSi(({ cibles }) =>
      cibles.cible_reconnaissance_mineur_inconnue_decisive.isOui(),
    ),
  uneRaisonIssueCaisse("appareillage")
    .lit("cible_convocation_inconnue_decisive")
    .ouverteSi(({ cibles }) =>
      cibles.cible_convocation_inconnue_decisive.isOui(),
    ),
  uneRaisonIssueCaisse("permission-inconnue")
    .lit(
      "cible_couverture_inconnue_decisive",
      "fait_permission",
      "fait_permission_mineur_admissible",
      "fait_permission_charge_patient",
    )
    .ouverteSi(
      ({ cibles, faits }) =>
        cibles.cible_couverture_inconnue_decisive.isOui() &&
        faits.fait_permission.isOui() &&
        faits.fait_permission_mineur_admissible.isInconnu() &&
        faits.fait_permission_charge_patient.isInconnu(),
    ),
  uneRaisonIssueCaisse("transfert-inconnu")
    .lit(
      "cible_couverture_inconnue_decisive",
      "fait_hospitalisation",
      "fait_transfert_article80",
    )
    .ouverteSi(
      ({ cibles, faits }) =>
        cibles.cible_couverture_inconnue_decisive.isOui() &&
        faits.fait_hospitalisation.isOui() &&
        faits.fait_transfert_article80.isInconnu(),
    ),
  uneRaisonIssueCaisse("samsah")
    .lit("fait_motif_samsah")
    .ouverteSi(({ faits }) => faits.fait_motif_samsah.isOui()),
  uneRaisonIssueCaisse("pension")
    .lit("fait_motif_pension")
    .ouverteSi(({ faits }) => faits.fait_motif_pension.isOui()),
  uneRaisonIssueCaisse("centre15")
    .lit("fait_centre15_interetablissements")
    .ouverteSi(({ faits }) => faits.fait_centre15_interetablissements.isOui()),
  uneRaisonIssueCaisse("htnm")
    .lit("fait_htnm_hors_maternite", "fait_htnm_segment_verifie")
    .ouverteSi(
      ({ faits }) =>
        faits.fait_htnm_hors_maternite.isOui() &&
        faits.fait_htnm_segment_verifie.isNon(),
    ),
  uneRaisonIssueCaisse("camsp-urgence")
    .lit("cible_dap_motif_camsp_cmpp", "fait_urgence_attestee")
    .ouverteSi(
      ({ cibles, faits }) =>
        cibles.cible_dap_motif_camsp_cmpp.isOui() &&
        faits.fait_urgence_attestee.isOui(),
    ),
  uneRaisonIssueCaisse("maternite-urgence")
    .lit("fait_dap_maternite", "fait_urgence_attestee")
    .ouverteSi(
      ({ faits }) =>
        faits.fait_dap_maternite.isOui() && faits.fait_urgence_attestee.isOui(),
    ),
];

// ---- implémentation ----

type LuesDeLaTrace<Lus> = {
  readonly faits: FaitsLus<Lus>;
  readonly cibles: CiblesLues<Lus>;
};

// Une raison, nommée par le scénario qui la dit.
function uneRaisonIssueCaisse(scenario: string) {
  return {
    lit: <const Lus extends readonly (keyof Faits | keyof Cibles)[]>(
      ...lus: Lus
    ) => ({
      ouverteSi: (
        condition: (lues: LuesDeLaTrace<Lus[number]>) => boolean,
      ): RaisonIssueCaisse => {
        const lecteur = new DeclaredReads(
          `La raison de la caisse « ${scenario} »`,
          lus,
        );
        return {
          scenario,
          lit: lecteur.reads,
          estOuverte: ({ faits, cibles }) =>
            condition({
              faits: lecteur.record(faits),
              cibles: lecteur.record(cibles),
            }),
        };
      },
    }),
  };
}

// Aucune raison que les conditions ont relue : le scénario de la raison des
// règles, s'il est le seul à la porter.
function parSaRaison(
  actifs: readonly ScenarioPrescripteur[],
  { cibles }: Trace,
): readonly ScenarioPrescripteur[] {
  const raison = cibles.cible_reason_code.value;
  const portent = actifs.filter(
    ({ codes }) => codes.length === 1 && codes[0] === raison,
  );
  return portent.length === 1 ? portent : [];
}
