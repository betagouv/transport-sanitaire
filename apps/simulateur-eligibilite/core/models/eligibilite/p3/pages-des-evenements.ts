// La page des évènements (Q3.6) : la date d'un AT/MP que P2 a établi, et un
// accident causé par un tiers. Puis celle de l'exonération (Q3.7). Les trois
// supports ont ces cases. Elles sont documentaires : ni le motif, ni le
// document, ni la DAP n'en dépendent.

import type { QuestionnairePart } from "../../../socle/index.ts";
import type { Cibles } from "../declarations/cibles.ts";
import type { Questions } from "../declarations/questions.ts";
import {
  type ContextDuComplement as Contexte,
  questionDuComplement as question,
} from "../question.ts";
import { avecUnDocument } from "./supports-du-complement.ts";

type Page = QuestionnairePart<Questions, Cibles>["pages"][number];

// Le lien AT/MP ne se repose pas : sa case est déjà cochée, seule sa date
// manque.
export const PAGE_DES_EVENEMENTS: Page = {
  id: "P3/evenements",
  questions: [
    question.date("Q3.6.1", {
      label:
        "Quelle est la date de l’accident du travail, ou de la première constatation de la maladie professionnelle ?",
      askedIf: ({ cibles }) =>
        avecUnDocument(cibles) && cibles.cible_situation_at_mp === true,
      reminderFrom: () =>
        "Le transport est lié à un accident du travail ou à une maladie professionnelle : la case est déjà cochée.",
      inconsistenciesFrom: ({ answers }) =>
        apresAujourdHui(answers.question("Q3.6.1").value),
    }),
    question.singleChoice("Q3.6.2", {
      label:
        "Ce transport est-il en rapport avec un accident causé par un tiers ?",
      askedIf: ({ cibles }) => avecUnDocument(cibles),
    }),
    question.date("Q3.6.3", {
      label: "Quelle est la date de l’accident causé par un tiers ?",
      askedIf: ({ answers }) => answers.question("Q3.6.2").is("1_OUI"),
      dependsOn: ["Q3.6.2"],
      inconsistenciesFrom: ({ answers }) =>
        apresAujourdHui(answers.question("Q3.6.3").value),
    }),
  ],
};

// Q3.7 : le cerfa n'a qu'une case Oui / Non. Les cas aident à la cocher. Ils
// ne se proposent que dans un contexte hospitalier, chacun pour les supports
// dont la notice le cite. Aucun cas n'est encore acquis en P2 : « Aucun » n'a
// rien d'autre à préserver que les cases de cette page.
export const PAGE_DE_L_EXONERATION: Page = {
  id: "P3/exoneration",
  questions: [
    question.multipleChoice("Q3.7", {
      label:
        "Un cas particulier d’exonération du ticket modérateur doit-il être reporté ?",
      hint: "Cochez un cas seulement si sa condition propre est vérifiée : un motif d’hospitalisation ne suffit pas.",
      askedIf: ({ cibles }) =>
        avecUnDocument(cibles) &&
        cibles.cible_hospitalisation_ou_seances_assimilees === true,
      options: {
        "3_URGENCE_HOSPITALIERE": { offeredIf: horsDap },
        "4_HAD_OU_RADIOTHERAPIE": { offeredIf: horsDap },
        "6_TRAITEMENT_MIEUX_ADAPTE": {
          offeredIf: ({ cibles }) => cibles.cible_support_id === "S3139h",
        },
      },
      exclusiveOption: "7_AUCUN",
    }),
  ],
};

/** Le jour de cet instant à Paris, au format `AAAA-MM-JJ`. */
export function jourAParis(instant: Date): string {
  // La locale suédoise écrit la date en `AAAA-MM-JJ`.
  return instant.toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });
}

// ---- implémentation ----

// La notice de la DAP n'a ni l'urgence hospitalière, ni la HAD ou la
// radiothérapie. Elle seule a le traitement mieux adapté.
function horsDap({ cibles }: Contexte): boolean {
  return cibles.cible_support_id !== "S3139h";
}

// Une date au format AAAA-MM-JJ se compare comme un texte.
function apresAujourdHui(date: string | undefined): string[] {
  return date !== undefined && date > aujourdHui()
    ? [
        "Cette date est dans le futur : un accident ne peut pas encore avoir eu lieu.",
      ]
    : [];
}

function aujourdHui(): string {
  return jourAParis(new Date());
}
