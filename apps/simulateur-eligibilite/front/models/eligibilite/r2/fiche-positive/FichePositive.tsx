// La fiche patient positive, à remettre au patient : la prescription médicale
// de transport et le formulaire S3141 (#135), puis les deux demandes d'accord
// préalable (#136). Le socle la pose sur sa feuille, sous les logos, son titre
// et sa raison. Le composant range un `TexteDeLaFichePositive` dans les blocs
// du socle ; il n'écrit aucun texte de l'éditeur.

import {
  IllustratedCards,
  NumberedSteps,
  Panel,
  SheetFollowUp,
} from "../../../../socle";
import { BlocDeConsigne } from "../BlocDeConsigne";
import { illustrationDuMode } from "../illustrations-des-modes";
import { TexteEnrichi } from "../TexteEnrichi";
import type { CarteAffichee } from "./cartes-et-badges";
import type { Consignes } from "./consignes-du-modus";
import type { TexteDeLaFichePositive } from "./texte-de-la-fiche-positive";

export function FichePositive({ texte }: { texte: TexteDeLaFichePositive }) {
  return (
    <>
      <Cartes cartes={texte.cartes} />
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
      <NumberedSteps
        titleLevel={4}
        steps={consignes.etapes.map((etape) => ({
          title: etape.titre,
          content: etape.blocs.map((bloc, rang) => (
            // Les blocs d'une étape ne changent jamais d'ordre.
            <BlocDeConsigne bloc={bloc} key={`${etape.numero}-${rang}`} />
          )),
        }))}
      />
    </section>
  );
}
