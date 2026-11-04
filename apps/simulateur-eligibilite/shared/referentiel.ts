// Le référentiel établissement / service : son interface, et des données
// factices pour le développement et les tests.

import type { RattachementSaisi } from "./rattachement-saisi.ts";

export type Etablissement = { id: string; libelle: string };
export type Service = { id: string; libelle: string };

/**
 * L'accès au référentiel passe par cette interface (§5 de
 * docs/knowledge/adr/identification.md). On peut ainsi changer de source sans
 * toucher aux composants. Le front utilise le client HTTP
 * `front/socle/rattachement/referentiel.ts`, vers le backend Grist.
 */
export interface Referentiel {
  listerEtablissements(): Promise<Etablissement[]>;
  listerServices(etabId: string): Promise<Service[]>;
  /**
   * Ajoute au référentiel ce que la saisie lui apprend : le service saisi sous
   * « Autre », ou l'établissement saisi et son service. Optionnel : seule la
   * source Grist l'implémente, le client HTTP du front n'écrit jamais. Voir
   * docs/knowledge/domain/enrichissement-referentiel-rattachement.md.
   */
  enrichirDepuisSaisie?(saisie: RattachementSaisi): Promise<void>;
}

/**
 * Données factices, sans donnée personnelle. Défaut en dev et dans les tests,
 * au front comme au backend, quand il n'y a pas de clé Grist.
 */
export const snapshotReferentiel: Referentiel = {
  async listerEtablissements() {
    return ETABLISSEMENTS;
  },
  async listerServices(etabId) {
    return SERVICES.filter((service) => service.etabId === etabId).map(
      ({ id, libelle }) => ({ id, libelle }),
    );
  },
};

// ---- implémentation ----

type SnapshotService = Service & { etabId: string };

const ETABLISSEMENTS: Etablissement[] = [
  { id: "e_chu_grenoble", libelle: "CHU Grenoble Alpes" },
  { id: "e_ch_chambery", libelle: "Centre hospitalier de Chambéry" },
  { id: "e_clinique_belledonne", libelle: "Clinique Belledonne" },
  // L'établissement fourre-tout : ses services sont les structures, que l'écran
  // propose à plat sous les établissements (« Libéral », « Assurance Maladie »,
  // « Autre »). Lui-même ne s'affiche pas. Voir
  // front/socle/rattachement/structures.ts.
  { id: "e_liberal_cnam", libelle: "Libéral / CNAM / CPAM / Autre" },
  // L'établissement du produit : il porte le service qui déverrouille les
  // developer tools.
  { id: "e_transport_sanitaire", libelle: "Transport Sanitaire" },
];

// Chaque établissement a une entrée « Autre » (service non listé). C'est un
// service du référentiel comme les autres.
const SERVICES: SnapshotService[] = [
  { id: "s_grenoble_cardio", etabId: "e_chu_grenoble", libelle: "Cardiologie" },
  {
    id: "s_grenoble_dialyse",
    etabId: "e_chu_grenoble",
    libelle: "Néphrologie — dialyse",
  },
  { id: "s_grenoble_onco", etabId: "e_chu_grenoble", libelle: "Oncologie" },
  { id: "s_grenoble_autre", etabId: "e_chu_grenoble", libelle: "Autre" },
  { id: "s_chambery_urgences", etabId: "e_ch_chambery", libelle: "Urgences" },
  {
    id: "s_chambery_medecine",
    etabId: "e_ch_chambery",
    libelle: "Médecine interne",
  },
  { id: "s_chambery_autre", etabId: "e_ch_chambery", libelle: "Autre" },
  {
    id: "s_belledonne_chirurgie",
    etabId: "e_clinique_belledonne",
    libelle: "Chirurgie ambulatoire",
  },
  {
    id: "s_belledonne_autre",
    etabId: "e_clinique_belledonne",
    libelle: "Autre",
  },
  // Les structures. Leur « Autre » ouvre le simulateur sans rien demander.
  { id: "s_liberal", etabId: "e_liberal_cnam", libelle: "Libéral" },
  {
    id: "s_assurance_maladie",
    etabId: "e_liberal_cnam",
    libelle: "Assurance Maladie",
  },
  { id: "s_liberal_autre", etabId: "e_liberal_cnam", libelle: "Autre" },
  // Le service du produit : il déverrouille les developer tools. C'est le
  // service Grist `Id2 = 4` en production (voir front/socle/developer-tools/unlock.ts).
  {
    id: "s_transport_sanitaire",
    etabId: "e_transport_sanitaire",
    libelle: "Transport Sanitaire",
  },
  {
    id: "s_transport_sanitaire_autre",
    etabId: "e_transport_sanitaire",
    libelle: "Autre",
  },
];
