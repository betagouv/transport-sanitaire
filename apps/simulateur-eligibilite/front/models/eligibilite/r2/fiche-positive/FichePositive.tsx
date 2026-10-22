// La fiche patient positive, à remettre au patient : la prescription médicale
// de transport et le formulaire S3141 (#135), puis les deux demandes d'accord
// préalable (#136). Le socle la pose sur sa feuille, sous les logos, son titre
// et sa raison. Le composant range un `TexteDeLaFichePositive` dans les blocs
// du socle ; il n'écrit aucun texte de l'éditeur.

import { IllustratedCards, Panel, SheetFollowUp } from "../../../../socle";
import { illustrationDuMode } from "../illustrations-des-modes";
import { TexteEnrichi } from "../TexteEnrichi";
import type { CarteAffichee } from "./cartes-et-badges";
import type { BlocDeConsigne, Consignes, Puce } from "./consignes-du-modus";
import type { RappelDAttente } from "./fondement-de-l-accord-prealable";
import type { TexteDeLaFichePositive } from "./texte-de-la-fiche-positive";

export function FichePositive({ texte }: { texte: TexteDeLaFichePositive }) {
  return (
    <>
      <Cartes cartes={texte.cartes} />
      <SheetFollowUp>
        <ConsignesDuPatient consignes={texte.consignes} />
        {texte.rappel && <Rappel rappel={texte.rappel} />}
        <Panel variant="white" title={texte.finance.title} titleLevel={3}>
          <p>{texte.finance.text}</p>
        </Panel>
      </SheetFollowUp>
    </>
  );
}

// ---- implémentation ----

// Le rappel d'attente de l'accord préalable : un aparté bordé de bleu.
function Rappel({ rappel }: { rappel: RappelDAttente }) {
  return (
    <Panel variant="outlined" label={rappel.nom}>
      <p>{rappel.texte}</p>
    </Panel>
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
      <h3 id="consignes-titre">{consignes.introduction}</h3>
      {consignes.complement.map((paragraphe) => (
        <p key={paragraphe}>
          <TexteEnrichi texte={paragraphe} />
        </p>
      ))}
      <div>
        {consignes.etapes.map((etape) => (
          <div className="fr-mb-2w" key={etape.numero}>
            <h4>
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
