// L'état du formulaire de rattachement : les champs saisis, et ce qu'on en
// déduit d'après les listes du référentiel.

import { useState } from "react";
import {
  type RattachementSaisi,
  saisieComplete,
} from "../../../shared/rattachement-saisi";
import type { Referentiel } from "../../../shared/referentiel";
import { decoderChoix } from "./choix";
import { estAutre, type Listes, useListes } from "./listes";
import type { Structure } from "./structures";

type Champs = {
  // La valeur choisie dans la première liste (voir `choix.ts`).
  choix: string;
  serviceId: string;
  serviceLibre: string;
  etabLibre: string;
};

// Ce qu'on déduit des champs : le rattachement tel qu'il partira à `onValide`,
// et ce que l'écran doit montrer.
export type Derivation = {
  saisie: RattachementSaisi;
  valide: boolean;
  // Un établissement du référentiel est choisi : la liste de ses services suit.
  etabChoisi: boolean;
  // Le service « Autre » d'un établissement : le nom du vrai service suit.
  serviceEstAutre: boolean;
  // « Autre établissement » : son nom et celui du service suivent.
  etabEstAutre: boolean;
  // La sélection suffit : le simulateur s'ouvre sans bouton. Faux pour une
  // saisie libre, dont on ne sait pas quand elle est finie.
  entreeImmediate: boolean;
  // La structure choisie, `null` pour un établissement.
  structure: Structure | null;
};

export type SaisieRattachement = Derivation &
  Listes & {
    champs: Champs;
    // Modifie un champ, et donne ce qu'on déduit de la saisie ainsi modifiée :
    // le formulaire entre dès la sélection, sans attendre le rendu suivant.
    modifier: (champ: keyof Champs, valeur: string) => Derivation;
  };

export function useSaisieRattachement(
  referentiel: Referentiel,
): SaisieRattachement {
  const [champs, setChamps] = useState<Champs>(CHAMPS_VIDES);
  const listes = useListes(referentiel, etabChoisiDans(champs.choix));

  return {
    ...listes,
    ...deriver(champs, listes),
    champs,
    modifier: (champ, valeur) => {
      const suivants = avecDependantsEffaces(
        { ...champs, [champ]: valeur },
        champ,
      );
      setChamps(suivants);
      return deriver(suivants, listes);
    },
  };
}

// ---- implémentation ----

function etabChoisiDans(choix: string): string {
  const decode = decoderChoix(choix);
  return decode?.type === "etablissement" ? decode.etabId : "";
}

// Sans référentiel, la saisie est le rattachement de repli, toujours complet.
function deriver(champs: Champs, listes: Listes): Derivation {
  if (listes.indisponible) {
    return { ...AUCUNE, saisie: RATTACHEMENT_DEGRADE, valide: true };
  }
  const choix = decoderChoix(champs.choix);
  switch (choix?.type) {
    case "etablissement":
      return deriverService(choix.etabId, champs, listes);
    case "structure":
      return deriverStructure(choix.serviceId, listes);
    case "autre-etablissement":
      return deriverEtablissementSaisi(champs);
    default:
      return AUCUNE;
  }
}

// Un établissement du référentiel : son service, puis le nom du vrai service
// sous « Autre ».
function deriverService(
  etabId: string,
  champs: Champs,
  listes: Listes,
): Derivation {
  const saisie: RattachementSaisi = { etabId };
  const service = listes.services.find((s) => s.id === champs.serviceId);
  if (!service) return { ...AUCUNE, saisie, etabChoisi: true };

  saisie.serviceId = service.id;
  const serviceEstAutre = estAutre(service.libelle);
  if (serviceEstAutre) {
    saisie.serviceEstAutre = true;
    saisie.serviceLibre = champs.serviceLibre;
  }
  return {
    ...AUCUNE,
    saisie,
    valide: saisieComplete(saisie),
    etabChoisi: true,
    serviceEstAutre,
    entreeImmediate: !serviceEstAutre,
  };
}

// Une structure : un service du fourre-tout, qui suffit. Son « Autre » n'est
// pas une saisie libre : il ouvre le simulateur comme les autres.
function deriverStructure(serviceId: string, listes: Listes): Derivation {
  const service = listes.structures.find((s) => s.id === serviceId);
  if (!service || !listes.fourreTout) return AUCUNE;
  return {
    ...AUCUNE,
    saisie: { etabId: listes.fourreTout.id, serviceId },
    valide: true,
    entreeImmediate: true,
    structure: service.libelle,
  };
}

// Un établissement absent de la liste : son nom et celui du service, sans id.
function deriverEtablissementSaisi(champs: Champs): Derivation {
  const saisie: RattachementSaisi = {
    etabId: "",
    etabEstAutre: true,
    etabLibre: champs.etabLibre,
    serviceLibre: champs.serviceLibre,
  };
  return {
    ...AUCUNE,
    saisie,
    valide: saisieComplete(saisie),
    etabEstAutre: true,
  };
}

// Changer un champ efface ce qui en dépend : tout le reste quand le premier
// choix change, `serviceLibre` quand le service change.
function avecDependantsEffaces(champs: Champs, modifie: keyof Champs): Champs {
  const dependants = DEPENDANTS[modifie];
  if (!dependants) return champs;
  return { ...champs, ...Object.fromEntries(dependants.map((c) => [c, ""])) };
}

const AUCUNE: Derivation = {
  saisie: { etabId: "" },
  valide: false,
  etabChoisi: false,
  serviceEstAutre: false,
  etabEstAutre: false,
  entreeImmediate: false,
  structure: null,
};

// Le rattachement de repli quand le référentiel ne répond pas. Le prescripteur
// entre quand même, et l'analytics range sa visite sous « autre ».
const RATTACHEMENT_DEGRADE: RattachementSaisi = {
  etabId: "autre",
  serviceId: "autre",
};

const CHAMPS_VIDES: Champs = {
  choix: "",
  serviceId: "",
  serviceLibre: "",
  etabLibre: "",
};

const DEPENDANTS: Partial<Record<keyof Champs, Array<keyof Champs>>> = {
  choix: ["serviceId", "serviceLibre", "etabLibre"],
  serviceId: ["serviceLibre"],
};
