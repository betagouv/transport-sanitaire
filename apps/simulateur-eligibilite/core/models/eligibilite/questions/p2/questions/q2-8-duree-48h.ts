// Q2.8.duree_48h : la permission dure-t-elle au plus 48 heures ? Les dates
// seules ne le disent pas : la réponse en est la preuve
// (DATES-SEULES-20261104). Elle n'est refusée que si les dates la contredisent
// à coup sûr, comptées en jours de Paris, changements d'heure compris. Du 4 au
// 6 novembre, ni Oui ni Non ne se refuse.

import { given, question } from "../../question.ts";
import { unMineurDeVingtAns } from "../conditions/permission.ts";
import { Q2_8_2 } from "./q2-8-2.ts";
import { Q2_8_3 } from "./q2-8-3.ts";

const declaree = question
  .singleChoice(
    "Q2.8.duree_48h",
    "Cette permission dure-t-elle au maximum 48 heures ?",
  )
  .options({
    "1_OUI": "Oui.",
    "2_NON": "Non.",
  });

const contreditParLesDates = given
  .all({
    debut: given.question(Q2_8_2).answer(),
    fin: given.question(Q2_8_3).answer(),
    duree: given.question(declaree).answer(),
  })
  .compute(({ debut, fin, duree }) =>
    contredit(debut.value, fin.value, duree.value),
  );

export const Q2_8_DUREE_48H = declaree
  .appliesWhen(unMineurDeVingtAns)
  .inconsistentWhen(
    contreditParLesDates,
    "Cette durée ne correspond pas aux dates de la permission.",
  );

// ---- implémentation ----

const QUARANTE_HUIT_HEURES = 48 * 3_600_000;

// La réponse contredit les dates : même partie au dernier instant du début et
// rentrée au premier de la fin, la permission dure plus de 48 heures ; même
// partie au premier instant et rentrée au dernier, elle en dure moins.
function contredit(
  debut: string | undefined,
  fin: string | undefined,
  duree: string | undefined,
): boolean {
  if (!estUnJour(debut) || !estUnJour(fin) || fin < debut) return false;
  if (duree === "1_OUI")
    return (
      minuitAParis(fin) - minuitAParis(lendemain(debut)) >= QUARANTE_HUIT_HEURES
    );
  if (duree === "2_NON")
    return (
      minuitAParis(lendemain(fin)) - minuitAParis(debut) <= QUARANTE_HUIT_HEURES
    );
  return false;
}

// Une date réelle du calendrier, écrite `AAAA-MM-JJ`.
function estUnJour(saisie: string | undefined): saisie is string {
  return (
    saisie !== undefined &&
    /^\d{4}-\d{2}-\d{2}$/.test(saisie) &&
    new Date(`${saisie}T00:00:00Z`).toISOString().startsWith(saisie)
  );
}

function lendemain(jour: string): string {
  const suivant = new Date(`${jour}T00:00:00Z`);
  suivant.setUTCDate(suivant.getUTCDate() + 1);
  return suivant.toISOString().slice(0, 10);
}

// L'instant de minuit à Paris, ce jour. Paris change d'heure à 1 h UTC : à
// 0 h UTC, son décalage est encore celui de minuit.
function minuitAParis(jour: string): number {
  const zeroHeureUtc = Date.parse(`${jour}T00:00:00Z`);
  const heureAParis = Number(
    HEURE_A_PARIS.formatToParts(zeroHeureUtc).find(
      ({ type }) => type === "hour",
    )?.value,
  );
  return zeroHeureUtc - heureAParis * 3_600_000;
}

const HEURE_A_PARIS = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  hour: "numeric",
  hourCycle: "h23",
});
