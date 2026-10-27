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
  natureEtablieDu,
  precisionAPoser,
  QUESTIONS_DU_LIEU,
} from "./lieux-du-trajet.ts";
import {
  ENTREES_DES_LIEUX,
  entreesDe,
  natureAdmise,
} from "./roles-des-lieux.ts";
import { avecUnDocument } from "./supports-du-complement.ts";

// La nature de l'autre lieu, vue de celui-ci. Le départ ne voit de l'arrivée
// que ce que P2 en établit : elle se choisit après lui.
const AUTRE_LIEU = {
  depart: natureEtablieDu("arrivee").compute((etablie) => etablie?.nature),
  arrivee: natureDu("depart"),
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

type Libelles = { nature: string; adresse: string; rappel: string };

// Le rappel coiffe la première question posée : le nom, ou l'adresse d'un
// domicile, qui n'en a pas.
function pageDuLieu(id: string, extremite: Extremite, libelles: Libelles) {
  const ids = QUESTIONS_DU_LIEU[extremite];
  const rappel = rappelDe(extremite, libelles.rappel);
  const nomUtile = natureDu(extremite).compute(unNomAReporter);
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
      natureEtablie(extremite, entreesDe(contexte.answers))?.nature ===
      "1_DOMICILE"
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
    const etablie = natureEtablie(extremite, entreesDe(answers));
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
    .mattersWhile(avecUnDocument.and(precisionAPoser(extremite)));
}

// La nature ne se choisit que si P2 ne l'établit pas, parmi celles que P2 et
// l'autre lieu admettent (`natureAdmise`).
function natureAChoisir(extremite: Extremite, label: string) {
  const id = QUESTIONS_DU_LIEU[extremite].nature;
  const admise = (nature: Nature) =>
    ENTREES_DES_LIEUX.computeWith(AUTRE_LIEU[extremite], (entrees, autre) =>
      natureAdmise(nature, extremite, entrees, autre),
    );
  const aChoisir = natureEtablieDu(extremite).compute(
    (etablie) => etablie === undefined,
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
