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
    label: "Service : options incompatibles, aide dépliable",
    description:
      "S'arrête sur la façon de servir, après un café sans rien : « Très chaude » et « Glacée » s'excluent, et l'aide liste les préparations du café.",
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
    expected: { commande: "thé, lait et citron" },
  },
  {
    id: "sans-commande",
    label: "Résultat : rien à servir",
    description:
      "Ouvre un premier résultat sans suite : aucun complément n'est proposé.",
    answers: { boisson: "rien" },
    expected: { commande: "aucune" },
  },
  {
    id: "complement-quantite",
    label: "Complément : entier, liste déroulante, question facultative",
    description:
      "Passe le verrou et s'arrête sur la première page du complément : le nombre de tasses, le lieu du service et le nom.",
    answers: { ...CAFE_SUCRE, retrait: "sur-place" },
    expected: { commande: "café, sucre" },
  },
  {
    id: "complement-retrait",
    label: "Complément : réponse qui bloque, date bornée",
    description:
      "Passe le verrou et s'arrête sur le retrait : « En livraison » bloque, et le jour est borné. La page suivante porte le texte long.",
    answers: { ...CAFE_SUCRE, quantite: 2, lieu: "terrasse" },
    expected: { commande: "café, sucre" },
  },
];
