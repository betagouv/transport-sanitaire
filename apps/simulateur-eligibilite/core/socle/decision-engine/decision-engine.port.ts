// Le port du moteur de décision : ce que le socle et les modèles attendent pour
// passer des faits aux cibles. Publicodes en est l'adaptateur
// (`publicodes-decision-engine.adapter.ts`).

/**
 * Ce que des règles calculent pour des faits. Chaque cible peut rester
 * inconnue, faute d'un fait dont elle dépend : ce n'est pas une décision.
 */
export interface DecisionEngine<Faits, Cibles> {
  /** Toutes les cibles de ces faits : la préconisation. */
  cibles(faits: Faits): Cibles;
  /** Une seule cible de ces faits, quand le questionnaire en a besoin en route. */
  cible<Nom extends keyof Cibles>(faits: Faits, nom: Nom): Cibles[Nom];
  /**
   * Les cibles de ces faits, chacune calculée à sa première lecture : celles
   * qu'une garde lit en route, sans payer les autres.
   */
  lazyCibles(faits: Faits): Cibles;
}
