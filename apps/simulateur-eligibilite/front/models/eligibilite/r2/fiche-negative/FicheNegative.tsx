// Le contenu de la fiche patient négative (#134), à remettre au patient. Le
// socle la pose sur sa feuille, sous les logos, son titre et sa raison. Le
// composant range un `TexteDeLaFicheNegative` dans les blocs du socle ; il
// n'écrit aucun texte de l'éditeur.

import { IllustratedCards, Panel, SheetFollowUp } from "../../../../socle";
import { illustrationDuMode } from "../illustrations-des-modes";
import { TexteEnrichi } from "../TexteEnrichi";
import type { TexteDeLaFicheNegative } from "./texte-de-la-fiche-negative";

type Bloc = TexteDeLaFicheNegative["finance"];

export function FicheNegative({ texte }: { texte: TexteDeLaFicheNegative }) {
  return (
    <>
      <Cartes intro={texte.introDesCartes} cartes={texte.cartes} />
      <SheetFollowUp>
        <Consignes consignes={texte.consignes} />
        {texte.conseilAld && <ConseilAld texte={texte.conseilAld} />}
        <Panel variant="white" title={texte.finance.title} titleLevel={3}>
          <p>{texte.finance.text}</p>
        </Panel>
      </SheetFollowUp>
    </>
  );
}

// ---- implémentation ----

type CartesProps = { intro: Bloc; cartes: readonly Bloc[] };

function Cartes({ intro, cartes }: CartesProps) {
  return (
    <section aria-labelledby="cartes-titre">
      <h3 id="cartes-titre">{intro.title}</h3>
      <p>{intro.text}</p>
      <IllustratedCards
        cards={cartes.map((carte, rang) => ({
          title: carte.title,
          text: carte.text,
          image: illustrationDuMode(rang),
        }))}
        titleLevel={4}
      />
    </section>
  );
}

function Consignes({
  consignes,
}: {
  consignes: TexteDeLaFicheNegative["consignes"];
}) {
  return (
    <section aria-labelledby="consignes-titre">
      <h3 id="consignes-titre">{consignes.titre}</h3>
      {consignes.sousTitre && (
        <p className="fr-text--bold">{consignes.sousTitre}</p>
      )}
      <p>{consignes.texte}</p>
      {consignes.etapes.length > 0 && (
        <ol>
          {consignes.etapes.map((etape) => (
            <li key={etape}>{etape}</li>
          ))}
        </ol>
      )}
    </section>
  );
}

function ConseilAld({ texte }: { texte: string }) {
  return (
    <Panel
      variant="outlined"
      label="Information importante concernant les affections de longue durée"
    >
      <p>
        <TexteEnrichi texte={texte} />
      </p>
    </Panel>
  );
}
