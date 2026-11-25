// Le référentiel établissement / service : ce que le simulateur lui demande.

import type { RattachementSaisi } from "./rattachement-saisi.vo.ts";

export type Etablissement = { id: string; libelle: string };
export type Service = { id: string; libelle: string };

/**
 * Les ids du référentiel sous lesquels une saisie libre est enregistrée :
 * l'établissement, et le service créé ou réutilisé, jamais celui de l'entrée
 * « Autre ».
 */
export type RattachementEnregistre = { etabId: string; serviceId: string };

/**
 * L'accès au référentiel passe par cette interface. On peut ainsi
 * changer de source sans toucher aux composants. Le front utilise le client HTTP
 * `front/socle/rattachement/referentiel.adapter.ts`, vers le backend Grist.
 */
export interface Referentiel {
  listerEtablissements(): Promise<Etablissement[]>;
  listerServices(etabId: string): Promise<Service[]>;
  /**
   * Ajoute au référentiel ce que la saisie lui apprend : le service saisi sous
   * « Autre », ou l'établissement saisi et son service. Donne leurs ids, que le
   * parcours porte dès cette visite. Rejette une saisie qui n'apprend rien, ou
   * un établissement absent. Optionnel : une source en lecture seule n'écrit pas.
   */
  enrichirDepuisSaisie?(
    saisie: RattachementSaisi,
  ): Promise<RattachementEnregistre>;
}
