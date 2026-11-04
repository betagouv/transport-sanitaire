// Les questions d'un lieu du trajet, départ (Q3.2) ou arrivée (Q3.3) : la
// nature du lieu, son nom, sa nature en toutes lettres s'il le faut, son
// adresse. Une nature que P2 établit se rappelle sans se redemander
// (`conditions/lieux-du-trajet.ts`). Aucune distance ne se compare aux
// adresses.

import type {
  Address,
  Answered,
  Condition,
} from "../../../../../socle/index.ts";
import { type Context as Contexte, given, question } from "../../question.ts";
import {
  aLEtranger,
  type Extremite,
  natureDu,
  natureEtablie,
  natureEtablieDu,
  precisionAPoser,
  type QuestionDeNature,
} from "../conditions/lieux-du-trajet.ts";
import { NATURES_DU_LIEU, type Nature } from "../conditions/natures-du-lieu.ts";
import {
  desRolesContradictoires,
  ENTREES_DES_LIEUX,
  entreesDe,
  natureAdmise,
} from "../conditions/roles-des-lieux.ts";
import { avecUnDocument } from "../conditions/supports-du-complement.ts";

/** Les libellés propres à un lieu. */
export type Libelles = { nature: string; adresse: string; rappel: string };

// Les identifiants des questions de chaque lieu.
const QUESTIONS_DU_LIEU = {
  depart: {
    nature: "Q3.2.nature",
    nom: "Q3.2.nom",
    precision: "Q3.2.precision",
    adresse: "Q3.2.adresse",
  },
  arrivee: {
    nature: "Q3.3.nature",
    nom: "Q3.3.nom",
    precision: "Q3.3.precision",
    adresse: "Q3.3.adresse",
  },
} as const;

/** Ce que l'arrivée lit du départ : sa nature et son adresse. */
type Depart = {
  readonly nature: QuestionDeNature;
  readonly adresse: Answered<Address>;
};

// Deux situations de P2 se contredisent sur un lieu (TS1014-AUDIT-02).
const ROLES_CONTRADICTOIRES = ENTREES_DES_LIEUX.compute(
  desRolesContradictoires,
);

/**
 * Les quatre questions du lieu. L'arrivée reçoit le départ, qu'elle lit. Le
 * rappel coiffe la première question posée : le nom, ou l'adresse d'un
 * domicile, qui n'en a pas.
 */
export function questionsDuLieu<E extends Extremite>(
  extremite: E,
  libelles: Libelles,
  depart?: Depart,
) {
  const rappel = rappelDe(extremite, libelles.rappel);
  const nature = natureAChoisir(extremite, libelles.nature, depart);
  const nomUtile = natureDu(extremite, nature).compute(unNomAReporter);
  return {
    nature,
    nom: question
      .text(QUESTIONS_DU_LIEU[extremite].nom, "Nom du lieu ou de la structure")
      .optional()
      .mattersWhile(avecUnDocument.and(nomUtile))
      .reminderFrom(rappel),
    precision: precisionDuLieu(extremite, nature),
    adresse: adresseDuLieu(extremite, libelles.adresse, rappel, depart),
  };
}

// ---- implémentation ----

// L'adresse d'un domicile porte le rappel, faute de nom. Celle de l'arrivée
// ne répète pas celle du départ.
function adresseDuLieu<E extends Extremite>(
  extremite: E,
  label: string,
  rappel: ReturnType<typeof rappelDe>,
  depart: Depart | undefined,
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
  return depart
    ? adresse.inconsistentWhen(
        memeAdresseQue(depart.adresse, adresse),
        "Le départ et l’arrivée ont la même adresse : ce trajet n’existe pas. Corrigez l’une des deux.",
      )
    : adresse.inconsistentWhen(
        ROLES_CONTRADICTOIRES,
        "Les réponses précédentes donnent au départ ou à l’arrivée deux lieux différents. Revenez par « Précédent » pour les corriger.",
      );
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
function precisionDuLieu<E extends Extremite>(
  extremite: E,
  nature: QuestionDeNature,
) {
  return question
    .text(QUESTIONS_DU_LIEU[extremite].precision, "Nature du lieu")
    .hint(
      "Elle s’inscrit sur le document. Par exemple : maison d’accueil hospitalière, foyer, lieu de travail.",
    )
    .mattersWhile(avecUnDocument.and(precisionAPoser(extremite, nature)));
}

// La nature ne se choisit que si P2 ne l'établit pas, parmi celles que P2 et
// l'autre lieu admettent (`natureAdmise`).
function natureAChoisir<E extends Extremite>(
  extremite: E,
  label: string,
  depart: Depart | undefined,
) {
  const autre = autreLieu(depart);
  const admise = (nature: Nature) =>
    ENTREES_DES_LIEUX.computeWith(autre, (entrees, autre) =>
      natureAdmise(nature, extremite, entrees, autre),
    );
  const aChoisir = natureEtablieDu(extremite).compute(
    (etablie) => etablie === undefined,
  );
  return (Object.keys(NATURES_DU_LIEU) as Nature[]).reduce(
    (declaree, nature) =>
      declaree.option(nature, (option) => option.offeredWhen(admise(nature))),
    question
      .singleChoice(QUESTIONS_DU_LIEU[extremite].nature, label)
      .options(NATURES_DU_LIEU)
      .dropdown()
      .mattersWhile(avecUnDocument.and(aChoisir)),
  );
}

// La nature de l'autre lieu, vue de celui-ci. Le départ ne voit de l'arrivée
// que ce que P2 en établit : elle se choisit après lui.
function autreLieu(depart: Depart | undefined) {
  return depart
    ? natureDu("depart", depart.nature)
    : natureEtablieDu("arrivee").compute((etablie) => etablie?.nature);
}

// Le départ et l'arrivée ont la même adresse.
function memeAdresseQue(
  depart: Answered<Address>,
  arrivee: Answered<Address>,
): Condition {
  return given
    .question(depart)
    .answer()
    .computeWith(given.question(arrivee).answer(), (a, b) =>
      Boolean(a.value && b.value && memeAdresse(a.value, b.value)),
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
