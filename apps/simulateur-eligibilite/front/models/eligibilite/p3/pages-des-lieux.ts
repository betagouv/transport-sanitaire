// Les pages du départ (Q3.2) et de l'arrivée (Q3.3) : la nature du lieu, son
// nom, sa nature en toutes lettres s'il le faut, son adresse. Une nature que
// P2 établit se rappelle sans se redemander (`lieux-du-trajet.ts`). Aucune
// distance ne se compare aux adresses.

import type { Address, QuestionnairePart } from "../../../socle";
import type { Cibles } from "../declarations/cibles";
import { OPTIONS, type Questions } from "../declarations/questions";
import {
  type ContextDuComplement as Contexte,
  questionDuComplement as question,
} from "../question";
import {
  aLEtranger,
  type Extremite,
  type Nature,
  natureDu,
  natureEtablie,
  precisionAPoser,
  QUESTIONS_DU_LIEU,
} from "./lieux-du-trajet";
import { natureAdmise } from "./roles-des-lieux";
import { avecUnDocument } from "./supports-du-complement";

type Page = QuestionnairePart<Questions, Cibles>["pages"][number];
type Question = Page["questions"][number];

export const PAGE_DU_DEPART: Page = {
  id: "P3/depart",
  questions: questionsDuLieu("depart", {
    nature: "Quel est le lieu de départ ?",
    adresse: "Adresse du lieu de départ",
    rappel: "Lieu de départ",
  }),
};

export const PAGE_DE_L_ARRIVEE: Page = {
  id: "P3/arrivee",
  questions: questionsDuLieu("arrivee", {
    nature: "Quel est le lieu d’arrivée ?",
    adresse: "Adresse du lieu d’arrivée",
    rappel: "Lieu d’arrivée",
  }),
};

// ---- implémentation ----

const MEME_ADRESSE =
  "Le départ et l’arrivée ont la même adresse : ce trajet n’existe pas. Corrigez l’une des deux.";

type Libelles = { nature: string; adresse: string; rappel: string };

// Le rappel coiffe la première question posée : le nom, ou l'adresse d'un
// domicile, qui n'en a pas.
function questionsDuLieu(extremite: Extremite, libelles: Libelles): Question[] {
  const ids = QUESTIONS_DU_LIEU[extremite];
  const rappel = rappelDe(extremite, libelles.rappel);
  const domicile = ({ answers }: Contexte) =>
    natureEtablie(extremite, answers)?.nature === "1_DOMICILE";
  return [
    natureAChoisir(extremite, libelles.nature),
    question.text(ids.nom, {
      label: "Nom du lieu ou de la structure",
      optional: true,
      askedIf: ({ answers, cibles, validated }) =>
        avecUnDocument(cibles) &&
        nomUtile(natureDu(extremite, answers, validated)),
      reminderFrom: rappel,
    }),
    precisionDuLieu(extremite),
    question.address(ids.adresse, {
      label: libelles.adresse,
      askedIf: ({ cibles }) => avecUnDocument(cibles),
      abroadIf: ({ answers }) => aLEtranger(extremite, answers),
      reminderFrom: (contexte) =>
        domicile(contexte) ? rappel(contexte) : undefined,
      ...(extremite === "arrivee" && { inconsistenciesFrom: adresseDistincte }),
    }),
  ];
}

// Ce que P2 établit du lieu, rappelé sans se redemander.
function rappelDe(extremite: Extremite, label: string) {
  return ({ answers }: Contexte) => {
    const etablie = natureEtablie(extremite, answers);
    return etablie && [{ label, value: etablie.rappel }];
  };
}

// La nature en toutes lettres, pour un hébergement ou un autre lieu
// (`precisionAPoser`).
function precisionDuLieu(extremite: Extremite): Question {
  return question.text(QUESTIONS_DU_LIEU[extremite].precision, {
    label: "Nature du lieu",
    hint: "Elle s’inscrit sur le document. Par exemple : maison d’accueil hospitalière, foyer, lieu de travail.",
    askedIf: ({ answers, cibles, validated }) =>
      avecUnDocument(cibles) && precisionAPoser(extremite, answers, validated),
  });
}

// La nature ne se choisit que si P2 ne l'établit pas, parmi celles que P2 et
// l'autre lieu admettent (`natureAdmise`).
function natureAChoisir(extremite: Extremite, label: string): Question {
  const id = QUESTIONS_DU_LIEU[extremite].nature;
  const autre = extremite === "depart" ? "arrivee" : "depart";
  const admise =
    (nature: Nature) =>
    ({ answers, validated }: Contexte) =>
      natureAdmise(
        nature,
        extremite,
        answers,
        natureDu(autre, answers, validated),
      );
  return question.singleChoice(id, {
    label,
    dropdown: true,
    askedIf: ({ answers, cibles }) =>
      avecUnDocument(cibles) && natureEtablie(extremite, answers) === undefined,
    options: Object.fromEntries(
      (Object.keys(OPTIONS[id]) as Nature[]).map((nature) => [
        nature,
        { offeredIf: admise(nature) },
      ]),
    ),
  });
}

// Un domicile n'a pas de nom à reporter. Tant que la nature manque, le nom
// attend.
function nomUtile(nature: string | undefined): boolean {
  return nature !== undefined && nature !== "1_DOMICILE";
}

function adresseDistincte({ answers, validated }: Contexte): string[] {
  const depart = validated.question("Q3.2.adresse").value;
  const arrivee = answers.question("Q3.3.adresse").value;
  return depart && arrivee && memeAdresse(depart, arrivee)
    ? [MEME_ADRESSE]
    : [];
}

function memeAdresse(a: Address, b: Address): boolean {
  const champs = [
    "street",
    "complement",
    "postalCode",
    "city",
    "country",
  ] as const;
  const lu = (adresse: Address, champ: (typeof champs)[number]) =>
    (adresse[champ] ?? "").trim().toLocaleLowerCase("fr");
  return champs.every((champ) => lu(a, champ) === lu(b, champ));
}
