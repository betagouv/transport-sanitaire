// Ce que le socle attend d'une version du modèle : son métier
// (`core/socle/model.ts`), et ce qu'il affiche, ses deux résultats.
//
// Le socle déroule le parcours et ne lit aucune clé du modèle. Il transporte les
// réponses, les faits et les cibles de l'un à l'autre, et donne à chaque
// résultat ce qu'il déclare lire.

import type { ComponentType, ReactNode } from "react";
import type { AnyFaits, CoreModel } from "../../core/socle/model";
import {
  NOTHING,
  readsOf,
  type Value,
} from "../../core/socle/questionnaire-engine/condition";
import {
  type AnyCibles,
  type AnyQuestions,
  pagesOf,
} from "../../core/socle/questionnaire-engine/question";
import { Relevance } from "../../core/socle/questionnaire-engine/relevance";
import type { BoundCerfa } from "./cerfa-mapping";

/**
 * Ce qu'un résultat reçoit pour s'afficher : ce qu'il lit des questions
 * validées, des faits et des cibles (son `reading`), que le socle a calculé. Il
 * ne lit rien d'autre : ce qu'il lit se sait sans le dérouler (#254, #260).
 */
export type ResultatProps<Reading = unknown> = {
  readonly reading: Reading;
};

/**
 * Ce que le premier résultat donne au socle, qui compose la page : le `h1`,
 * une introduction, puis le corps, et la feuille à remettre au patient s'il en
 * a une. Les boutons sont au socle : sous le corps, ou au-dessus de la feuille.
 */
export type FirstResult = {
  title: string;
  intro?: ReactNode;
  body?: ReactNode;
  sheet?: Sheet;
  /**
   * Rien ne suit ce résultat, quoi que donne `cerfa.startLabel` : il n'a pas
   * pu conclure. Ni étape suivante ni complétion.
   */
  terminal?: boolean;
};

/**
 * La feuille à remettre au patient, que le socle pose sur une A4 sous les
 * logos : son titre, sa phrase d'introduction, puis son contenu.
 */
export type Sheet = { title: string; intro?: ReactNode; body: ReactNode };

/**
 * Ce que reçoit ce qui tient la place de l'aperçu du cerfa : ce que reçoit le
 * second résultat, sur les faits et les cibles figés au verrou, et la date de
 * complétion. Ce jour est celui que `given.today()` lit.
 */
export type CerfaInput<Reading = unknown> = ResultatProps<Reading> & {
  readonly completedAt: Date;
};

/**
 * Ce que le prescripteur est venu faire : vérifier une éligibilité
 * (`check`), ou aller jusqu'au document quand la situation le permet
 * (`prescribe`).
 */
export type Intent = "check" | "prescribe";

/**
 * L'invitation à donner son avis, après un résultat (#195) : un lien vers
 * l'adresse exacte, sans paramètre, ouvert dans un nouvel onglet. Le socle la
 * place selon ce que le prescripteur est venu faire : en R2 s'il vérifie ou si
 * rien ne se complète, en R3 une fois le document prêt.
 */
export type Feedback = {
  url: string;
  label: string;
  /**
   * Ce qu'il est venu faire, d'après les questions validées. `null` : on ne le
   * sait pas, l'avis n'est pas proposé. Ce qu'il lit compte (#255).
   */
  intent: Value<Intent | null>;
};

export type Model<
  Questions extends AnyQuestions = AnyQuestions,
  Faits extends AnyFaits = AnyFaits,
  Cibles extends AnyCibles = AnyCibles,
  FirstReading = unknown,
  CerfaReading = unknown,
