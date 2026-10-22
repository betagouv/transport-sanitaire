// Ce que le socle attend d'une version du modèle : son métier
// (`core/socle/model.ts`), et ce qu'il affiche, ses deux résultats.
//
// Le socle déroule le parcours et ne lit aucune clé du modèle. Il transporte les
// réponses, les faits et les cibles de l'un à l'autre.

import type { ComponentType, ReactNode } from "react";
import type { AnyFaits, CoreModel } from "../../core/socle/model";
import type {
  AnyCibles,
  AnyQuestions,
} from "../../core/socle/questionnaire-engine/question";
import type { Reading } from "../../core/socle/questionnaire-engine/questionnaire";
import type { BoundCerfa } from "./cerfa-mapping";

/**
 * Ce qu'un résultat reçoit pour s'afficher : les réponses, les questions
 * validées, et les cibles.
 */
type ResultatProps<Questions extends AnyQuestions, Cibles> = Pick<
  Reading<Questions>,
  "answers" | "validated"
> & { cibles: Cibles };

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
};

/**
 * La feuille à remettre au patient, que le socle pose sur une A4 sous les
 * logos : son titre, sa phrase d'introduction, puis son contenu.
 */
export type Sheet = { title: string; intro?: ReactNode; body: ReactNode };

/**
 * Ce que le mapping du cerfa lit : tout ce que le simulateur sait. Les
 * réponses, les faits et les cibles figés au verrou, et la date de complétion.
 */
export type CerfaInput<
  Questions extends AnyQuestions = AnyQuestions,
  Faits extends AnyFaits = AnyFaits,
  Cibles = AnyCibles,
> = ResultatProps<Questions, Cibles> & { faits: Faits; completedAt: Date };

export type Model<
  Questions extends AnyQuestions = AnyQuestions,
  Faits extends AnyFaits = AnyFaits,
  Cibles extends AnyCibles = AnyCibles,
> = {
  /** Le métier : les questions, la préconisation, les seeds. */
  core: CoreModel<Questions, Faits, Cibles>;
  /** Le premier résultat, après les parties du questionnaire. */
  result: {
    /** Le titre du stepper, au-dessus du `h1` que le résultat donne. */
    title: string;
    /**
     * Le résultat de ces réponses. Une promesse quand il charge ses textes :
     * elle ne rejette pas, un échec de chargement est un résultat comme un
     * autre.
     */
    content: (
      props: ResultatProps<Questions, Cibles>,
    ) => FirstResult | Promise<FirstResult>;
  };
  /** Le second résultat, après le complément : le cerfa. */
  cerfa: {
    /** Le cerfa de cette préconisation. `null` : rien ne suit le premier résultat. */
    form: (
      cibles: Cibles,
    ) => BoundCerfa<CerfaInput<Questions, Faits, Cibles>> | null;
    title: string;
    Resultat: ComponentType<ResultatProps<Questions, Cibles>>;
    /**
     * Le libellé de l'action qui verrouille. `null` : cette préconisation ne
     * complète rien, le bouton n'est pas posé. Il ne l'est pas non plus tant que
     * le complément n'a ni page ni cerfa : le verrou n'ouvre pas un écran vide.
     */
    startLabel: (cibles: Cibles) => string | null;
    downloadLabel: string;
  };
};

/**
 * Vérifie un modèle contre ses propres types, puis le donne tel que le socle le
 * voit : sans nom de question, de fait ni de cible.
 */
export function defineModel<
  Questions extends AnyQuestions,
  Faits extends AnyFaits,
  Cibles extends AnyCibles,
>(model: Model<Questions, Faits, Cibles>): Model {
  // Le socle ne lit aucune clé : il redonne au modèle ce que le modèle lui a
  // donné. L'effacement des types est donc sans risque, et il n'a lieu qu'ici.
  return model as unknown as Model;
}
