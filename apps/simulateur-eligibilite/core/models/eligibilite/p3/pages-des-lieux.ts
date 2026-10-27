// Les pages du départ (Q3.2) et de l'arrivée (Q3.3) : la nature du lieu, son
// nom, sa nature en toutes lettres s'il le faut, son adresse. Une nature que
// P2 établit se rappelle sans se redemander (`lieux-du-trajet.ts`). Aucune
// distance ne se compare aux adresses.

import { type Address, page } from "../../../socle/index.ts";
import { OPTIONS } from "../declarations/questions.ts";
import { type Context as Contexte, question } from "../question.ts";
import {
  aLEtranger,
  type Extremite,
  type Nature,
  natureDu,
  natureEtablie,
  precisionAPoser,
  QUESTIONS_DU_LIEU,
} from "./lieux-du-trajet.ts";
import { natureAdmise } from "./roles-des-lieux.ts";
import { avecUnDocument } from "./supports-du-complement.ts";

export const PAGE_DU_DEPART = pageDuLieu("P3/depart", "depart", {
  nature: "Quel est le lieu de départ ?",
  adresse: "Adresse du lieu de départ",
  rappel: "Lieu de départ",
});

export const PAGE_DE_L_ARRIVEE = pageDuLieu("P3/arrivee", "arrivee", {
  nature: "Quel est le lieu d’arrivée ?",
  adresse: "Adresse du lieu d’arrivée",
  rappel: "Lieu d’arrivée",
});

// ---- implémentation ----

type Libelles = { nature: string; adresse: string; rappel: string };

// Le rappel coiffe la première question posée : le nom, ou l'adresse d'un
// domicile, qui n'en a pas.
function pageDuLieu(id: string, extremite: Extremite, libelles: Libelles) {
  const ids = QUESTIONS_DU_LIEU[extremite];
  const rappel = rappelDe(extremite, libelles.rappel);
  return page(
    id,
    natureAChoisir(extremite, libelles.nature),
    question
      .text(ids.nom, "Nom du lieu ou de la structure")
      .optional()
      .askedIf(
        ({ answers, cibles, validated }) =>
          avecUnDocument(cibles) &&
          nomUtile(natureDu(extremite, answers, validated)),
      )
      .reminderFrom(rappel),
    precisionDuLieu(extremite),
    adresseDuLieu(extremite, libelles.adresse, rappel),
  );
}

// L'adresse d'un domicile porte le rappel, faute de nom. Celle de l'arrivée
// ne répète pas celle du départ.
function adresseDuLieu(
  extremite: Extremite,
  label: string,
  rappel: ReturnType<typeof rappelDe>,
) {
  const adresse = question
    .address(QUESTIONS_DU_LIEU[extremite].adresse, label)
    .askedIf(({ cibles }) => avecUnDocument(cibles))
    .abroadIf(({ answers }) => aLEtranger(extremite, answers))
    .reminderFrom((contexte) =>
      natureEtablie(extremite, contexte.answers)?.nature === "1_DOMICILE"
        ? rappel(contexte)
        : undefined,
    );
  return extremite === "arrivee"
    ? adresse.inconsistentIf(
        adresseRepetee,
        "Le départ et l’arrivée ont la même adresse : ce trajet n’existe pas. Corrigez l’une des deux.",
      )
    : adresse;
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
function precisionDuLieu(extremite: Extremite) {
  return question
    .text(QUESTIONS_DU_LIEU[extremite].precision, "Nature du lieu")
    .hint(
      "Elle s’inscrit sur le document. Par exemple : maison d’accueil hospitalière, foyer, lieu de travail.",
    )
    .askedIf(
      ({ answers, cibles, validated }) =>
        avecUnDocument(cibles) &&
        precisionAPoser(extremite, answers, validated),
    );
}

// La nature ne se choisit que si P2 ne l'établit pas, parmi celles que P2 et
// l'autre lieu admettent (`natureAdmise`).
function natureAChoisir(extremite: Extremite, label: string) {
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
  return (Object.keys(OPTIONS[id]) as Nature[]).reduce(
    (declaree, nature) =>
      declaree.option(nature, (option) => option.offeredIf(admise(nature))),
    question
      .singleChoice(id, label)
      .dropdown()
      .askedIf(
        ({ answers, cibles }) =>
          avecUnDocument(cibles) &&
          natureEtablie(extremite, answers) === undefined,
      ),
  );
}

// Un domicile n'a pas de nom à reporter. Tant que la nature manque, le nom
// attend.
function nomUtile(nature: string | undefined): boolean {
  return nature !== undefined && nature !== "1_DOMICILE";
}

function adresseRepetee({ answers, validated }: Contexte): boolean {
  const depart = validated.question("Q3.2.adresse").value;
  const arrivee = answers.question("Q3.3.adresse").value;
  return Boolean(depart && arrivee && memeAdresse(depart, arrivee));
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
