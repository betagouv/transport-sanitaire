// Les points que les règles laissent ouverts pour la caisse, et le scénario
// de l'éditeur qui dit chacun (D-112).
//
// La trace ne porte qu'une raison, `cible_reason_code`, celle du premier point.
// Les autres se relisent dans les cibles et les faits, aux conditions mêmes
// des règles : `cible_reason_code` les teste dans cet ordre, et
// `cible_point_cnam` regroupe les points propres à la caisse. Ces conditions
// déclarent ce qu'elles lisent (`ce-que-lit-un-texte.ts`).

import type {
  IssuePrescripteur,
  ScenarioPrescripteur,
} from "../../../../../core/models/eligibilite/declarations/catalogue-resultats";
import { given } from "../../../../../core/models/eligibilite/question";
import { luPar, type TraceDe } from "../ce-que-lit-un-texte";

/** Ce que lisent les points ouverts pour la caisse. */
export const LU_PAR_LA_CAISSE = luPar({
  cibles: given.cibles(
    "cible_preuve_ald_inconnue_decisive",
    "cible_reconnaissance_mineur_inconnue_decisive",
    "cible_convocation_inconnue_decisive",
    "cible_couverture_inconnue_decisive",
    "cible_dap_motif_camsp_cmpp",
    "cible_reason_code",
  ),
  faits: given.faits(
    "fait_motif_samsah",
    "fait_motif_pension",
    "fait_centre15_interetablissements",
    "fait_permission",
    "fait_permission_mineur_admissible",
    "fait_permission_charge_patient",
    "fait_hospitalisation",
    "fait_transfert_article80",
    "fait_htnm_hors_maternite",
    "fait_htnm_segment_verifie",
    "fait_urgence_attestee",
    "fait_dap_maternite",
  ),
});

/**
 * Les scénarios des points ouverts, dans l'ordre des règles. Si aucun point
 * ne se relit, le seul scénario qui porte la raison des règles ; sinon aucun,
 * et la fiche n'a que son titre.
 */
export function scenariosDeLaCaisse(
  { scenarios }: IssuePrescripteur,
  trace: LuParLaCaisse,
): readonly ScenarioPrescripteur[] {
  const actifs = scenarios.filter(({ inactive }) => !inactive);
  const ouverts = RAISONS.filter(([, estOuverte]) => estOuverte(trace)).flatMap(
    ([id]) => actifs.filter((scenario) => scenario.id === id),
  );
  return ouverts.length > 0 ? ouverts : parSaRaison(actifs, trace);
}

// ---- implémentation ----

type LuParLaCaisse = TraceDe<typeof LU_PAR_LA_CAISSE>;

type RaisonIssueCaisse = readonly [
  scenario: string,
  estOuverte: (trace: LuParLaCaisse) => boolean,
];

// Dans l'ordre de `cible_reason_code`. Les deux scénarios de
// AUTRE_DROIT_NON_VERIFIABLE se séparent comme `cible_couverture_inconnue_decisive`.
const RAISONS: readonly RaisonIssueCaisse[] = [
  [
    "ald-base",
    ({ cibles }) => cibles.cible_preuve_ald_inconnue_decisive.isOui(),
  ],
  [
    "mineur",
    ({ cibles }) =>
      cibles.cible_reconnaissance_mineur_inconnue_decisive.isOui(),
  ],
  [
    "appareillage",
    ({ cibles }) => cibles.cible_convocation_inconnue_decisive.isOui(),
  ],
  ["permission-inconnue", permissionInconnue],
  ["transfert-inconnu", transfertInconnu],
  ["samsah", ({ faits }) => faits.fait_motif_samsah.isOui()],
  ["pension", ({ faits }) => faits.fait_motif_pension.isOui()],
  ["centre15", ({ faits }) => faits.fait_centre15_interetablissements.isOui()],
  ["htnm", hebergementNonMedicalise],
  ["camsp-urgence", camspEnUrgence],
  ["maternite-urgence", materniteEnUrgence],
];

function permissionInconnue({ cibles, faits }: LuParLaCaisse): boolean {
  return (
    cibles.cible_couverture_inconnue_decisive.isOui() &&
    faits.fait_permission.isOui() &&
    faits.fait_permission_mineur_admissible.isInconnu() &&
    faits.fait_permission_charge_patient.isInconnu()
  );
}

function transfertInconnu({ cibles, faits }: LuParLaCaisse): boolean {
  return (
    cibles.cible_couverture_inconnue_decisive.isOui() &&
    faits.fait_hospitalisation.isOui() &&
    faits.fait_transfert_article80.isInconnu()
  );
}

function hebergementNonMedicalise({ faits }: LuParLaCaisse): boolean {
  return (
    faits.fait_htnm_hors_maternite.isOui() &&
    faits.fait_htnm_segment_verifie.isNon()
  );
}

function camspEnUrgence({ cibles, faits }: LuParLaCaisse): boolean {
  return (
    cibles.cible_dap_motif_camsp_cmpp.isOui() &&
    faits.fait_urgence_attestee.isOui()
  );
}

function materniteEnUrgence({ faits }: LuParLaCaisse): boolean {
  return (
    faits.fait_dap_maternite.isOui() && faits.fait_urgence_attestee.isOui()
  );
}

// Un point que les conditions n'ont pas relu : le scénario de la raison des
// règles, s'il est le seul à la porter.
function parSaRaison(
  actifs: readonly ScenarioPrescripteur[],
  { cibles }: LuParLaCaisse,
): readonly ScenarioPrescripteur[] {
  const raison = cibles.cible_reason_code.value;
  const portent = actifs.filter(
    ({ codes }) => codes.length === 1 && codes[0] === raison,
  );
  return portent.length === 1 ? portent : [];
}
