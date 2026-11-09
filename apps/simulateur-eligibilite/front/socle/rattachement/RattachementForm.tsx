// Le formulaire de rattachement : l'établissement ou la structure, puis ce qui
// en découle.
//
// Chaque réponse dévoile le champ suivant, et le simulateur s'ouvre dès que le
// choix suffit : un service de la liste ou une structure. Une saisie libre
// garde un bouton, car on ne sait pas quand elle est finie. Le service n° 4 en
// garde un aussi : il a deux sorties. Le formulaire remonte la saisie à
// `onValide` et ne range rien lui-même : c'est `RattachementScreen`.
//
// Si le référentiel ne répond pas, il le dit et laisse entrer avec le
// rattachement dégradé « Autre / Autre ».

import {
  type Referentiel,
  snapshotReferentiel,
} from "../../../shared/referentiel";
import { DeveloperTools, ToolButton } from "../developer-tools";
import { Container, SelectField, TextField } from "../ui";
import { optionsDuChoix } from "./choix";
import type { Derivation, SaisieRattachement } from "./saisie-rattachement";
import { useSaisieRattachement } from "./saisie-rattachement";

/**
 * Ce que la validation emporte, en plus du rattachement saisi : l'écran à
 * ouvrir et l'accès aux developer tools. Toutes les entrées passent par le même
 * `onValide` : le rattachement est obligatoire quelle que soit la destination
 * (ADR-1).
 */
export type AccesRattachement = {
  destination: "simulateur" | "seeds";
  /** Le service sélectionné déverrouille les developer tools (service n° 4). */
  developerTools: boolean;
};

type Destination = AccesRattachement["destination"];

type Props = {
  referentiel?: Referentiel;
  onValide: (
    saisie: SaisieRattachement["saisie"],
    acces: AccesRattachement,
  ) => void;
};

export function RattachementForm({
  referentiel = snapshotReferentiel,
  onValide,
}: Props) {
  const saisie = useSaisieRattachement(referentiel);
  const { entrer, modifier } = entrees(saisie, onValide);

  return (
    <Container etroit sansMargeHaute>
      <h1 className="fr-h3">
        Faites une simulation pour prescrire le transport adapté
      </h1>
      <PhaseExperimentale />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          entrer(saisie, "simulateur");
        }}
      >
        <ProgressiveFields saisie={saisie} modifier={modifier} />
        <EntreesDansLApplication
          saisie={saisie}
          onEntrer={(destination) => entrer(saisie, destination)}
        />
      </form>
    </Container>
  );
}

// ---- implémentation ----

type Modifier = (
  champ: Parameters<SaisieRattachement["modifier"]>[0],
  valeur: string,
) => void;

type FieldsProps = { saisie: SaisieRattachement; modifier: Modifier };

// Les deux façons d'entrer : valider une dérivation (bouton), ou changer un
// champ quand la sélection suffit. Le simulateur s'ouvre alors sans bouton.
function entrees(saisie: SaisieRattachement, onValide: Props["onValide"]) {
  const entrer = (derivation: Derivation, destination: Destination) => {
    if (derivation.valide) {
      onValide(derivation.saisie, {
        destination,
        developerTools: derivation.developerTools,
      });
    }
  };
  const modifier: Modifier = (champ, valeur) => {
    const suite = saisie.modifier(champ, valeur);
    if (suite.entreeImmediate) entrer(suite, "simulateur");
  };
  return { entrer, modifier };
}

// Chaque réponse dévoile le champ suivant (workflow §4). Sans référentiel, il
// n'y a rien à choisir : l'écran le dit, et le rattachement est celui de repli.
function ProgressiveFields(props: FieldsProps) {
  if (props.saisie.indisponible) return <ReferentielIndisponible />;
  return (
    <>
      <ChoixField {...props} />
      <ServiceField {...props} />
      <EtablissementLibreField {...props} />
      <ServiceLibreField {...props} />
    </>
  );
}

