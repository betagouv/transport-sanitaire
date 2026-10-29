// Le contenu de la fiche patient négative (#134), à remettre au patient. Le
// socle la pose sur sa feuille, sous les logos, son titre et sa raison. Le
// composant range un `TexteDeLaFicheNegative` dans les blocs du socle ; il
// n'écrit aucun texte de l'éditeur. Ni cartes ni encadré bleu (TS1014-J05) :
// ce que l'Assurance Maladie ne rembourse pas, puis les règles de la
// prescription et le « Le saviez-vous ? ».

import { Panel, SheetFollowUp } from "../../../../socle";
import { BlocDeConsigne } from "../BlocDeConsigne";
import { TexteEnrichi } from "../TexteEnrichi";
import type { TexteDeLaFicheNegative } from "./texte-de-la-fiche-negative";

export function FicheNegative({ texte }: { texte: TexteDeLaFicheNegative }) {
  const information = texte.informationInstitutionnelle;
  return (
    <>
      <Panel variant="green" label={information.title}>
        <p>
          <TexteEnrichi texte={information.title} />
        </p>
        <ul>
          {information.items.map((item) => (
            <li key={item}>
              <TexteEnrichi texte={item} />
            </li>
          ))}
        </ul>
      </Panel>
      <SheetFollowUp>
        <Consignes consignes={texte.consignes} />
        <Panel variant="white" title={texte.finance.title} titleLevel={3}>
          <p>{texte.finance.text}</p>
        </Panel>
      </SheetFollowUp>
    </>
  );
}

// ---- implémentation ----

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
      {consignes.blocs.map((bloc, rang) => (
        // Les blocs ne changent jamais d'ordre.
        <BlocDeConsigne bloc={bloc} key={`bloc-${rang}`} />
      ))}
    </section>
  );
}
