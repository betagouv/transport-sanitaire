// La liste fermée des champs du document R3 dont le journal reçoit la taille
// imprimée (ANA22-03), recopiée de `analytics/champs-typographiques.json` de la
// v10.2.2 : `<support>.<champ>`, par support. Les parties d'une adresse de
// départ ou d'arrivée y sont un seul champ, `*_adresse_native`.

/** Les champs de chaque support. */
export const TYPOGRAPHIC_FIELDS = {
  S3138g: [
    "S3138g.beneficiaire_nom_prenom",
    "S3138g.beneficiaire_nir",
    "S3138g.beneficiaire_naissance",
    "S3138g.beneficiaire_adresse",
    "S3138g.organisme",
    "S3138g.assure_nom_prenom",
    "S3138g.assure_nir",
    "S3138g.tiers_date",
    "S3138g.atmp_date",
    "S3138g.nombre",
    "S3138g.urgence_precision",
    "S3138g.elements_medicaux",
    "S3138g.prescripteur_nom_prenom",
    "S3138g.prescripteur_rpps",
    "S3138g.structure_nom",
    "S3138g.structure_adresse",
    "S3138g.structure_identifiant",
    "S3138g.date_prescription",
    "S3138g.depart_adresse_native",
    "S3138g.arrivee_adresse_native",
  ],
  S3139h: [
    "S3139h.beneficiaire_nom_prenom",
    "S3139h.beneficiaire_nir",
    "S3139h.beneficiaire_naissance",
    "S3139h.beneficiaire_adresse",
    "S3139h.organisme",
    "S3139h.assure_nom_prenom",
    "S3139h.assure_nir",
    "S3139h.tiers_date",
    "S3139h.air_atmp_date",
    "S3139h.lien_atmp_date",
    "S3139h.nombre",
    "S3139h.urgence_precision",
    "S3139h.elements_medicaux",
    "S3139h.prescripteur_nom_prenom",
    "S3139h.prescripteur_rpps",
    "S3139h.structure_nom",
    "S3139h.structure_adresse",
    "S3139h.structure_identifiant",
    "S3139h.date_prescription",
    "S3139h.depart_adresse_native",
    "S3139h.arrivee_adresse_native",
  ],
  S3141: [
    "S3141.beneficiaire_nom_prenom",
    "S3141.beneficiaire_nir",
    "S3141.beneficiaire_naissance",
    "S3141.beneficiaire_adresse",
    "S3141.assure_nom_prenom",
    "S3141.assure_nir",
    "S3141.tiers_date",
    "S3141.debut_hospitalisation",
    "S3141.lien_atmp_date",
    "S3141.nombre",
    "S3141.cadence",
    "S3141.periode_fin",
    "S3141.prescripteur_nom_prenom",
    "S3141.prescripteur_rpps",
    "S3141.structure_nom",
    "S3141.structure_adresse",
    "S3141.structure_identifiant",
    "S3141.date_prescription",
    "S3141.depart_adresse_native",
    "S3141.arrivee_adresse_native",
  ],
} as const;

/** Un support de document R3 : celui d'un cerfa. */
export type DocumentSupport = keyof typeof TYPOGRAPHIC_FIELDS;

/** Un champ de la liste fermée, d'un support ou de tous. */
export type TypographicFieldId<
  Support extends DocumentSupport = DocumentSupport,
> = (typeof TYPOGRAPHIC_FIELDS)[Support][number];

/** Vrai si `support` est celui d'un document R3. */
export function isDocumentSupport(
  support: string | null | undefined,
): support is DocumentSupport {
  return support != null && Object.hasOwn(TYPOGRAPHIC_FIELDS, support);
}
