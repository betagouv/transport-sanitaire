// Le port du choix du prescripteur sur la mesure d'audience : ce que Matomo et
// le journal des parcours attendent avant de rien envoyer. Le CMS en est
// l'adaptateur (`cms-consent.adapter.ts`). Voir docs/knowledge/adr/analytics.md,
// ADR-5.

export type Consent = "suivi" | "refus";

export interface ConsentSource {
  /** Appelle `onChoice` au choix connu, puis à chaque changement. */
  follow(onChoice: (choice: Consent) => void): void;
}
