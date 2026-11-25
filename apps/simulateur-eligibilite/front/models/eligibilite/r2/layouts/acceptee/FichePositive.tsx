// La fiche patient positive, à remettre au patient : la prescription médicale
// de transport et le formulaire S3141, puis les deux demandes d'accord
// préalable. Le socle la pose sur sa feuille, sous les logos, son titre,
// le mode d'un trajet en ligne régulière et sa raison. Le composant range un
// `TexteDeLaFichePositive` dans les blocs du socle ; il n'écrit aucun texte de
// l'éditeur.

import type {
  PartieTerrestre,
  TexteDeLaFichePositive,
} from "../../../../../../core/models/eligibilite/r2/acceptee/texte";
import type { CarteAffichee } from "../../../../../../core/models/eligibilite/r2/blocs/cartes-et-badges";
import type { Consignes } from "../../../../../../core/models/eligibilite/r2/blocs/consignes-du-modus";
import {
  IllustratedCards,
  NumberedSteps,
  Panel,
  SheetFollowUp,
} from "../../../../../socle";
import { BlocDeConsigne } from "../../components/BlocDeConsigne";
import { illustrationDuMode } from "../../components/illustrations-des-modes";
import { TexteEnrichi } from "../../components/TexteEnrichi";

export function FichePositive({ texte }: { texte: TexteDeLaFichePositive }) {
  return (
    <>
      {texte.partieTerrestre && <p>{texte.partieTerrestre.mode}</p>}
      <Cartes cartes={texte.cartes} />
      {texte.partieTerrestre && (
        <EtapesTerrestres partie={texte.partieTerrestre} />
      )}
      <SheetFollowUp>
        <ConsignesDuPatient consignes={texte.consignes} />
        <Panel variant="white" title={texte.finance.title} titleLevel={3}>
          <p>{texte.finance.text}</p>
        </Panel>
      </SheetFollowUp>
    </>
  );
}

// ---- implémentation ----

// Les étapes de la partie terrestre d'un trajet en ligne régulière, à part
// des consignes de l'accord préalable (R01).
function EtapesTerrestres({ partie }: { partie: PartieTerrestre }) {
  return (
    <section aria-labelledby="partie-terrestre-titre">
      <h3 id="partie-terrestre-titre">{partie.titre}</h3>
      <Etapes etapes={partie.etapes} />
    </section>
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
      <Etapes etapes={consignes.etapes} />
    </section>
  );
}

function Etapes({ etapes }: { etapes: Consignes["etapes"] }) {
  return (
    <NumberedSteps
      titleLevel={4}
      steps={etapes.map((etape) => ({
        title: etape.titre,
        content: etape.blocs.map((bloc, rang) => (
          // Les blocs d'une étape ne changent jamais d'ordre.
          <BlocDeConsigne bloc={bloc} key={`${etape.numero}-${rang}`} />
        )),
      }))}
    />
  );
}
