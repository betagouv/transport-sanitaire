// Ce que le socle attend d'une version du modèle : son métier
// (`core/socle/model.ts`), et ce qu'il affiche, ses deux résultats.
//
// Le socle déroule le parcours et ne lit aucune clé du modèle. Il transporte les
// réponses, les faits et les cibles de l'un à l'autre.

import type { ComponentType, ReactNode } from "react";
import type { AnyFaits, CoreModel } from "../../core/socle/model";
import type { Value } from "../../core/socle/questionnaire-engine/condition";
import type { GivenAnswers } from "../../core/socle/questionnaire-engine/given-answers";
import type {
  AnyCibles,
  AnyQuestions,
} from "../../core/socle/questionnaire-engine/question";
import type { BoundCerfa } from "./cerfa-mapping";

/**
 * Ce qu'un résultat reçoit pour s'afficher : les cibles, les faits, et ce qu'il
 * lit des questions validées (son `reading`), que le socle a calculé. Il ne lit
 * rien d'autre : ce qu'il lit se sait sans le dérouler (#254).
 */
export type ResultatProps<
  Faits = AnyFaits,
  Cibles = AnyCibles,
  Reading = unknown,
> = {
  readonly cibles: Cibles;
  readonly faits: Faits;
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
export type CerfaInput<
  Faits extends AnyFaits = AnyFaits,
  Cibles = AnyCibles,
  Reading = unknown,
> = ResultatProps<Faits, Cibles, Reading> & { readonly completedAt: Date };

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
export type Feedback<Questions extends AnyQuestions = AnyQuestions> = {
  url: string;
  label: string;
  /** `null` : on ne sait pas ce qu'il est venu faire, l'avis n'est pas proposé. */
  intent: (answers: GivenAnswers<Questions>) => Intent | null;
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
      props: ResultatProps<Faits, Cibles, FirstReading>,
    ) => FirstResult | Promise<FirstResult>;
  };
  /** Le second résultat, après le complément : le cerfa. */
  cerfa: {
    /** Le cerfa de cette préconisation. `null` : rien ne suit le premier résultat. */
    form: (cibles: Cibles) => BoundCerfa | null;
    /**
     * Le titre du second résultat, selon le document que la préconisation
     * donne : celui de son stepper, qui est le `h1` de la page.
     */
    title: (cibles: Cibles) => string;
    /**
     * Ce que le texte du second résultat et ce qui tient la place de l'aperçu
     * lisent des questions validées, en une valeur.
     */
    reading: Value<CerfaReading>;
    /** Le texte du second résultat, sous le stepper, avant les boutons. */
    Resultat: ComponentType<ResultatProps<Faits, Cibles, CerfaReading>>;
    /**
     * Ce qui tient la place de l'aperçu du document, pour un cerfa que son PDF
     * ne remplit pas encore. Sans lui, ou s'il donne `null`, l'aperçu du PDF.
     */
    standIn?: (props: CerfaInput<Faits, Cibles, CerfaReading>) => ReactNode;
    /**
     * Le libellé de l'action qui verrouille. `null` : cette préconisation ne
     * complète rien, le bouton n'est pas posé. Il ne l'est pas non plus tant que
     * le complément n'a ni page ni cerfa : le verrou n'ouvre pas un écran vide.
     */
    startLabel: (cibles: Cibles) => string | null;
    /** Les libellés des deux actions sur le cerfa, qui portent le même PDF. */
    printLabel: string;
    downloadLabel: string;
  };
  /** L'invitation à donner son avis. Sans elle, aucune. */
  feedback?: Feedback<Questions>;
};

/**
 * Vérifie un modèle contre ses propres types, puis le donne tel que le socle le
 * voit : sans nom de question, de fait ni de cible.
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
  return model as unknown as Model;
}
