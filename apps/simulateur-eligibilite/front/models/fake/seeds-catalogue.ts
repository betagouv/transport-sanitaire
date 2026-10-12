// Le catalogue des seeds du modèle de démonstration.
//
// Chaque seed ouvre le questionnaire sur une page à montrer, ou sur un
// résultat. L'écran des seeds l'affiche, et le test de conformité la rejoue.

import type { Seed } from "../../socle/seeds/seed";
import type { Cibles } from "./declarations/cibles";
import type { Questions } from "./declarations/questions";

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
    id: "commande-de-the",
    label: "Résultat : un thé, avec lait et citron",
    description:
      "Ouvre le premier résultat d'une commande complète, d'où le complément se lance.",
    answers: { boisson: "the", accompagnements: ["lait", "citron"] },
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
];
