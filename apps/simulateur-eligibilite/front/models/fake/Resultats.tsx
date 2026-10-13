// Les deux résultats du modèle de démonstration : la commande, puis la commande
// complétée.

import type { Address, Answers } from "../../socle";
import type { Cibles } from "./declarations/cibles";
import type { Questions } from "./declarations/questions";

type Props = { answers: Answers<Questions>; cibles: Cibles };

export function Commande({ cibles }: Props) {
  return (
    <>
      <p className="fr-text--lead">Commande : {cibles.commande}</p>
      <MiseEnGarde tourne={cibles.lait_tourne} />
    </>
  );
}

export function CommandeCompletee({ answers, cibles }: Props) {
  return (
    <>
      <p className="fr-text--lead">
        Commande : {cibles.commande}, {String(answers.quantite)} tasses
      </p>
      {answers.adresse && (
        <p>Facture à envoyer : {enUneLigne(answers.adresse)}</p>
      )}
    </>
  );
}

// ---- implémentation ----

// Une adresse est un objet : ses champs se lisent un par un.
function enUneLigne(adresse: Address): string {
  const { placeName, street, complement, postalCode, city, country } = adresse;
  const commune = [postalCode, city].filter(Boolean).join(" ");
  return [placeName, street, complement, commune, country]
    .filter(Boolean)
    .join(", ");
}

// Une cible indéfinie n'est pas une décision : elle ne s'affiche ni comme un
// « oui », ni comme un « non ».
function MiseEnGarde({ tourne }: { tourne: Cibles["lait_tourne"] }) {
  if (tourne === false) return null;
  return (
    <p>
      {tourne
        ? "Attention : le lait tourne au contact du citron."
        : "Lait et citron : rien n'est décidé. On ne sait pas encore s'il y aura du citron, et ce n'est pas un « non »."}
    </p>
  );
}
