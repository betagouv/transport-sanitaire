// Les contextes de scénario que la trace porte en précisions : ceux de
// l'article 80, de la permission et de la convocation. Chacun ne lit que les
// questions validées de la précision qui le porte (#196). Un contexte que
// les réponses ne prouvent pas est `NonProuve`.

import { Permission } from "../../../../core/models/eligibilite/concepts/permission";
import type { Questions } from "../../../../core/models/eligibilite/declarations/questions";
import { forConcept } from "../../../socle";
import type { QuestionsLues } from "../lectures";
import type { NonProuve } from "./precisions-du-resultat";

/**
 * Un contexte de scénario du catalogue : les seuls paramètres non nuls que
 * les réponses prouvent. Le `kind` est toujours prouvé ; les autres, quand
 * une réponse les dit.
 */
export type Contexte = {
  kind: string;
  duration?: "temporary" | "permanent";
  place?: "same-site";
  extra?: string;
  device?: string;
};

// Ce que lit `Permission` dès sa construction, Q2.7 comprise.
export const QUESTIONS_DE_LA_PERMISSION = [
  "Q2.7",
  "Q2.8.1",
  "Q2.8.2",
  "Q2.8.3",
  "Q2.8.5",
  "Q2.8.6",
  "Q2.8.6.a",
] as const;

// Q2.5 dit le genre du déplacement, Q2.6.a sa durée. Le même site, l'USLD et
// l'EHPAD n'ont pas de question qui les prouve. Un autre déplacement pendant
// le séjour est provisoire (D-106). L'admission en HAD à domicile prouve le
// genre « had » seul.
export function contexteDeLArticle80(
  validated: QuestionsLues<"Q2.5" | "Q2.6.a" | "Q2.1.g">,
): Contexte | NonProuve {
  const deplacement = validated.question("Q2.5");
  if (deplacement.is("2_AUTRE_DEPLACEMENT"))
    return { kind: "inpatient", duration: "temporary" };
  if (deplacement.is("1_TRANSFERT")) {
    const type = validated.question("Q2.6.a");
    if (type.is("1_DEFINITIF"))
      return { kind: "transfer", duration: "permanent" };
    return type.is("2_PROVISOIRE")
      ? { kind: "transfer", duration: "temporary" }
      : { kind: "transfer" };
  }
  return validated.question("Q2.1.g").is("3_ADMISSION_HAD")
    ? { kind: "had" }
    : undefined;
}

// Q2.7 option 4 : un transport exceptionnel demandé par écrit par le patient.
export function contexteDeLaPermission(
  validated: QuestionsLues<(typeof QUESTIONS_DE_LA_PERMISSION)[number]>,
): Contexte | NonProuve {
  return Permission.of(forConcept(validated)).estAChargeDuPatient()
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
export function contexteDeLaConvocation(
  validated: QuestionsLues<"Q2.10" | "Q2.10.b">,
): Contexte | NonProuve {
  const categorie = validated.question("Q2.10").value;
  const kind = categorie && GENRE_DE_CONVOCATION[categorie];
  if (!kind) return undefined;
  const device = APPAREIL[validated.question("Q2.10.b").value ?? ""];
  return categorie === "6_APPAREILLAGE" && device ? { kind, device } : { kind };
}
