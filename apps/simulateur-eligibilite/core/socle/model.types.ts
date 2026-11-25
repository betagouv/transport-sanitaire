// Ce que le socle attend du métier d'un modèle : ses questions, avant et après
// le verrou, ce qui calcule la préconisation, ses seeds, et ce que disent ses
// deux résultats : ce qu'ils lisent, le document qu'ils choisissent et ses
// valeurs, le besoin du prescripteur. Rien ne s'y affiche : l'écran du modèle
// (`front/socle/model.types.ts`) s'y ajoute.
//
// Le socle déroule le parcours et ne lit aucune clé du modèle. Il transporte les
// réponses, les faits et les cibles de l'un à l'autre (`simulation/`).

import type { CerfaDto, CerfaMapping } from "./cerfa/index.ts";
import type { DecisionGraphData } from "./decision-engine/index.ts";
import type {
  AnyCibles,
  AnyQuestions,
  GivenAnswers,
  QuestionnairePart,
  Reading,
  Reads,
  Relevance,
  ValidatedAnswers,
} from "./questionnaire-engine/index.ts";

import type { Seed } from "./simulation/index.ts";

/**
 * Ce que le prescripteur est venu faire : vérifier une éligibilité
 * (`check`), ou aller jusqu'au document quand la situation le permet
 * (`prescribe`).
 */
export type Intent = "check" | "prescribe";

/** Les faits d'un modèle : ce que ses règles reçoivent. */
export type AnyFaits = Readonly<Record<string, unknown>>;

/**
 * Les documents qu'un modèle peut compléter : le DTO de chacun, par sa clé (le
 * support). Le métier dit ce que vaut chaque entrée ; l'écran dit où elle
 * s'écrit, pour la même clé et le même DTO.
 */
export type AnyDocuments = Readonly<Record<string, CerfaDto>>;

/**
 * Le métier d'un modèle. `FirstReading` est ce que lit son premier résultat,
 * `CerfaReading` ce que lit le texte du second, `Documents` le DTO de chaque
 * document, `Resultat` ce que le premier résultat calcule en donnée.
 */
export type CoreModel<
  Questions extends AnyQuestions = AnyQuestions,
  Faits extends AnyFaits = AnyFaits,
  Cibles extends AnyCibles = AnyCibles,
  FirstReading = unknown,
  CerfaReading = unknown,
  Documents extends AnyDocuments = AnyDocuments,
  Resultat = unknown,
> = {
  /**
   * Ce qui calcule la préconisation : des réponses aux faits, puis aux cibles.
   * Les faits lisent aussi les questions validées : une réponse possible qui ne
   * s'est pas proposée n'a pas été refusée.
   */
  preconisation: {
    faits: (
      answers: GivenAnswers<Questions>,
      validated: ValidatedAnswers<Questions>,
      relevance?: Relevance,
    ) => Faits;
    cibles: (faits: Faits) => Cibles;
    /**
     * Ce que lit chaque fait, ceux qu'impose la décision compris
     * (`FaitCatalogue.readsWith`) : ce qu'une question change s'y lit.
     */
    reads: ReadonlyMap<string, Reads>;
  };
  /** Les parties d'avant le verrou, qui mènent au premier résultat. */
  questionnaire: readonly QuestionnairePart<Questions, undefined>[];
  /** La partie d'après le verrou, qui complète le cerfa. */
  complement: QuestionnairePart<Questions, Cibles>;
  /** Le catalogue des seeds, chargé à la demande. */
  seeds: () => Promise<readonly Seed<Questions, Cibles>[]>;
  /**
   * Le graphe de décision des règles. Avec lui, une question dont la
   * réponse ne change rien de ce qui compte ne se pose pas.
   */
  decision?: {
    graph: DecisionGraphData;
    /** Les faits qu'impose la décision : la complétude. */
    imposed: readonly (keyof Faits & string)[];
    /** Les faits de ces questions validées, sauf ceux qu'impose la décision. */
    faits: (validated: ValidatedAnswers<Questions>) => Faits;
  };
  /** Le premier résultat, après les parties du questionnaire. */
  result: {
    /** Ce que le résultat lit des questions validées, en une valeur. */
    reading: Reading<FirstReading>;
    /**
     * Le résultat de cette lecture, en donnée, quand le modèle sait le calculer
     * sans écran. Une promesse : ses textes se chargent à la demande.
     */
    compute?: (reading: FirstReading) => Promise<Resultat>;
  };
  /** Le second résultat, après le complément : le document. */
  cerfa: {
    /**
     * Le document que cette préconisation complète, par sa clé. `null` : rien
     * ne suit le premier résultat. Il lit ce que lit le DTO de chaque
     * document, quand il le choisit.
     */
    document: Reading<(keyof Documents & string) | null>;
    /** Ce que vaut chaque entrée du DTO de chaque document, par sa clé. */
    values: { readonly [Key in keyof Documents]: CerfaMapping<Documents[Key]> };
    /**
     * Le titre du second résultat, selon le document que la préconisation
     * donne : celui de son stepper, qui est le `h1` de la page.
     */
    title: Reading<string>;
    /**
     * Ce que le texte du second résultat et ce qui tient la place de l'aperçu
     * lisent des questions validées, des faits et des cibles, en une valeur.
     */
    reading: Reading<CerfaReading>;
    /**
     * Le libellé de l'action qui verrouille. `null` : cette préconisation ne
     * complète rien. Il ne se pose pas non plus tant que le complément n'a ni
     * page ni document.
     */
    startLabel: Reading<string | null>;
    /**
     * Les questions du complément dont la réponse s'écrit telle quelle dans un
     * texte strict du document, chacune vers son entrée du DTO : leur saisie a
     * un compteur, mesuré sur le document. Sans elles, aucun compteur.
     */
    measured?: Readonly<Record<string, string>>;
  };
  /**
   * Ce que le prescripteur est venu faire, d'après les questions validées.
   * `null` : on ne le sait pas. L'avis n'est alors pas proposé, et le journal
   * des parcours n'en reçoit rien. Ce qu'il lit compte.
   */
  intent?: Reading<Intent | null>;
  /**
   * Ce qu'une question change de ce qui compte, que calcule
   * `CoreModelFactory.define` d'après le graphe et ce que lisent les résultats.
   * Sans graphe de décision, rien : toute question se pose.
   */
  relevance?: Relevance;
};

/**
 * Ce que le parcours lit du métier : ses questions, ce qui calcule la
 * préconisation, ses seeds, rien de ses résultats.
 */
export type SimulationModel<
  Questions extends AnyQuestions = AnyQuestions,
  Faits extends AnyFaits = AnyFaits,
  Cibles extends AnyCibles = AnyCibles,
> = Pick<
  CoreModel<Questions, Faits, Cibles>,
  "preconisation" | "questionnaire" | "complement" | "seeds" | "relevance"
>;

/** Un métier de modèle tel qu'on le déclare : sans sa pertinence, calculée. */
export type CoreModelDeclaration<
  Questions extends AnyQuestions = AnyQuestions,
  Faits extends AnyFaits = AnyFaits,
  Cibles extends AnyCibles = AnyCibles,
  FirstReading = unknown,
  CerfaReading = unknown,
  Documents extends AnyDocuments = AnyDocuments,
  Resultat = unknown,
> = Omit<
  CoreModel<
    Questions,
    Faits,
    Cibles,
    FirstReading,
    CerfaReading,
    Documents,
    Resultat
  >,
  "relevance"
>;
