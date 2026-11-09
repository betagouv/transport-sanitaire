// Les listes du référentiel que l'écran affiche : les établissements (sans le
// fourre-tout), les structures (certains services du fourre-tout), et les
// services de l'établissement choisi. Un échec de l'une marque le référentiel
// indisponible.

import { useEffect, useState } from "react";
import type {
  Etablissement,
  Referentiel,
  Service,
} from "../../../shared/referentiel";
import { estEtablissementFourreTout, structuresAffichees } from "./structures";

export type Listes = {
  etablissements: Etablissement[];
  structures: Service[];
  // L'établissement fourre-tout, que porte le rattachement d'une structure.
  fourreTout: Etablissement | null;
  services: Service[];
  indisponible: boolean;
};

export function useListes(referentiel: Referentiel, etabId: string): Listes {
  const [tete, setTete] = useState<Tete>(TETE_VIDE);
  const [services, setServices] = useState<Service[]>([]);
  const [indisponible, setIndisponible] = useState(false);

  useEffect(() => {
    chargerTete(referentiel)
      .then(setTete)
      .catch(() => setIndisponible(true));
  }, [referentiel]);

  // La liste des services se vide d'abord, pour ne pas montrer ceux de
  // l'établissement précédent pendant l'appel réseau.
  useEffect(() => {
    setServices([]);
    if (etabId) {
      referentiel
        .listerServices(etabId)
        .then((l) => setServices(triParLibelle(l)))
        .catch(() => setIndisponible(true));
    }
  }, [referentiel, etabId]);

  return { ...tete, services, indisponible };
}

/** « Autre » (service non listé) : reconnu à son libellé. */
export function estAutre(libelle: string): boolean {
  return libelle.trim().toLowerCase() === "autre";
}

// ---- implémentation ----

// Ce que la première liste montre : les établissements et les structures.
type Tete = Pick<Listes, "etablissements" | "structures" | "fourreTout">;

const TETE_VIDE: Tete = {
  etablissements: [],
  structures: [],
  fourreTout: null,
};

async function chargerTete(referentiel: Referentiel): Promise<Tete> {
  const liste = await referentiel.listerEtablissements();
  const fourreTout = liste.find(estEtablissementFourreTout) ?? null;
  const structures = fourreTout
    ? await referentiel.listerServices(fourreTout.id)
    : [];
  return {
    etablissements: triParLibelle(liste.filter((e) => e !== fourreTout)),
    structures: structuresAffichees(structures),
    fourreTout,
  };
}

// Tri alphabétique français, sans tenir compte de la casse ni des accents.
// « Autre » passe en fin de liste.
function triParLibelle<T extends { libelle: string }>(liste: T[]): T[] {
  return [...liste].sort((a, b) => {
    if (estAutre(a.libelle) !== estAutre(b.libelle)) {
      return estAutre(a.libelle) ? 1 : -1;
    }
    return a.libelle.localeCompare(b.libelle, "fr", { sensitivity: "base" });
  });
}
