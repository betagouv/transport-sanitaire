// La page des évènements (Q3.6) : la date d'un AT/MP que P2 a établi, et un
// accident causé par un tiers. Puis celle de l'exonération (Q3.7). Les trois
// supports ont ces cases. Elles sont documentaires : ni le motif, ni le
// document, ni la DAP n'en dépendent.

import { page } from "../../../socle/index.ts";
import { given, question } from "../question.ts";
import { avecUnDocument, uneDap } from "./supports-du-complement.ts";

const DATE_FUTURE =
  "Cette date est dans le futur : un accident ne peut pas encore avoir eu lieu.";

// Le lien AT/MP ne se repose pas : sa case est déjà cochée, seule sa date
// manque.
export const PAGE_DES_EVENEMENTS = page(
  "P3/evenements",
  question
    .date(
      "Q3.6.1",
      "Quelle est la date de l’accident du travail, ou de la première constatation de la maladie professionnelle ?",
    )
    .mattersWhile(
      avecUnDocument.and(given.cible("cible_situation_at_mp").isOui()),
    )
    .reminder(
      "Le transport est lié à un accident du travail ou à une maladie professionnelle : la case est déjà cochée.",
    )
    .inconsistentWhen(dansLeFutur("Q3.6.1"), DATE_FUTURE),
  question
    .singleChoice(
      "Q3.6.2",
      "Ce transport est-il en rapport avec un accident causé par un tiers ?",
    )
    .mattersWhile(avecUnDocument),
  question
    .date("Q3.6.3", "Quelle est la date de l’accident causé par un tiers ?")
    .appliesWhen(given.question("Q3.6.2").answer().is("1_OUI"))
    .dependsOn("Q3.6.2")
    .inconsistentWhen(dansLeFutur("Q3.6.3"), DATE_FUTURE),
);

// Q3.7 : le cerfa n'a qu'une case Oui / Non. Les cas aident à la cocher. Ils
// ne se proposent que dans un contexte hospitalier, chacun pour les supports
// dont la notice le cite. Aucun cas n'est encore acquis en P2 : « Aucun » n'a
// rien d'autre à préserver que les cases de cette page.
export const PAGE_DE_L_EXONERATION = page(
  "P3/exoneration",
  question
    .multipleChoice(
      "Q3.7",
      "Un cas particulier d’exonération du ticket modérateur doit-il être reporté ?",
    )
    .hint(
      "Cochez un cas seulement si sa condition propre est vérifiée : un motif d’hospitalisation ne suffit pas.",
    )
    .mattersWhile(
      avecUnDocument.and(
        given.cible("cible_hospitalisation_ou_seances_assimilees").isOui(),
      ),
    )
    // La notice de la DAP n'a ni l'urgence hospitalière, ni la HAD ou la
    // radiothérapie. Elle seule a le traitement mieux adapté.
    .option("3_URGENCE_HOSPITALIERE", (option) =>
      option.offeredWhen(uneDap.not()),
    )
    .option("4_HAD_OU_RADIOTHERAPIE", (option) =>
      option.offeredWhen(uneDap.not()),
    )
    .option("6_TRAITEMENT_MIEUX_ADAPTE", (option) => option.offeredWhen(uneDap))
    .exclusive("7_AUCUN"),
);

/** Le jour de cet instant à Paris, au format `AAAA-MM-JJ`. */
export function jourAParis(instant: Date): string {
  // La locale suédoise écrit la date en `AAAA-MM-JJ`.
  return instant.toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });
}

// ---- implémentation ----

// La date répondue est après aujourd'hui, à Paris.
function dansLeFutur(id: "Q3.6.1" | "Q3.6.3") {
  return given.question(id).answer().toDate().isAfter(given.today());
}
