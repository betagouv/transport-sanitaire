// La fiche patient positive, à remettre au patient : la prescription médicale
// de transport et le formulaire S3141 (#135), puis les deux demandes d'accord
// préalable (#136). Le titre du prescripteur et sa phrase sont au-dessus, dans
// la page que le socle compose. Le composant range un `TexteDeLaFichePositive`
// ; il n'écrit aucun texte de l'éditeur.

import { IllustratedCards } from "../../../../socle";
import { illustrationDuMode } from "../illustrations-des-modes";
import { TexteEnrichi } from "../TexteEnrichi";
import type { CarteAffichee } from "./cartes-et-badges";
import type { BlocDeConsigne, Consignes, Puce } from "./consignes-du-modus";
import type { TexteDeLaFichePositive } from "./texte-de-la-fiche-positive";

export function FichePositive({ texte }: { texte: TexteDeLaFichePositive }) {
  return (
    <article
      aria-label="Fiche explicative patient"
      className="fr-p-3w fr-mb-4w"
    >
      <h2 className="fr-h3">{texte.titreDuPatient}</h2>
      {texte.raison && <p className="fr-text--lead">{texte.raison}</p>}
      <Cartes cartes={texte.cartes} />
      <ConsignesDuPatient consignes={texte.consignes} />
      {texte.rappel && <Rappel texte={texte.rappel} />}
      <aside aria-labelledby="finance-titre" className="fr-callout">
        <h3 className="fr-callout__title" id="finance-titre">
          {texte.finance.title}
        </h3>
        <p className="fr-callout__text">{texte.finance.text}</p>
      </aside>
    </article>
  );
}

// ---- implémentation ----

// Le rappel d'attente de l'accord préalable : un encadré sans titre.
function Rappel({ texte }: { texte: string }) {
  return (
    <div className="fr-callout fr-callout--blue-ecume">
      <p className="fr-callout__text">{texte}</p>
    </div>
  );
}

// Les trois modes de transport, chacun avec son dessin ; celui du patient est
// marqué « Votre situation ».
function Cartes({ cartes }: { cartes: readonly CarteAffichee[] }) {
  return (
    <section aria-label="Les modes de transport ; votre situation est indiquée sur la carte concernée">
      <IllustratedCards
        cards={cartes.map((carte, rang) => ({
          title: carte.titre,
          text: carte.texte,
          image: illustrationDuMode(rang),
          selected: carte.retenue,
        }))}
        selectedLabel="Votre situation"
      />
    </section>
  );
}

function ConsignesDuPatient({ consignes }: { consignes: Consignes }) {
  return (
    <section aria-labelledby="consignes-titre">
      <h3 className="fr-h5" id="consignes-titre">
        {consignes.introduction}
      </h3>
      {consignes.complement.map((paragraphe) => (
        <p key={paragraphe}>
          <TexteEnrichi texte={paragraphe} />
        </p>
      ))}
      <div>
        {consignes.etapes.map((etape) => (
          <div className="fr-mb-2w" key={etape.numero}>
            <h4 className="fr-h6">
              {etape.numero}. {etape.titre}
            </h4>
            {etape.blocs.map((bloc, rang) => (
              // Les blocs d'une étape ne changent jamais d'ordre.
              <Bloc bloc={bloc} key={`${etape.numero}-${rang}`} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function Bloc({ bloc }: { bloc: BlocDeConsigne }) {
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
