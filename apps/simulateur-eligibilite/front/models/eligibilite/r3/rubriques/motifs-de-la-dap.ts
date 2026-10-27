// Les motifs de l'accord préalable que la DAP coche (rubrique ①) : chaque
// fondement établi par les règles, et plusieurs ensemble s'ils le sont. Le
// transport à l'étranger à examiner n'en établit aucun : sa demande d'examen
// s'écrit dans le texte médical (#159). L'Engagement maternité suit sa cible,
// qui reste vide en pratique (D-129).

import { given } from "../../../../../core/models/eligibilite/question";
import type { Rubrique } from "./rubrique";

export type MotifsDeLaDap = {
  readonly longue_distance: boolean;
  readonly serie: boolean;
  readonly camsp_cmpp: boolean;
  readonly engagement_maternite: boolean;
  readonly avion_bateau: boolean;
};

export const MOTIFS_DE_LA_DAP: Rubrique<MotifsDeLaDap> = {
  longue_distance: given.cible("cible_dap_motif_longue_distance").isOui(),
  serie: given.cible("cible_dap_motif_serie").isOui(),
  camsp_cmpp: given.cible("cible_dap_motif_camsp_cmpp").isOui(),
  engagement_maternite: given
    .cible("cible_dap_motif_engagement_maternite")
    .isOui(),
  avion_bateau: given.cible("cible_dap_motif_avion_bateau").isOui(),
};
