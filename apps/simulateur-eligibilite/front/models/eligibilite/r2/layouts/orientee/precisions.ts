// Les précisions du prescripteur (D-111) : le contexte de chaque scénario.
// Elles ne se lisent que sous les issues orientées (D-224).

import type { Questions } from "../../../../../../core/models/eligibilite/questions/reponses";
import type { Value } from "../../../../../../core/socle";
import {
  type Contexte,
  cle,
  type Entrees,
  lues,
  type NonProuve,
  type Precisions,
} from "../../components/precisions";

/** Les précisions du prescripteur : le contexte de chaque scénario. */
export const PRECISIONS_DU_PRESCRIPTEUR: Value<Precisions> = lues(
  "deplacement",
  "transfert",
  "sousType",
  "tranche",
  "convocation",
  "appareil",
).compute((entrees) => ({
  ...cle("article80Context", contexteDeLArticle80(entrees)),
  ...cle("permissionContext", contexteDeLaPermission(entrees)),
  ...cle("convocationContext", contexteDeLaConvocation(entrees)),
}));

// ---- implémentation ----

// Q2.5 dit le genre du déplacement, Q2.6.a sa durée. Le même site, l'USLD et
// l'EHPAD n'ont pas de question qui les prouve. Un autre déplacement pendant
// le séjour est provisoire (D-106). L'admission en HAD à domicile prouve le
// genre « had » seul.
function contexteDeLArticle80({
  deplacement,
  transfert,
  sousType,
}: Pick<Entrees, "deplacement" | "transfert" | "sousType">):
  | Contexte
  | NonProuve {
  if (deplacement.is("2_AUTRE_DEPLACEMENT"))
    return { kind: "inpatient", duration: "temporary" };
  if (deplacement.is("1_TRANSFERT")) {
    if (transfert.is("1_DEFINITIF"))
      return { kind: "transfer", duration: "permanent" };
    return transfert.is("2_PROVISOIRE")
      ? { kind: "transfer", duration: "temporary" }
      : { kind: "transfer" };
  }
  return sousType.is("3_ADMISSION_HAD") ? { kind: "had" } : undefined;
}

// Q2.7 option 4 : un transport exceptionnel demandé par écrit par le patient.
function contexteDeLaPermission({
  tranche,
}: Pick<Entrees, "tranche">): Contexte | NonProuve {
  return tranche.is("4_ADULTE_A_SA_CHARGE")
    ? { kind: "adult-explicit" }
    : undefined;
}

const GENRE_DE_CONVOCATION: Partial<Record<Questions["Q2.10"], string>> = {
  "1_CONTROLE_MEDICAL": "control",
  "2_EXPERT_JURIDICTION": "expert",
  "3_AUDIENCE_CONSULTATION": "audience",
  "4_EXPERT_CONTESTATION": "dispute",
  "5_COMMISSION_RECOURS": "commission",
  "6_APPAREILLAGE": "equipment",
};

const APPAREIL: Partial<Record<string, string>> = {
  "1_PROTHESE_OCULAIRE_FACIALE": "prothèse oculaire ou faciale",
  "2_PODO_ORTHESE": "podo-orthèse",
  "3_ORTHOPROTHESE": "orthoprothèse",
};

// Q2.10 dit le genre ; Q2.10.b l'appareil, pour un appareillage seulement.
function contexteDeLaConvocation({
  convocation,
  appareil,
}: Pick<Entrees, "convocation" | "appareil">): Contexte | NonProuve {
  const categorie = convocation.value;
  const kind = categorie && GENRE_DE_CONVOCATION[categorie];
  if (!kind) return undefined;
  const device = APPAREIL[appareil.value ?? ""];
  return categorie === "6_APPAREILLAGE" && device ? { kind, device } : { kind };
}
