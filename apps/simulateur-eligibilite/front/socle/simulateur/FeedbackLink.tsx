// L'invitation à donner son avis (#195, COR-13 de la v10.1.3) : un lien que le
// modèle nomme et adresse. Il ouvre l'adresse exacte, sans rien y ajouter,
// dans un nouvel onglet que les lecteurs d'écran entendent annoncer. Rien ne
// l'ouvre seul. Il ne s'imprime pas. C'est un bouton de la barre d'actions
// (V02) : à droite, juste avant la complétion quand elle est offerte.
//
// | Ce que le prescripteur est venu faire | Le résultat se complète | R2 | R3 |
// |---|---|---|---|
// | vérifier | non | oui | sans objet |
// | vérifier | oui | oui | oui, une fois le document prêt |
// | prescrire | non | oui | sans objet |
// | prescrire | oui | non | oui, une fois le document prêt |
//
// Sans intention connue, aucun lien : on ne la suppose pas.

import type { Read } from "../../../core/socle/questionnaire-engine/condition";
import type { Intent, Model } from "../model";
import "./feedback-link.css";

/** L'avis que le modèle propose pour ces réponses. `null` : aucun. */
export type FeedbackOffer = { url: string; label: string; intent: Intent };

export function feedbackOf(model: Model, read: Read) {
  const { feedback } = model;
  if (!feedback) return null;
  const intent = read(feedback.intent);
  return intent && { url: feedback.url, label: feedback.label, intent };
}

/** L'avis sous le premier résultat : pas quand un document est à préparer. */
export function onFirstResult(
  offer: FeedbackOffer | null,
  completes: boolean,
): FeedbackOffer | null {
  return offer?.intent === "check" || !completes ? offer : null;
}

export function FeedbackLink({ offer }: { offer: FeedbackOffer }) {
  return (
    <a
      className="fr-btn socle-feedback__link fr-no-print"
      href={offer.url}
      target="_blank"
      rel="noopener noreferrer"
      referrerPolicy="no-referrer"
    >
      {offer.label}
      <span className="fr-sr-only"> (nouvel onglet)</span>
    </a>
  );
}
