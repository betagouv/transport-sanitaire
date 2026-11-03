// Les précisions de la fiche négative (D-111) : ce qui dit pourquoi. Elles ne
// se lisent que sous l'issue refusée (D-224).

import type { Value } from "../../../../../../core/socle";
import {
  cle,
  type Entrees,
  lues,
  type NonProuve,
  type Precisions,
} from "../../components/precisions";

/** Les précisions de la fiche négative : ce qui dit pourquoi. */
export const PRECISIONS_DE_LA_FICHE_NEGATIVE: Value<Precisions> = lues(
  "motif",
  "dialyse",
  "appareil",
  "serie",
  "soins",
  "lienAld",
).compute((entrees) => ({
  ...cle("careFamily", familleDeSoin(entrees)),
  ...cle("dialysisType", typeDeDialyse(entrees)),
  ...cle("deviceCategory", categorieDAppareil(entrees)),
  ...cle("repeatedTripsPlanned", seriePrevue(entrees)),
  ...aldDeQ13(entrees),
}));

// ---- implémentation ----

// Le numéro de l'option de Q2.1, pour les soins qui ont une phrase de famille.
const FAMILLES_DE_SOIN = [1, 2, 3, 4, 5, 6, 7, 14, 15];

function familleDeSoin({ motif }: Pick<Entrees, "motif">): number | NonProuve {
  if (!motif.hasAnswer()) return undefined;
  // Le slug porte en tête le numéro de l'option au catalogue (D-75).
  const numero = Number.parseInt(motif.value, 10);
  return FAMILLES_DE_SOIN.includes(numero) ? numero : undefined;
}

// Q1.3.a dit une dialyse qui n'est pas de l'hémodialyse.
function typeDeDialyse({
  dialyse,
}: Pick<Entrees, "dialyse">): Precisions["dialysisType"] {
  return dialyse.is("2_AUTRE_DIALYSE") ? "non-hemodialyse" : undefined;
}

// Q2.10.b : un appareillage qui n'est pas l'un des trois que vise R.322-10 2°.
function categorieDAppareil({
  appareil,
}: Pick<Entrees, "appareil">): "hors-categories" | NonProuve {
  return appareil.is("4_AUTRE") ? "hors-categories" : undefined;
}

// Q2.3.3 « Oui » prouve des transports répétés. « Non » ne dit pas quelle
// condition de la série manque : rien n'en est inféré.
function seriePrevue({ serie }: Pick<Entrees, "serie">): true | NonProuve {
  return serie.is("1_OUI") ? true : undefined;
}

// Q1.3 option 2 dit que l'ALD est reconnue, Q1.3.b si le soin y est lié
// (MET-ALD-LIEN-001). Non cochée, elle ne dit rien de l'ALD. Le lien ne se
// déduit jamais de `fait_ald_liee`, qui y mêle la déficience.
function aldDeQ13({
  soins,
  lienAld,
}: Pick<Entrees, "soins" | "lienAld">): Pick<
  Precisions,
  "aldRecognized" | "aldRelated"
> {
  if (!soins.checked("2_ALD")) return {};
  if (lienAld.is("1_LIEN_DIRECT"))
    return { aldRecognized: true, aldRelated: true };
  if (lienAld.is("2_SANS_LIEN_DIRECT"))
    return { aldRecognized: true, aldRelated: false };
  return { aldRecognized: true };
}
