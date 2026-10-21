// Les deux résultats du modèle de démonstration : la commande, puis la commande
// complétée.
//
// Le premier montre ce que le socle offre à une page de résultat : un encadré
// gris à éléments séparés, qui finit par un bloc dépliable, un encadré bleu qui
// ne s'affiche qu'avec une question, des cartes illustrées, et des étapes en
// cartes numérotées, trois ou deux par rangée.

import type { ReactNode } from "react";
import {
  type Answers,
  Disclosure,
  type FirstResult,
  type IllustratedCard,
  IllustratedCards,
  NumberedCards,
  Panel,
} from "../../socle";
import { enUneLigne } from "./adresse";
import type { Cibles } from "./declarations/cibles";
import type { Questions } from "./declarations/questions";
import grandeTasse from "./illustrations/grande-tasse.svg";
import tasse from "./illustrations/tasse.svg";
import verreGlace from "./illustrations/verre-glace.svg";
import { SANS_COMMANDE } from "./preconisation";

type Props = { answers: Answers<Questions>; cibles: Cibles };

export function resultatDeLaCommande({ cibles }: Props): FirstResult {
  if (cibles.commande === SANS_COMMANDE) return RIEN_A_SERVIR;
  return {
    title: "La commande est prête à être complétée",
    intro: `Commande : ${cibles.commande}.`,
    body: <PageDeLaCommande cibles={cibles} />,
  };
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

// Deux étapes : les cartes se rangent sur deux colonnes.
const RIEN_A_SERVIR: FirstResult = {
  title: "Rien à servir",
  intro: "Aucune boisson n'est commandée : il n'y a rien à compléter.",
  body: (
    <NumberedCards
      title="Que faire maintenant ?"
      items={[
        "Proposer la carte au client.",
        "Faire une nouvelle simulation s'il change d'avis.",
      ]}
    />
  ),
};

function PageDeLaCommande({ cibles }: { cibles: Cibles }) {
  return (
    <>
      <Pourquoi cibles={cibles} />
      {cibles.lait_tourne === undefined && (
        <Panel variant="blue" title="Questions à poser au service">
          <ul>
            <li>Le thé sera-t-il servi avec du citron ?</li>
          </ul>
        </Panel>
      )}
      <h2 className="fr-h5 fr-mt-5w">Les façons de servir</h2>
      <IllustratedCards cards={FACONS_DE_SERVIR} />
      <NumberedCards
        title="Que faire maintenant ?"
        items={[
          "Vérifier la commande avec le client.",
          "Compléter la quantité et le retrait.",
          "Télécharger et imprimer le bon de commande.",
        ]}
      />
    </>
  );
}

// L'encadré gris : la commande, la mise en garde, puis ce que la commande a
// pris en compte, déplié.
function Pourquoi({ cibles }: { cibles: Cibles }) {
  return (
    <Panel variant="grey" title="Pourquoi ce résultat ?" divided>
      <Element titre="La commande">
        Les réponses demandent : {cibles.commande}.
      </Element>
      <MiseEnGarde tourne={cibles.lait_tourne} />
      <Disclosure summary="Ce que la commande a pris en compte">
        <ul>
          <li>Boisson : {cibles.commande}</li>
          <li>Lait et citron : {etatDuLait(cibles.lait_tourne)}</li>
        </ul>
      </Disclosure>
    </Panel>
  );
}

const FACONS_DE_SERVIR: readonly IllustratedCard[] = [
  {
    title: "En tasse",
    text: "La boisson chaude, servie à table.",
    image: tasse,
  },
  {
    title: "En grande tasse",
    text: "Le double de la tasse, pour les grandes soifs.",
    image: grandeTasse,
  },
  {
    title: "En verre glacé",
    text: "Servie froide, avec des glaçons.",
    image: verreGlace,
  },
];

// Une cible indéfinie n'est pas une décision : elle ne s'affiche ni comme un
// « oui », ni comme un « non ».
function MiseEnGarde({ tourne }: { tourne: Cibles["lait_tourne"] }) {
  if (tourne === false) return null;
  return (
    <Element titre="Lait et citron">
      {tourne
        ? "Attention : le lait tourne au contact du citron."
        : "Lait et citron : rien n'est décidé. On ne sait pas encore s'il y aura du citron, et ce n'est pas un « non »."}
    </Element>
  );
}

function etatDuLait(tourne: Cibles["lait_tourne"]): string {
  if (tourne === undefined) return "non décidé";
  return tourne ? "le lait tourne" : "rien à craindre";
}

function Element({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="fr-text--md fr-text--bold fr-mb-1v">{titre}</h3>
      <p className="fr-mb-0">{children}</p>
    </div>
  );
}
