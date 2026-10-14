// Le questionnaire de démonstration : une commande de boisson, sans rapport
// avec le transport sanitaire.
//
// Chaque capacité du socle y a sa page, pour la voir à l'écran. L'indication
// sous une question dit ce qu'elle démontre. Les tests du socle n'en dépendent
// pas : ils tournent sur leur propre modèle.

import type { QuestionnairePart } from "../../socle";
import type { Cibles } from "./declarations/cibles";
import type { Questions } from "./declarations/questions";
import { cibles, faits } from "./preconisation";
import { CRENEAU, EXPEDITION } from "./validation-croisee";

/** Modifiables tant que le résultat n'est pas verrouillé. */
export const PARTS: readonly QuestionnairePart<Questions, undefined>[] = [
  {
    id: "commande",
    title: "Questionnaire de démonstration",
    pages: [
      {
        id: "boisson",
        questions: [
          {
            id: "boisson",
            kind: "single choice",
            label: "Quelle boisson souhaitez-vous ?",
            hint: "Démontre : une description sous chaque option, et l'avance immédiate après un choix unique.",
            options: [
              {
                value: "the",
                label: "Un thé",
                description: "Servi en théière, à infuser trois minutes.",
              },
              {
                value: "cafe",
                label: "Un café",
                description: "Un expresso, servi court.",
              },
              {
                value: "rien",
                label: "Rien",
                description: "Le questionnaire s'arrête au premier résultat.",
              },
            ],
          },
        ],
      },
      {
        id: "accompagnements",
        questions: [
          {
            id: "accompagnements",
            kind: "multiple choice",
            label: "Avec quoi ?",
            labelFrom: ({ boisson }) =>
              boisson === "the"
                ? "Avec quoi, ce thé ?"
                : "Avec quoi, ce café ?",
            hint: "Démontre : un libellé de question et un libellé d'option qui dépendent des réponses (le lait devient « un nuage de lait » avec le thé), une option proposée selon la boisson (le citron, avec le thé seulement), et une option exclusive. Un fait a trois états. Le citron vaut « oui » s'il est coché, et « non » s'il se proposait sans l'être, ou avec un café, où il ne se sert pas. Avec « Peut-être du citron », on ne sait pas : le fait est absent, et le résultat ne décide pas si le lait tourne.",
            askedIf: (answers) =>
              answers.boisson !== undefined && answers.boisson !== "rien",
            dependsOn: ["boisson"],
            options: [
              {
                value: "lait",
                label: "Du lait",
                labelFrom: ({ boisson }) =>
                  boisson === "the" ? "Un nuage de lait" : "Du lait",
              },
              { value: "sucre", label: "Du sucre" },
              {
                value: "citron",
                label: "Une rondelle de citron",
                offeredIf: ({ boisson }) => boisson === "the",
              },
              {
                value: "citron-a-voir",
                label: "Peut-être du citron, à décider au service",
                offeredIf: ({ boisson }) => boisson === "the",
              },
            ],
            incompatibleOptions: [
              {
                values: ["citron", "citron-a-voir"],
                explanation:
                  "Le citron est demandé, ou reste à décider : seule la dernière case cochée est gardée.",
              },
            ],
            exclusiveOption: { value: "aucun", label: "Rien de plus" },
          },
        ],
      },
      {
        id: "service",
        questions: [
          {
            id: "service",
            kind: "multiple choice",
            label: "Comment la servir ?",
            reminderFrom: (answers, _, validated) =>
              `Rappel de la commande : ${cibles(faits(answers, validated)).commande}.`,
            hint: "Démontre : un rappel en une phrase au-dessus de la question (il redit des réponses déjà données, et ne demande rien : la commande est calculée en route, sur les questions validées), une aide dépliable sous son option (« Voir les préparations possibles », dont la liste dépend de la boisson), deux options incompatibles (« Très chaude » et « Glacée » : cocher l'une décoche l'autre, avec une explication), et une option exclusive conditionnelle (« Rien de particulier » ne se propose pas avec le citron, et change de libellé quand un accompagnement est choisi).",
            askedIf: (answers) =>
              answers.boisson !== undefined && answers.boisson !== "rien",
            dependsOn: ["boisson", "accompagnements"],
            options: [
              { value: "chaude", label: "Très chaude" },
              { value: "glacee", label: "Glacée" },
              { value: "grande-tasse", label: "Dans une grande tasse" },
              {
                value: "preparation",
                label: "Avec une préparation particulière",
                description: "À préciser au moment du service.",
                helpFrom: ({ boisson }) => ({
                  label: "Voir les préparations possibles",
                  items:
                    boisson === "the"
                      ? ["Infusé cinq minutes", "Avec une théière à part"]
                      : ["Allongé", "Serré", "Avec un verre d'eau"],
                }),
              },
            ],
            incompatibleOptions: [
              {
                values: ["chaude", "glacee"],
                explanation:
                  "Une boisson ne se sert pas à la fois très chaude et glacée : seule la dernière cochée est gardée.",
              },
            ],
            exclusiveOption: {
              value: "rien",
              label: "Rien de particulier",
              labelFrom: ({ accompagnements = [] }) =>
                accompagnements.includes("aucun")
                  ? "Rien de particulier"
                  : "Rien d'autre de particulier",
              offeredIf: ({ accompagnements = [] }) =>
                !accompagnements.includes("citron"),
            },
          },
        ],
      },
    ],
  },
];

