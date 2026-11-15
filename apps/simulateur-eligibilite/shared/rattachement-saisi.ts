// Ce que le formulaire de rattachement collecte, et quand il est complet.
// Ce sont des identifiants du référentiel Grist, ou des noms saisis quand le
// référentiel ne les a pas encore.
// Voir docs/knowledge/adr/identification.md, ADR-4.

// Trois cas (§4 de docs/knowledge/adr/identification.md) :
// - un service du référentiel, sous un établissement du référentiel. Les
//   structures (« Libéral », « Assurance Maladie », « Autre ») sont les
//   services de l'établissement fourre-tout ;
// - le service « Autre » d'un établissement du référentiel, avec le nom du
//   vrai service saisi ;
// - un établissement absent de la liste, saisi avec son service.
export type RattachementSaisi = {
  /** id établissement du référentiel. Vide quand l'établissement est saisi. */
  etabId: string;
  /** id service du référentiel (« Autre » compris). */
  serviceId?: string;
  /**
   * Vrai quand le service sélectionné est l'entrée « Autre ». Le front le
   * renseigne, car lui seul connaît le libellé. La complétude peut ainsi exiger
   * `serviceLibre` sans relire Grist.
   */
  serviceEstAutre?: boolean;
  /**
   * Le vrai service ou unité, obligatoire quand `serviceEstAutre` ou
   * `etabEstAutre` est vrai. Le backend le crée ou le réutilise. Il est listé
   * sous son nom à la visite suivante.
   */
  serviceLibre?: string;
  /** Vrai quand l'établissement n'est pas dans la liste : il est saisi. */
  etabEstAutre?: boolean;
  /**
   * Le nom de l'établissement saisi, obligatoire quand `etabEstAutre` est
   * vrai. Le backend le crée ou le réutilise, et son service sous lui.
   */
  etabLibre?: string;
};

/**
 * Normalise un texte libre : casse et espaces superflus. Deux saisies presque
 * identiques désignent ainsi la même chose. Sert à dédupliquer les services
 * écrits dans Grist et à reconnaître l'établissement fourre-tout.
 */
export const normalise = (s: string): string =>
  s.trim().replace(/\s+/g, " ").toLowerCase();

/**
 * Vrai quand la saisie est complète. Le front s'en sert pour activer le bouton
 * de validation ou entrer dès la sélection, le backend pour valider
 * `POST /api/rattachement`.
 */
export function saisieComplete(saisie: RattachementSaisi): boolean {
  // établissement saisi → son nom et celui du service, rien d'autre
  if (saisie.etabEstAutre) {
    return rempli(saisie.etabLibre) && rempli(saisie.serviceLibre);
  }
  if (!rempli(saisie.etabId)) return false;

  // établissement → service requis
  if (!rempli(saisie.serviceId)) return false;
  // service « Autre » → saisie du service/unité réel obligatoire
  if (saisie.serviceEstAutre && !rempli(saisie.serviceLibre)) return false;
  return true;
}

/**
 * La longueur d'un nom saisi. Le champ ne va pas au-delà, et le backend refuse
 * un nom plus long : il ne s'écrit pas dans le référentiel (#451).
 */
export const LONGUEUR_MAX_D_UN_NOM = 150;

/** Vrai quand aucun nom saisi ne dépasse `LONGUEUR_MAX_D_UN_NOM`. */
export function nomsDansLaLimite(saisie: RattachementSaisi): boolean {
  return [saisie.etabLibre, saisie.serviceLibre].every(
    (nom) => (nom ?? "").length <= LONGUEUR_MAX_D_UN_NOM,
  );
}

/**
 * Vrai quand la saisie apprend quelque chose au référentiel : un service ou un
 * établissement saisi. Le front ne déclare que celles-là au serveur.
 */
export function enrichitLeReferentiel(saisie: RattachementSaisi): boolean {
  return saisie.serviceEstAutre === true || saisie.etabEstAutre === true;
}

// ---- implémentation ----

function rempli(v: string | undefined): boolean {
  return (v ?? "").trim() !== "";
}
