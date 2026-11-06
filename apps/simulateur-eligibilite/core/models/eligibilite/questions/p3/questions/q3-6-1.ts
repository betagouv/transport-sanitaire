// Q3.6.1 : la date d'un AT/MP que P2 a établi. Le lien ne se repose pas : sa
// case est déjà cochée, seule sa date manque. Elle est documentaire : ni le
// motif, ni le document, ni la DAP n'en dépendent.

import { DATE_FUTURE, dansLeFutur } from "../../p1/conditions/evenements.ts";
import { given, question } from "../../question.ts";
import { avecUnDocument } from "../conditions/supports-du-complement.ts";

// La question, avant la règle qui lit sa réponse.
const declaree = question
  .date(
    "Q3.6.1",
    "Quelle est la date de l’accident du travail, ou de la première constatation de la maladie professionnelle ?",
  )
  .mattersWhile(
    avecUnDocument.and(given.cible("cible_situation_at_mp").isOui()),
  )
  .reminder(
    "Le transport est lié à un accident du travail ou à une maladie professionnelle : la case est déjà cochée.",
  );

export const Q3_6_1 = declaree.inconsistentWhen(
  dansLeFutur(declaree),
  DATE_FUTURE,
);