> = {
  /** Le métier : les questions, la préconisation, les seeds. */
  core: CoreModel<Questions, Faits, Cibles>;
  /** Le premier résultat, après les parties du questionnaire. */
  result: {
    /** Le titre du stepper, au-dessus du `h1` que le résultat donne. */
    title: string;
    /** Ce que le résultat lit des questions validées, en une valeur. */
    reading: Value<FirstReading>;
    /**
     * Le résultat de ces réponses. Une promesse quand il charge ses textes :
     * elle ne rejette pas, un échec de chargement est un résultat comme un
     * autre.
     */
    content: (
      props: ResultatProps<FirstReading>,
    ) => FirstResult | Promise<FirstResult>;
  };
  /** Le second résultat, après le complément : le cerfa. */
  cerfa: {
    /**
     * Le cerfa de cette préconisation. `null` : rien ne suit le premier
     * résultat. Le choix lit ce qu'il déclare, comme chaque entrée du cerfa.
     */
    form: Value<BoundCerfa | null>;
    /**
     * Le titre du second résultat, selon le document que la préconisation
     * donne : celui de son stepper, qui est le `h1` de la page.
     */
    title: Value<string>;
    /**
     * Ce que le texte du second résultat et ce qui tient la place de l'aperçu
     * lisent des questions validées, des faits et des cibles, en une valeur.
     */
    reading: Value<CerfaReading>;
    /** Le texte du second résultat, sous le stepper, avant les boutons. */
    Resultat: ComponentType<ResultatProps<CerfaReading>>;
    /**
     * Ce qui tient la place de l'aperçu du document, pour un cerfa que son PDF
     * ne remplit pas encore. Sans lui, ou s'il donne `null`, l'aperçu du PDF.
     */
    standIn?: (props: CerfaInput<CerfaReading>) => ReactNode;
    /**
     * Le libellé de l'action qui verrouille. `null` : cette préconisation ne
     * complète rien, le bouton n'est pas posé. Il ne l'est pas non plus tant que
     * le complément n'a ni page ni cerfa : le verrou n'ouvre pas un écran vide.
     */
    startLabel: Value<string | null>;
    /** Les libellés des deux actions sur le cerfa, qui portent le même PDF. */
    printLabel: string;
    downloadLabel: string;
  };
  /** L'invitation à donner son avis. Sans elle, aucune. */
  feedback?: Feedback;
  /** L'indicateur de parcours ALD. Sans lui, aucun verdict ne part. */
  aldIndicator?: AldIndicator;
};

/**
 * L'indicateur de parcours ALD (#148) : à chaque arrivée sur le premier
 * résultat, le socle compte les pages et les questions posées dans ces parties,
 * et envoie un verdict à Matomo. Ce qu'il lit ne fait poser aucune question :
 * la mesure suit le parcours, elle ne le change pas.
 */
export type AldIndicator = {
  /** Les parties comptées, par leur `id`. */
  parts: readonly string[];
  /** Au plus autant de pages, et autant de questions. */
  limit: number;
  /** Le parcours est-il un parcours ALD ? Sinon, aucun verdict. */
  counted: Value<boolean>;
  /** Finit-il à la caisse, sans conclusion sur le droit ? */
  caisse: Value<boolean>;
};

/**
 * Vérifie un modèle contre ses propres types, puis le donne tel que le socle le
 * voit : sans nom de question, de fait ni de cible. Avec un graphe de décision,
 * il y ajoute ce qu'une question change de ce que lisent ses résultats (#255).
 */
export function defineModel<
  Questions extends AnyQuestions,
  Faits extends AnyFaits,
  Cibles extends AnyCibles,
  FirstReading,
  CerfaReading,
>(model: Model<Questions, Faits, Cibles, FirstReading, CerfaReading>): Model {
  // Le socle ne lit aucune clé : il redonne au modèle ce que le modèle lui a
  // donné. L'effacement des types est donc sans risque, et il n'a lieu qu'ici.
  return withRelevance(model as unknown as Model);
}

// ---- implémentation ----

function withRelevance(model: Model): Model {
  const { core, result, cerfa } = model;
  if (!core.decision) return model;
  const shown = [result.reading, cerfa.form, cerfa.title, cerfa.reading]
    .concat(cerfa.startLabel, model.feedback?.intent ?? [])
    .map((value) => value.reads)
    .reduce(readsOf, NOTHING);
  const relevance = new Relevance({
    graph: core.decision.graph,
    pages: [...pagesOf(core.questionnaire), ...core.complement.pages],
    faits: {
      reads: core.preconisation.reads,
      imposed: core.decision.imposed,
      of: core.decision.faits,
    },
    shown,
  });
  return { ...model, core: { ...core, relevance } };
}
