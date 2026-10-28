// Ce que R2 et R3 lisent : les questions telles quelles, hors des faits et des
// cibles (#254), puis les cibles et les faits (#260). Une telle question se
// pose toujours : sa réponse s'affiche, même quand aucun fait ne la lit. Rien
// ne se déroule : R2 ne lit que `LU_PAR_R2`, union de ce que ses textes
// déclarent, et R3 que son texte, son titre, son bouton, le choix de son
// document et les entrées de ses cerfas.

import { describe, expect, it } from "vitest";
import {
  NOTHING,
  type Reads,
  readsOf,
} from "../../../core/socle/questionnaire-engine/condition";
import { model } from "../../../front/models/eligibilite";
import { S3138G } from "../../../front/models/eligibilite/r3/s3138g/s3138g";
import { S3139H } from "../../../front/models/eligibilite/r3/s3139h/s3139h";
import { S3141 } from "../../../front/models/eligibilite/r3/s3141/s3141";
import type { BoundCerfa } from "../../../front/socle/cerfa-mapping";

describe("les questions que les résultats lisent telles quelles", () => {
  // Le circuit (Q2.2.1.indication), les critères de Q1.2, la répétition de
  // Q2.8.5, et ce dont la trace tire ses précisions.
  it("R2 lit le circuit, les critères, la répétition et les précisions", () => {
    expect(trie(model.result.reading.reads)).toEqual([
      "Q1.2",
      "Q1.3",
      "Q1.3.a",
      "Q2.1",
      "Q2.1.f",
      "Q2.1.g",
      "Q2.10",
      "Q2.10.b",
      "Q2.2.1",
      "Q2.2.1.b",
      "Q2.2.1.indication",
      "Q2.3.3",
      "Q2.5",
      "Q2.6.a",
      "Q2.7",
      "Q2.8.5",
    ]);
  });

  it("R3 lit son texte et les entrées de ses trois cerfas", () => {
    expect(trie(luParR3())).toEqual([
      "Q1.1",
      "Q1.2",
      "Q1.3",
      "Q2.1",
      "Q2.1.g",
      "Q2.13.depart",
      "Q2.14.motif",
      "Q2.2.1",
      "Q2.2.1.a",
      "Q2.2.1.b",
      "Q2.5",
      "Q2.6",
      "Q2.8.1",
      "Q2.8.5",
      "Q2.8.6",
      "Q3.1.1",
      "Q3.1.2",
      "Q3.1.3",
      "Q3.2.adresse",
      "Q3.2.nature",
      "Q3.2.nom",
      "Q3.2.precision",
      "Q3.3.adresse",
      "Q3.3.nature",
      "Q3.3.nom",
      "Q3.3.precision",
      "Q3.4",
      "Q3.4.distance",
      "Q3.5",
      "Q3.6.1",
      "Q3.6.2",
      "Q3.6.3",
      "Q3.7",
    ]);
  });
});

describe("les cibles et les faits que les résultats lisent", () => {
  // Le circuit et l'issue, puis ce que lisent les deux fiches et le
  // prescripteur.
  it("R2 lit ce que ses textes déclarent", () => {
    const { cibles, faits } = model.result.reading.reads;
    expect([...cibles].sort()).toEqual([
      "cible_ald_juridiquement_qualifiante_3_ou_4_degres",
      "cible_ambulance_equipement_bariatrique",
      "cible_attente_accord",
      "cible_convocation_inconnue_decisive",
      "cible_couverture_inconnue_decisive",
      "cible_dap_motif_avion_bateau",
      "cible_dap_motif_camsp_cmpp",
      "cible_dap_motif_engagement_maternite",
      "cible_dap_motif_longue_distance",
      "cible_dap_motif_serie",
      "cible_fauteuil_roulant",
      "cible_hospitalisation_ou_seances_assimilees",
      "cible_issue_id",
      "cible_mineur_ald_non_exonerante_reconnue",
      "cible_mode_ambulance",
      "cible_mode_id",
      "cible_mode_individual",
      "cible_mode_public",
      "cible_motif_transport",
      "cible_personne_accompagnante",
      "cible_preuve_ald_inconnue_decisive",
      "cible_reason_code",
      "cible_reconnaissance_mineur_inconnue_decisive",
      "cible_situation_at_mp",
      "cible_transport_partage_incompatible",
    ]);
    expect([...faits].sort()).toEqual([
      "fait_ald_exonerante_3_ou_4",
      "fait_ald_liee",
      "fait_avion_bateau_ligne",
      "fait_centre15_interetablissements",
      "fait_convocation",
      "fait_dap_maternite",
      "fait_exclusion_transport_prouvee",
      "fait_hospitalisation",
      "fait_htnm_hors_maternite",
      "fait_htnm_segment_verifie",
      "fait_mineur_soins_prolonges_reconnus",
      "fait_motif_pension",
      "fait_motif_samsah",
      "fait_permission",
      "fait_permission_charge_patient",
      "fait_permission_mineur_admissible",
      "fait_serie_qualifiante",
      "fait_transfert_article80",
      "fait_urgence_attestee",
    ]);
  });

  // Le titre et le bouton lisent l'issue, le choix du document son support,
  // et les cases des cerfas le reste.
  it("R3 lit l'issue, le support et ce que cochent ses cerfas", () => {
    const { cibles, faits } = luParR3();
    expect([...cibles].sort()).toEqual([
      "cible_ald_juridiquement_qualifiante_3_ou_4_degres",
      "cible_ambulance_brancardage_portage",
      "cible_ambulance_equipement_bariatrique",
      "cible_ambulance_isolement_asepsie",
      "cible_ambulance_oxygene",
      "cible_ambulance_position_allongee_demi_assise",
      "cible_ambulance_surveillance_constante",
      "cible_centre_reference_destination_reelle",
      "cible_dap_motif_avion_bateau",
      "cible_dap_motif_camsp_cmpp",
      "cible_dap_motif_engagement_maternite",
      "cible_dap_motif_longue_distance",
      "cible_dap_motif_serie",
      "cible_fauteuil_roulant",
      "cible_hospitalisation_ou_seances_assimilees",
      "cible_issue_id",
      "cible_mineur_ald_non_exonerante_reconnue",
      "cible_mode_individual",
      "cible_mode_public",
      "cible_mode_tap_ou_tpmr",
      "cible_personne_accompagnante",
      "cible_situation_at_mp",
      "cible_situation_pension_militaire",
      "cible_support_id",
      "cible_transport_partage_incompatible",
      "cible_urgence_appel15",
      "cible_urgence_autre",
    ]);
    expect([...faits].sort()).toEqual([
      "fait_ald_liee",
      "fait_htnm_hors_maternite",
    ]);
  });
});

// ---- implémentation ----

function luParR3(): Reads {
  const { reading, form, title, startLabel } = model.cerfa;
  return [S3138G, S3139H, S3141]
    .map(entrees)
    .concat([form, title, startLabel].map((value) => value.reads))
    .reduce(readsOf, reading.reads);
}

function entrees({ mapping }: BoundCerfa): Reads {
  return [...Object.values(mapping.fields), ...Object.values(mapping.drawings)]
    .map((value) => value.reads)
    .reduce(readsOf, NOTHING);
}

function trie(lu: Reads): string[] {
  return [...lu.questions].sort();
}
