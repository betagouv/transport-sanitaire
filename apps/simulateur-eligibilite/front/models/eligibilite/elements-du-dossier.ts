// Les « Éléments du dossier pris en compte pour cette simulation » de la page
// du praticien : pour chaque fait que le scénario cite, son nom, puis ce que la
// trace en dit. Une fonction pure, sans React.
//
// Le catalogue de l'éditeur ne nomme pas ces faits : les noms et les lignes de
// l'étranger sont recopiés de son programme (`auditFacts` et la page de
// l'étranger, dans `projection-resultats.mjs` de la 10.1.2), sur décision de
// Simon (D-112). Un fait que ce programme ne nomme pas n'a pas de ligne.

import type { Faits } from "./declarations/faits";
import type { Trace } from "./trace-du-resultat";

/** Les lignes de ces faits, dans leur ordre, chacune une fois. */
export function elementsDuDossier(
  faits: readonly string[],
  { faits: valeurs }: Trace,
): string[] {
  return [...new Set(faits)].flatMap((fait) =>
    estNomme(fait) ? [`${NOMS[fait]} : ${etat(valeurs[fait])}`] : [],
  );
}

/** Les lignes de la page de l'étranger : son fait, puis ce qui reste à faire. */
export function elementsDuDossierDeLEtranger(trace: Trace): string[] {
  return [
    ...elementsDuDossier(["fait_trajet_etranger"], trace),
    "Document à préparer : demande d’examen (formulaire S3139h)",
    "Prise en charge et financeur : à confirmer auprès de la caisse",
  ];
}

// ---- implémentation ----

const NOMS = {
  fait_ald_liee: "Soins et déficience en lien avec l’ALD",
  fait_ald_exonerante_3_ou_4: "Base juridique ALD qualifiante",
  fait_mineur_soins_prolonges_reconnus:
    "Reconnaissance des soins prolongés du mineur",
  fait_convocation: "Conditions de convocation ou d’appareillage",
  fait_permission: "Permission de sortie",
  fait_permission_mineur_admissible:
    "Permission spécifique du mineur admissible",
  fait_permission_charge_patient: "Facturation personnelle de la permission",
  fait_hospitalisation: "Hospitalisation",
  fait_transfert_article80: "Qualification du transfert hospitalier",
  fait_motif_samsah: "Soins dans un SAMSAH",
  fait_motif_pension: "Soins liés à une pension militaire",
  fait_centre15_interetablissements: "Centre 15 hors SMUR entre établissements",
  fait_htnm_hors_maternite: "Segment d’hébergement temporaire hors maternité",
  fait_motif_camsp: "CAMSP ou CMPP",
  fait_dap_maternite: "Dispositif Engagement maternité",
  fait_urgence_attestee: "Urgence attestée par le médecin",
  fait_trajet_etranger: "Départ ou arrivée hors de France",
} as const satisfies Partial<Record<keyof Faits, string>>;

function estNomme(fait: string): fait is keyof typeof NOMS {
  return Object.hasOwn(NOMS, fait);
}

// Un fait absent n'est pas un « non » (D-86).
function etat({ value }: Faits[keyof Faits]): string {
  if (value === true) return "établi";
  if (value === false) return "non retenu";
  return "non vérifiable dans la trace";
}
