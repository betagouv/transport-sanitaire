// Le catalogue des seeds du modèle de démonstration.
//
// Chaque seed ouvre le questionnaire sur une page à montrer, ou sur un
// résultat. L'écran des seeds l'affiche, et le test de conformité la rejoue.

import type { Seed } from "../../socle/seeds/seed";
import type { Cibles } from "./declarations/cibles";
import type { Questions } from "./declarations/questions";

// Une commande qui passe le premier résultat, pour ouvrir le complément.
const CAFE_SUCRE = {
  boisson: "cafe",
  accompagnements: ["sucre"],
  service: ["rien"],
} as const;

// La même, la première page du complément remplie.
const DEUX_TASSES = { ...CAFE_SUCRE, quantite: 2, lieu: "terrasse" } as const;

export const SEEDS: readonly Seed<Questions, Cibles>[] = [
  {
    id: "accompagnements-du-the",
    label: "Accompagnements : le citron se propose avec le thé",
    description:
      "S'arrête sur la page des accompagnements, après avoir choisi un thé : le libellé le reprend, et le citron se propose.",
    answers: { boisson: "the" },
    expected: {},
  },
  {
    id: "accompagnements-du-cafe",
    label: "Accompagnements : pas de citron avec le café",
    description:
      "S'arrête sur la page des accompagnements, après avoir choisi un café : le libellé change, et le citron ne se propose plus.",
    answers: { boisson: "cafe" },
    expected: {},
  },
  {
    id: "service-avec-citron",
    label: "Service : sans « Rien de particulier », à cause du citron",
    description:
      "S'arrête sur la façon de servir, après un thé au citron : l'option exclusive ne se propose pas, et l'aide liste les préparations du thé.",
    answers: { boisson: "the", accompagnements: ["citron"] },
    expected: {},
  },
  {
    id: "service-sans-accompagnement",
    label:
      "Service : rappel en une phrase, options incompatibles, aide dépliable",
    description:
      "S'arrête sur la façon de servir, après un café sans rien : un rappel redit la commande, « Très chaude » et « Glacée » s'excluent, et l'aide liste les préparations du café.",
    answers: { boisson: "cafe", accompagnements: ["aucun"] },
    expected: {},
  },
  {
    id: "commande-de-the",
    label: "Résultat : un thé, avec lait et citron",
    description:
      "Ouvre le premier résultat d'une commande complète, d'où le complément se lance.",
    answers: {
      boisson: "the",
      accompagnements: ["lait", "citron"],
      service: ["grande-tasse"],
    },
    expected: { commande: "thé, lait et citron", lait_tourne: true },
  },
  {
    id: "the-au-lait-citron-a-voir",
    label: "Résultat : un fait absent laisse une cible indéfinie",
    description:
      "Ouvre le résultat d'un thé au lait, avec « Peut-être du citron ». On ne sait pas s'il y aura du citron : le fait est absent, pas « non ». La mise en garde n'est donc pas décidée, et le résultat le dit. La trace de debug donne la provenance de chaque fait.",
    answers: {
      boisson: "the",
      accompagnements: ["lait", "citron-a-voir"],
      service: ["grande-tasse"],
    },
    expected: {
      commande: "thé, lait et peut-être du citron",
      lait_tourne: undefined,
    },
  },
  {
    id: "cafe-au-lait",
    label: "Résultat : une option impossible vaut « non »",
    description:
      "Ouvre le résultat d'un café au lait. Le citron ne se propose pas, parce qu'il ne se sert pas avec un café : le fait vaut « non », sans avoir été demandé. La mise en garde est décidée.",
    answers: {
      boisson: "cafe",
      accompagnements: ["lait"],
      service: ["rien"],
    },
    expected: { commande: "café, lait", lait_tourne: false },
  },
  {
    id: "the-au-lait",
    label: "Résultat : une option proposée et non cochée vaut « non »",
    description:
      "Ouvre le résultat d'un thé au lait. Le citron se proposait et n'a pas été coché : le fait vaut « non », et la mise en garde est décidée.",
    answers: {
      boisson: "the",
      accompagnements: ["lait"],
      service: ["rien"],
    },
    expected: { commande: "thé, lait", lait_tourne: false },
  },
  {
    id: "sans-commande",
    label: "Résultat : rien à servir",
    description:
      "Ouvre un premier résultat sans suite : aucun complément n'est proposé.",
    answers: { boisson: "rien" },
    expected: { commande: "aucune", lait_tourne: false },
  },
  {
    id: "complement-quantite",
    label:
      "Complément : rappel en valeurs, entier, liste déroulante, question facultative",
    description:
      "Passe le verrou et s'arrête sur la première page du complément : la commande et le service, rappelés au-dessus du champ, puis le nombre de tasses, le lieu du service et le nom.",
    answers: { ...CAFE_SUCRE, retrait: "sur-place" },
    // Sans lait, la mise en garde est décidée, citron connu ou non.
    expected: { commande: "café, sucre", lait_tourne: false },
  },
  {
    id: "complement-adresse-en-france",
    label: "Complément : adresse en France",
    description:
      "Passe le verrou et s'arrête sur l'adresse, la facture partant en France : des champs séparés, le nom du lieu, un code postal de cinq chiffres, pas de pays.",
    answers: { ...DEUX_TASSES, facturation: "france" },
    expected: { commande: "café, sucre" },
  },
  {
    id: "complement-adresse-a-l-etranger",
    label: "Complément : adresse à l'étranger",
    description:
      "S'arrête sur la même page, la facture partant à l'étranger : le pays est attendu, et le code postal est libre et facultatif. « Précédent » permet de changer de mode, adresse saisie.",
    answers: { ...DEUX_TASSES, facturation: "etranger" },
    expected: { commande: "café, sucre" },
  },
  {
    id: "complement-retrait",
    label: "Complément : réponse qui bloque, date bornée",
    description:
      "Passe le verrou et s'arrête sur le retrait : « En livraison » bloque, et le jour est borné. La page suivante porte le texte long. L'adresse, déjà donnée, est un objet.",
    answers: {
      ...DEUX_TASSES,
      facturation: "france",
      adresse: {
        placeName: "Café de la Gare",
        street: "3 rue des Lilas",
        postalCode: "75012",
        city: "Paris",
      },
    },
    expected: { commande: "café, sucre" },
  },
];
