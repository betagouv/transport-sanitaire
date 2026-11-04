// Un bloc d'une consigne des fiches patient : un paragraphe, ou une liste à
// puces, dont une puce peut introduire des badges.

import type { BlocDeConsigne as Bloc, Puce } from "./blocs-de-consigne";
import { TexteEnrichi } from "./TexteEnrichi";

export function BlocDeConsigne({ bloc }: { bloc: Bloc }) {
  if (bloc.type === "paragraphe") {
    return (
      <p>
        <TexteEnrichi texte={bloc.texte} />
      </p>
    );
  }
  return (
    <ul>
      {bloc.puces.map((puce) => (
        <li key={puce.texte}>
          <PuceDeConsigne puce={puce} />
        </li>
      ))}
    </ul>
  );
}

// ---- implémentation ----

// Une puce qui introduit des badges : sa légende, puis les besoins à signaler.
function PuceDeConsigne({ puce }: { puce: Puce }) {
  if (!puce.badges) return <TexteEnrichi texte={puce.texte} />;
  return (
    <>
      <TexteEnrichi texte={puce.texte} />
      <ul
        aria-label="Besoins particuliers à signaler lors de la réservation"
        className="fr-badges-group"
      >
        {puce.badges.map((badge) => (
          <li key={badge}>
            <p className="fr-badge">{badge}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
