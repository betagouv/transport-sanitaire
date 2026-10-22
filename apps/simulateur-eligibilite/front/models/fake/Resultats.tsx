// Les deux résultats du modèle de démonstration : la commande, puis la commande
// complétée.
//
// Le premier montre ce que le socle offre à une page de résultat : un encadré
// gris à éléments séparés, qui finit par un bloc dépliable, un encadré bleu qui
// ne s'affiche qu'avec une question, des cartes illustrées, et des étapes en
// cartes numérotées, trois ou deux par rangée. Le résultat sans commande
// montre la feuille à remettre : ses cartes illustrées, puis son bloc de suivi,
// avec un conseil bordé de bleu et un encadré blanc.

import type { ReactNode } from "react";
import type { GivenAnswers } from "../../../core/socle";
import {
  Disclosure,
  type FirstResult,
  type IllustratedCard,
  IllustratedCards,
  NumberedCards,
  Panel,
  SheetFollowUp,
} from "../../socle";
import { enUneLigne } from "./adresse";
import type { Cibles } from "./declarations/cibles";
import type { Questions } from "./declarations/questions";
import grandeTasse from "./illustrations/grande-tasse.svg";
import tasse from "./illustrations/tasse.svg";
import verreGlace from "./illustrations/verre-glace.svg";
import { SANS_COMMANDE } from "./preconisation";

type Props = { answers: GivenAnswers<Questions>; cibles: Cibles };

export function resultatDeLaCommande({ answers, cibles }: Props): FirstResult {
  if (cibles.commande === SANS_COMMANDE) return RIEN_A_SERVIR;
  return {
    title: "La commande est prête à être complétée",
    intro: `Commande : ${cibles.commande}.`,
    body: <PageDeLaCommande answers={answers} cibles={cibles} />,
  };
}

export function CommandeCompletee({ answers, cibles }: Props) {
  const adresse = answers.question("adresse");
  return (
    <>
      <p className="fr-text--lead">
        Commande : {cibles.commande},{" "}
        {String(answers.question("quantite").value)} tasses
      </p>
      {adresse.hasAnswer() && (
        <p>Facture à envoyer : {enUneLigne(adresse.value)}</p>
      )}
      <p>
        Le bon de commande est prêt à être imprimé. Il doit encore être signé
        avant d'être envoyé.
      </p>
    </>
  );
}

// ---- implémentation ----

// Deux étapes : les cartes se rangent sur deux colonnes. La feuille suit les
// boutons.
const RIEN_A_SERVIR: FirstResult = {
  title: "Rien à servir",
  intro: "Aucune boisson n'est commandée : il n'y a rien à compléter.",
  body: (
    <NumberedCards
      title="Que faire maintenant ?"
      items={[
        "Remettre la fiche ci-dessous au client.",
        "Faire une nouvelle simulation s'il change d'avis.",
      ]}
    />
  ),
  sheet: {
    title: "Votre commande est vide",
    intro: "Vous n'avez choisi aucune boisson : rien ne vous sera servi.",
    body: <FicheDuClient />,
  },
};

function FicheDuClient() {
  return (
    <>
      <section>
        <h3>Les façons de servir</h3>
        <IllustratedCards cards={SANS_FACON_CHOISIE} titleLevel={4} />
      </section>
      <SheetFollowUp>
        <section>
          <h3>Que pouvez-vous faire maintenant ?</h3>
          <p>Revenez au comptoir quand vous aurez choisi votre boisson.</p>
        </section>
        <Panel variant="outlined" label="Un conseil sur le lait">
          <p>
            <strong>Important :</strong> le lait tourne au contact du citron.
          </p>
        </Panel>
        <Panel variant="white" title="À propos des prix" titleLevel={3}>
          <p>La carte et ses prix sont affichés au comptoir.</p>
        </Panel>
      </SheetFollowUp>
    </>
  );
}

function PageDeLaCommande({ answers, cibles }: Props) {
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
      <IllustratedCards
        cards={facons(answers.question("service").checkedBoxes())}
        selectedLabel="Votre commande"
      />
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

// La façon de servir de la commande est retenue : la grande tasse ou le verre
// glacé s'ils sont demandés, la tasse sinon.
// Une commande vide n'a pas choisi sa façon de servir.
const SANS_FACON_CHOISIE = facons([]).map((facon) => ({
  ...facon,
  selected: false,
}));

function facons(service: readonly string[]): readonly IllustratedCard[] {
  const grande = service.includes("grande-tasse");
  const glacee = !grande && service.includes("glacee");
  return [
    {
      title: "En tasse",
      text: "La boisson chaude, servie à table.",
      image: tasse,
      selected: !grande && !glacee,
    },
    {
      title: "En grande tasse",
      text: "Le double de la tasse, pour les grandes soifs.",
      image: grandeTasse,
      selected: grande,
    },
    {
      title: "En verre glacé",
      text: "Servie froide, avec des glaçons.",
      image: verreGlace,
      selected: glacee,
    },
  ];
}

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
