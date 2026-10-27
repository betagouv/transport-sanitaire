// Les pages du départ (Q3.2) et de l'arrivée (Q3.3) : la nature du lieu, son
// nom, sa nature en toutes lettres s'il le faut, son adresse. Une nature que
// P2 établit se rappelle sans se redemander (`lieux-du-trajet.ts`). Aucune
// distance ne se compare aux adresses.

import { type Address, page } from "../../../socle/index.ts";
import { OPTIONS } from "../declarations/questions.ts";
import { type Context as Contexte, given, question } from "../question.ts";
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

// Ce que lit la nature que P2 établit (`roles-des-lieux.ts`), en attendant que
// ces règles s'écrivent en conditions (#246).
const CE_QUE_P2_ETABLIT = [
  "Q1.3",
  "Q2.1",
  "Q2.1.g",
  "Q2.2.1",
  "Q2.2.1.a",
  "Q2.2.1.b",
  "Q2.5",
  "Q2.6",
  "Q2.7",
  "Q2.8.5",
  "Q2.8.6.a",
  "Q2.13.depart",
  "Q3.1.2",
] as const;

const REPONSES_DE_P2 = given.answers(...CE_QUE_P2_ETABLIT);

// La nature de l'autre lieu, vue de celui-ci. Le départ ne voit de l'arrivée
// que ce que P2 en établit : elle se choisit après lui.
const AUTRE_LIEU = {
  depart: REPONSES_DE_P2.compute(
    (reponses) => natureEtablie("arrivee", reponses)?.nature,
  ),
  arrivee: reponsesDu("depart").compute((reponses) =>
    natureDu("depart", reponses, reponses),
  ),
};

const ADRESSE_REPETEE = given
  .question("Q3.2.adresse")
  .answer()
  .computeWith(given.question("Q3.3.adresse").answer(), (depart, arrivee) =>
    Boolean(
      depart.value && arrivee.value && memeAdresse(depart.value, arrivee.value),
    ),
  );

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

// Les réponses dont P2 tire les lieux, et la nature choisie de ce lieu.
function reponsesDu(extremite: Extremite) {
  return given.answers(
    ...CE_QUE_P2_ETABLIT,
    QUESTIONS_DU_LIEU[extremite].nature,
  );
}

type Libelles = { nature: string; adresse: string; rappel: string };

// Le rappel coiffe la première question posée : le nom, ou l'adresse d'un
// domicile, qui n'en a pas.
function pageDuLieu(id: string, extremite: Extremite, libelles: Libelles) {
  const ids = QUESTIONS_DU_LIEU[extremite];
  const rappel = rappelDe(extremite, libelles.rappel);
  const nomUtile = reponsesDu(extremite).compute((reponses) =>
    unNomAReporter(natureDu(extremite, reponses, reponses)),
  );
  return page(
    id,
    natureAChoisir(extremite, libelles.nature),
    question
      .text(ids.nom, "Nom du lieu ou de la structure")
      .optional()
      .mattersWhile(avecUnDocument.and(nomUtile))
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
    .mattersWhile(avecUnDocument)
    .abroadIf(({ answers }) => aLEtranger(extremite, answers))
    .reminderFrom((contexte) =>
      natureEtablie(extremite, contexte.answers)?.nature === "1_DOMICILE"
        ? rappel(contexte)
        : undefined,
    );
  return extremite === "arrivee"
    ? adresse.inconsistentWhen(
        ADRESSE_REPETEE,
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
  const aPoser = reponsesDu(extremite).compute((reponses) =>
    precisionAPoser(extremite, reponses, reponses),
  );
  return question
    .text(QUESTIONS_DU_LIEU[extremite].precision, "Nature du lieu")
    .hint(
      "Elle s’inscrit sur le document. Par exemple : maison d’accueil hospitalière, foyer, lieu de travail.",
    )
    .mattersWhile(avecUnDocument.and(aPoser));
}

// La nature ne se choisit que si P2 ne l'établit pas, parmi celles que P2 et
// l'autre lieu admettent (`natureAdmise`).
function natureAChoisir(extremite: Extremite, label: string) {
  const id = QUESTIONS_DU_LIEU[extremite].nature;
  const admise = (nature: Nature) =>
    REPONSES_DE_P2.computeWith(AUTRE_LIEU[extremite], (reponses, autre) =>
      natureAdmise(nature, extremite, reponses, autre),
    );
  const aChoisir = REPONSES_DE_P2.compute(
    (reponses) => natureEtablie(extremite, reponses) === undefined,
  );
  return (Object.keys(OPTIONS[id]) as Nature[]).reduce(
    (declaree, nature) =>
      declaree.option(nature, (option) => option.offeredWhen(admise(nature))),
    question
      .singleChoice(id, label)
      .dropdown()
      .mattersWhile(avecUnDocument.and(aChoisir)),
  );
}

// Un domicile n'a pas de nom à reporter. Tant que la nature manque, le nom
// attend.
function unNomAReporter(nature: Nature | undefined): boolean {
  return nature !== undefined && nature !== "1_DOMICILE";
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