/** Posée après le verrou : elle complète, elle ne décide plus. */
export const COMPLEMENT: QuestionnairePart<Questions, Cibles> = {
  id: "complement",
  title: "Compléter la commande",
  pages: [
    {
      id: "quantite",
      questions: [
        {
          id: "quantite",
          kind: "number",
          label: "Combien de tasses ?",
          reminderFrom: ({ service = [] }, { commande }) => [
            { label: "Commande", value: commande },
            {
              label: "Service",
              value: service.map((value) => SERVICES[value]).join(", "),
            },
          ],
          hint: "Démontre : un rappel en valeurs au-dessus du champ (la commande et le service, figés au verrou : ils se lisent, ils ne se modifient plus), un nombre entier, borné, avec son unité. Une décimale est refusée.",
          min: 1,
          integer: true,
          unit: "tasses",
        },
        {
          id: "lieu",
          kind: "single choice",
          dropdown: true,
          label: "Où la servir ?",
          hint: "Démontre : un choix unique en liste déroulante. La page garde son bouton.",
          options: [
            { value: "salle", label: "En salle" },
            { value: "terrasse", label: "En terrasse" },
            { value: "comptoir", label: "Au comptoir" },
          ],
        },
        {
          id: "nom",
          kind: "text",
          label: "À quel nom ?",
          hint: "Démontre : une question facultative. La page se valide sans elle.",
          optional: true,
        },
      ],
    },
    {
      id: "facturation",
      questions: [
        {
          id: "facturation",
          kind: "single choice",
          label: "Où envoyer la facture ?",
          hint: "Démontre : la réponse qui dit, à la page suivante, si l'adresse est en France ou à l'étranger.",
          options: [
            { value: "france", label: "En France" },
            { value: "etranger", label: "À l'étranger" },
          ],
        },
      ],
    },
    {
      id: "adresse",
      questions: [
        {
          id: "adresse",
          kind: "address",
          label: "À quelle adresse ?",
          hint: "Démontre : une adresse en champs séparés, avec le nom du lieu. En France, le code postal fait cinq chiffres. À l'étranger, d'après la page précédente, le pays est attendu, et le code postal est libre et facultatif. Chaque champ fautif porte son message. Revenir changer la page précédente garde l'adresse : elle se relit dans le nouveau mode.",
          withPlaceName: true,
          abroadIf: ({ facturation }) => facturation === "etranger",
        },
      ],
    },
    EXPEDITION,
    CRENEAU,
    {
      id: "retrait",
      questions: [
        {
          id: "retrait",
          kind: "single choice",
          label: "Comment la récupérer ?",
          hint: "Démontre : une réponse qui bloque. « En livraison » affiche un message, et la page ne se valide plus. Et une réponse qui contredit une page antérieure : « À emporter » ne va pas avec « En terrasse », choisi au lieu de service. Le message nomme la question à corriger, qu'on retrouve par « Précédent ».",
          options: [
            { value: "sur-place", label: "Sur place" },
            { value: "a-emporter", label: "À emporter" },
            {
              value: "livraison",
              label: "En livraison",
              blocks:
                "La livraison se commande à part. Choisissez une autre réponse pour finir cette commande, puis faites-en une seconde pour la livraison.",
            },
          ],
          inconsistenciesFrom: ({ lieu, retrait }) =>
            lieu === "terrasse" && retrait === "a-emporter"
              ? [
                  "« À emporter » ne va pas avec « En terrasse », choisi à la question « Où la servir ? ». Revenez par « Précédent » changer le lieu, ou choisissez « Sur place ».",
                ]
              : [],
        },
        {
          id: "jour",
          kind: "date",
          label: "Pour quel jour ?",
          hint: "Démontre : une date bornée, d'aujourd'hui à dans sept jours. Une date hors bornes est refusée.",
          boundsFrom: () => ({ min: dayFromToday(0), max: dayFromToday(7) }),
        },
      ],
    },
    {
      id: "remarque",
      questions: [
        {
          id: "remarque",
          kind: "long text",
          label: "Une remarque pour le service ?",
          hint: "Démontre : un texte sur plusieurs lignes. « Entrée » va à la ligne, sans valider la page.",
          optional: true,
        },
      ],
    },
  ],
};

// ---- implémentation ----

// Les façons de servir, telles qu'on les relit une fois la commande figée.
const SERVICES: Record<Questions["service"][number], string> = {
  chaude: "très chaude",
  glacee: "glacée",
  "grande-tasse": "dans une grande tasse",
  preparation: "avec une préparation particulière",
  rien: "rien de particulier",
};

/**
 * Le jour qu'il sera dans `days` jours, à l'heure locale, écrit comme la
 * réponse d'une date : `2026-10-12`.
 */
export function dayFromToday(days: number): string {
  const day = new Date();
  day.setDate(day.getDate() + days);
  const month = String(day.getMonth() + 1).padStart(2, "0");
  const date = String(day.getDate()).padStart(2, "0");
  return `${day.getFullYear()}-${month}-${date}`;
}