function ReferentielIndisponible() {
  return (
    <div className="fr-alert fr-alert--warning fr-alert--sm fr-mb-2w">
      <p>
        La liste des établissements est momentanément indisponible. Vous pouvez
        tout de même accéder au simulateur.
      </p>
    </div>
  );
}

// L'emoji est décoratif : les lecteurs d'écran ne le lisent pas.
function PhaseExperimentale() {
  return (
    <p>
      <span aria-hidden="true">🙏</span> Phase expérimentale : partagez vos
      retours via le bouton orange « Faire une remarque », à droite ou « Donner
      mon avis » en haut de l'écran
    </p>
  );
}

// Choisir dans cette liste peut ouvrir le simulateur, sans aide qui l'annonce
// (RGAA 7.4) : le porteur l'a retirée (#367).
function ChoixField({ saisie, modifier }: FieldsProps) {
  return (
    <SelectField
      id="etablissement"
      label="Établissement"
      placeholder="Sélectionnez un établissement"
      value={saisie.champs.choix}
      options={optionsDuChoix(saisie.etablissements, saisie.structures)}
      onChange={(v) => modifier("choix", v)}
    />
  );
}

function ServiceField({ saisie, modifier }: FieldsProps) {
  if (!saisie.etabChoisi) return null;
  return (
    <SelectField
      id="service"
      label="Nom du service"
      placeholder="Sélectionnez le nom de votre service"
      value={saisie.champs.serviceId}
      options={saisie.services.map((s) => ({ value: s.id, label: s.libelle }))}
      onChange={(v) => modifier("serviceId", v)}
    />
  );
}

function EtablissementLibreField({ saisie, modifier }: FieldsProps) {
  if (!saisie.etabEstAutre) return null;
  return (
    <TextField
      id="etablissement-libre"
      label="Renseignez le nom de votre établissement"
      value={saisie.champs.etabLibre}
      onChange={(v) => modifier("etabLibre", v)}
    />
  );
}

function ServiceLibreField({ saisie, modifier }: FieldsProps) {
  if (!saisie.serviceEstAutre && !saisie.etabEstAutre) return null;
  return (
    <TextField
      id="service-libre"
      label="Renseignez le nom de votre service"
      value={saisie.champs.serviceLibre}
      onChange={(v) => modifier("serviceLibre", v)}
    />
  );
}

// Le bouton n'existe que quand la sélection ne suffit pas : sans référentiel,
// pour une saisie libre, et pour le service n° 4, qui a deux sorties
// (simulateur et seeds). Les deux passent par le même `onValide` (ADR-1).
function EntreesDansLApplication({
  saisie,
  onEntrer,
}: {
  saisie: SaisieRattachement;
  onEntrer: (destination: Destination) => void;
}) {
  const bouton =
    saisie.indisponible ||
    saisie.serviceEstAutre ||
    saisie.etabEstAutre ||
    saisie.developerTools;
  if (!bouton) return null;
  return (
    <>
      <div
        className="fr-btns-group fr-btns-group--inline"
        style={{ marginTop: "2rem" }}
      >
        <button type="submit" className="fr-btn" disabled={!saisie.valide}>
          Accéder au simulateur
        </button>
      </div>
      {saisie.developerTools && <DeveloperToolsPanel onEntrer={onEntrer} />}
    </>
  );
}

// L'écran des seeds est hors des actions normales. Son bouton apparaît une fois
// le service n° 4 choisi, donc une fois la saisie complète. Les seeds vivent
// dans `seeds/`, pas ici.
function DeveloperToolsPanel({
  onEntrer,
}: {
  onEntrer: (destination: Destination) => void;
}) {
  return (
    <DeveloperTools>
      <ToolButton onClick={() => onEntrer("seeds")}>Seeds</ToolButton>
    </DeveloperTools>
  );
}
