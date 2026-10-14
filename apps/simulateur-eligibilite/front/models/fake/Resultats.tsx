// Les deux résultats du modèle de démonstration : la commande, puis la commande
// complétée.

import type { Answers } from "../../socle";
import { enUneLigne } from "./adresse";
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
      <p>
        Le bon de commande est prêt à être imprimé. Il doit encore être signé
        avant d'être envoyé.
      </p>
    </>
  );
}

// ---- implémentation ----

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
