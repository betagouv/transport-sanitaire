// Le catalogue des faits du modèle : chaque fait que les règles reçoivent se
// déclare une fois, dans le thème qui le pose. Sa chaîne de règles dit tout ce
// qu'il vaut, la première qui conclut l'emporte.
//
// Les gardes des questions lisent ce catalogue. La décision le lit aussi, en
// imposant la complétude de P1 et de P2 : la constater pose les questions,
// donc lit leurs gardes.

import { Fait, FaitCatalogue } from "../../socle/index.ts";
import {
  type DeclarationsDeFaits,
  FAITS,
  type Faits,
} from "./declarations/faits.ts";
import type { Questions } from "./declarations/questions.ts";
import { EXCLUSION_DU_TRANSPORT } from "./exclusion-du-transport.ts";
import { FAITS_DU_MODE } from "./p1/mode-de-transport.ts";
import { FAITS_DE_LA_BRANCHE } from "./p2/branche.ts";
import { FAITS_DES_CONTEXTES } from "./p2/contextes.ts";
import { FAITS_DE_LA_CONVOCATION } from "./p2/convocation.ts";
import { FAITS_DE_LA_PERMISSION } from "./p2/permission.ts";
import { FAITS_DE_LA_PRESTATION } from "./p2/prestation.ts";
import { FAITS_DU_TRAJET } from "./p2/trajet.ts";
import { FAITS_DU_TRANSFERT } from "./p2/transfert.ts";

/** Les faits du modèle, chacun déclaré une fois. */
export const CATALOGUE_DES_FAITS = new FaitCatalogue<Questions, Faits>(
  FAITS,
  FAITS_DU_MODE,
  FAITS_DU_TRAJET,
  FAITS_DE_LA_PRESTATION,
  FAITS_DES_CONTEXTES,
  FAITS_DU_TRANSFERT,
  FAITS_DE_LA_PERMISSION,
  FAITS_DE_LA_CONVOCATION,
  FAITS_DE_LA_BRANCHE,
  faitsSansQuestion(),
);

// ---- implémentation ----

// Les faits qu'aucune réponse ne pose : la décision impose la complétude,
// le logiciel constate l'exclusion, et le centre de référence attend P3.
function faitsSansQuestion(): DeclarationsDeFaits {
  const completude = () =>
    Fait.inconnu(
      "Une garde ne la lit pas : la constater pose les questions ; la décision l'impose.",
    );
  return {
    fait_p1_complete: completude,
    fait_p2_complete: completude,
    fait_exclusion_transport_prouvee: () => EXCLUSION_DU_TRANSPORT,
    fait_centre_reference_destination: () =>
      Fait.inconnu(
        "Aucune question avant le verrou ne le pose : Q3.4.a, en P3, précise le document sans requalifier P2 (D-117).",
      ),
  };
}
