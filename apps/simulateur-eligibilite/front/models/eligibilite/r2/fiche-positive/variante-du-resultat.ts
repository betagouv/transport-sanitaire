// La variante d'une fiche patient positive (#135) : la portée du trajet, le
// libellé sous lequel le catalogue de l'éditeur range le titre et le modus, et
// le rang du titre du prescripteur. Des fonctions pures de la trace, sans React.
// Chacune déclare ce qu'elle en lit (`ce-que-lit-un-texte.ts`).
//
// Les libellés sont ceux de `titles` dans le catalogue. Chaque mode que les
// règles peuvent donner en a un : un test le vérifie pour toutes les valeurs
// de `cible_mode_id`. Un trajet en avion ou en bateau de ligne régulière prend
// le libellé de la ligne régulière, pas celui du mode (#221).

import { given } from "../../../../../core/models/eligibilite/question";
import { luPar, type TraceDe } from "../ce-que-lit-un-texte";

/** Le partage du transport : prouvé, écarté, ou que les réponses ne disent pas. */
export type Partage = "incompatible" | "possible" | "inconnu";

/**
 * La portée du trajet, sous sa clé de `cardPrefixes` dans le catalogue. « L » :
 * le trajet est terrestre. « M-COMMUN » : une partie se fait en avion ou en
 * bateau de ligne régulière, et aucune réponse n'établit de partie terrestre.
 */
export type Portee = "L" | "M-COMMUN";

/** Les règles n'ont pas donné de mode. */
type SansMode = undefined;

/** Ce que lit la portée du trajet. */
export const LU_PAR_LA_PORTEE = luPar({
  faits: given.faits("fait_avion_bateau_ligne"),
});

/** Ce que lit le partage du transport. */
export const LU_PAR_LE_PARTAGE = luPar({
  cibles: given.cibles("cible_transport_partage_incompatible"),
});

/** Ce que lit le libellé de la fiche. */
export const LU_PAR_LE_LIBELLE = luPar(
  {
    cibles: given.cibles(
      "cible_mode_id",
      "cible_personne_accompagnante",
      "cible_fauteuil_roulant",
      "cible_ambulance_equipement_bariatrique",
    ),
  },
  LU_PAR_LA_PORTEE,
  LU_PAR_LE_PARTAGE,
);

/** Ce que lit le rang du titre du prescripteur. */
export const LU_PAR_LE_RANG_DU_TITRE = luPar(
  { cibles: given.cibles("cible_mode_individual", "cible_mode_public") },
  LU_PAR_LA_PORTEE,
);

/**
 * La portée de ce trajet. Q2.3.2 dit la ligne régulière, et aucune question ne
 * dit la partie terrestre (D-111) : elle n'est jamais établie, et « M-TERRE »
 * ne se donne pas. « U », une ligne régulière que les réponses ne disent pas,
 * n'arrive pas : Q2.3.2 est une case seule, validée avec la distance, avant
 * toute issue à fiche positive.
 */
export function porteeDuTrajet(
  trace: TraceDe<typeof LU_PAR_LA_PORTEE>,
): Portee {
  return trace.faits.fait_avion_bateau_ligne.isOui() ? "M-COMMUN" : "L";
}

/**
 * Le libellé du catalogue pour cette fiche : celui de la ligne régulière si le
 * trajet en a une, celui du mode sinon. Absent si les règles n'ont pas de mode.
 */
export function libelleDeLaFiche(
  trace: TraceDe<typeof LU_PAR_LE_LIBELLE>,
): string | SansMode {
  const libelle = libelleDuMode(trace.cibles);
  if (libelle === undefined || porteeDuTrajet(trace) === "L") return libelle;
  return LIGNE_REGULIERE;
}

/**
 * Le rang du titre du prescripteur : 0 pour un déplacement par ses propres
 * moyens, 1 pour un transport sanitaire. Un trajet en ligne régulière prend
 * le 0 : rien n'établit qu'une partie en soit sanitaire (§4.3 du contrat).
 */
export function rangDuTitreDuPrescripteur(
  trace: TraceDe<typeof LU_PAR_LE_RANG_DU_TITRE>,
): 0 | 1 {
  if (porteeDuTrajet(trace) !== "L") return 0;
  const { cibles } = trace;
  const propre =
    cibles.cible_mode_individual.isOui() || cibles.cible_mode_public.isOui();
  return propre ? 0 : 1;
}

/**
 * Ce que Q1.3 dit du partage. « Incompatible » est coché, « possible » est
 * validé sans cette case, et une réponse absente ne dit rien.
 */
export function partageDuTransport(
  cibles: TraceDe<typeof LU_PAR_LE_PARTAGE>["cibles"],
): Partage {
  const incompatible = cibles.cible_transport_partage_incompatible;
  if (incompatible.isOui()) return "incompatible";
  return incompatible.isNon() ? "possible" : "inconnu";
}

// ---- implémentation ----

type CiblesDuLibelle = TraceDe<typeof LU_PAR_LE_LIBELLE>["cibles"];

// Le titre et le modus d'un trajet en ligne régulière, que l'avion et le
// bateau partagent : aucune réponse ne dit lequel des deux.
const LIGNE_REGULIERE = "Avion ou bateau de ligne régulière (type non précisé)";

// Le libellé de mode du catalogue ; absent si les règles n'ont pas de mode.
function libelleDuMode(cibles: CiblesDuLibelle): string | SansMode {
  switch (cibles.cible_mode_id.value) {
    case "VEHICULE_PERSONNEL":
      return avecProche("Véhicule personnel", cibles);
    case "TRANSPORT_COMMUN":
      return avecProche("Transports en commun", cibles);
    case "TAP":
      return `TAP ${partage(cibles)}`;
    case "TPMR":
      return `TAP TPMR ${partage(cibles)}`;
    case "AMBULANCE":
      return ambulance(cibles);
    default:
      return undefined;
  }
}

// Seul « non partagé » est prouvé par une case cochée. Le reste prend le
// libellé du partage possible : titre et modus sont les mêmes dans les deux.
function partage(cibles: CiblesDuLibelle): string {
  return partageDuTransport(cibles) === "incompatible"
    ? "non partagé"
    : "pouvant être partagé avec d’autres patients";
}

function avecProche(base: string, cibles: CiblesDuLibelle): string {
  return cibles.cible_personne_accompagnante.isOui()
    ? `${base} avec proche accompagnant nécessaire`
    : base;
}

// Le fauteuil et la corpulence ne se prouvent que par les cibles : jamais par
// défaut.
function ambulance(cibles: CiblesDuLibelle): string {
  const fauteuil = cibles.cible_fauteuil_roulant.isOui();
  const bariatrique = cibles.cible_ambulance_equipement_bariatrique.isOui();
  if (fauteuil && bariatrique) return "Ambulance + TPMR + bariatrique";
  if (fauteuil) return "Ambulance + TPMR";
  return bariatrique ? "Ambulance avec équipement bariatrique" : "Ambulance";
}
