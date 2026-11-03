// Les options du patient (Q1.1 à Q1.4), sous le même format que `OPTIONS`
// (`questions.ts`) : le slug de chaque option, et son libellé du catalogue.
// Q1.3 garde l'ordre que le catalogue lui donne.

export const OPTIONS_DU_PATIENT = {
  /** Concernant son déplacement, le patient : */
  "Q1.1": {
    "1_SEUL":
      "Peut se déplacer seul, sans aide technique ou humaine et sans besoin particulier sur l’entièreté du trajet.",
    "2_AVEC_UN_PROCHE":
      "Nécessite l’accompagnement d’un proche pour se déplacer ou transmettre les informations nécessaires à l’équipe soignante, sans intervention d’un professionnel pendant le transport.",
    "3_AVEC_UN_PROFESSIONNEL":
      "Nécessite une prise en charge spécifique pendant le trajet, une aide d’un professionnel pour se déplacer ou, en l’absence d’un proche accompagnant, pour transmettre les informations nécessaires à l’équipe soignante.",
  },
  /** Quelles aides ou conditions particulières sont nécessaires pendant le transport ? */
  "Q1.2": {
    "1_PAS_AUTONOME":
      "Ne peut pas se déplacer de manière autonome sur une longue distance, utiliser seul les transports en commun ou conduire un véhicule personnel en raison de sa pathologie, de son traitement ou d’un handicap.",
    "2_AIDE_TECHNIQUE":
      "Nécessite une aide technique, telle qu’un fauteuil roulant, un déambulateur ou des béquilles, et une assistance pour monter dans le véhicule ou en descendre.",
    "3_TRANSMISSION_PAR_UN_PROFESSIONNEL":
      "Nécessite, en l’absence d’un proche accompagnant, l’aide d’un professionnel pour transmettre les informations nécessaires à l’équipe soignante.",
    "4_HYGIENE":
      "Nécessite des précautions d’hygiène ou la désinfection du véhicule pour prévenir un risque infectieux, sans exigence de transport en conditions d’asepsie.",
    "5_RISQUE_DE_MALAISE":
      "Présente un risque d’effets secondaires, de malaise ou de complications pendant le transport.",
    "6_FAUTEUIL_SANS_TRANSFERT":
      "Le patient doit être transporté dans son fauteuil roulant, sans transfert vers un siège du véhicule.",
    "7_ALLONGE":
      "Doit être transporté en position allongée ou semi-assise sur un brancard, car son état ne lui permet pas de rester assis normalement pendant le transport.",
    "8_BRANCARDAGE":
      "Nécessite un brancardage ou un portage, c’est-à-dire que le patient doit être soulevé et transporté par des professionnels, y compris sur une courte distance.",
    "9_SURVEILLANCE":
      "Nécessite une surveillance constante par une personne qualifiée et la présence de matériel de secours pendant le transport, en raison d’un risque médical identifié de dégradation de son état.",
    "10_OXYGENE": "Nécessite l’administration d’oxygène pendant le transport.",
    "11_ASEPSIE":
      "L’état de santé du patient impose un transport dans des conditions d’asepsie.",
  },
  /** Les cas particuliers concernant le patient. */
  "Q1.3": {
    "1_FORTE_CORPULENCE": "Présente une forte corpulence (plus de 150 kg).",
    "2_ALD":
      "Le patient est en Affection Longue Durée (ALD) exonérante reconnue.",
    "3_CHIMIOTHERAPIE": "Ce déplacement concerne une séance de chimiothérapie.",
    "4_RADIOTHERAPIE": "Ce déplacement concerne une séance de radiothérapie.",
    "5_DIALYSE": "Ce déplacement concerne une séance de dialyse en centre.",
    "6_PARTAGE_INCOMPATIBLE":
      "L’état de santé du patient n’est pas compatible avec un transport partagé.",
    "7_AUCUNE": "Aucune de ces situations.",
    "8_MINEUR_SOINS_CONTINUS":
      "Le patient a moins de 18 ans et le service médical de l’Assurance Maladie a reconnu qu’il nécessite des soins continus pendant plus de six mois, en lien avec ce déplacement.",
  },
  /** Précisez le lien entre le transport et l'Affection Longue Durée (ALD) de votre patient */
  "Q1.3.b": {
    "1_LIEN_DIRECT":
      "Soin ou examen directement lié au traitement de cette Affection Longue Durée (ALD) (soin ou examen inscrit au protocole de soins de cette Affection Longue Durée (ALD))",
    "2_SANS_LIEN_DIRECT":
      "Soin ou examen sans lien direct avec cette Affection Longue Durée (ALD) (traumatisme distinct, intercurrence, autre affection)",
  },
  /** La séance prévue est-elle une séance d’hémodialyse ? */
  "Q1.3.a": {
    "1_OUI": "Oui.",
    "2_AUTRE_DIALYSE": "Non, il s’agit d’une autre dialyse en centre.",
  },
  /** La préférence du patient en matière de transport. */
  "Q1.4": {
    "1_VEHICULE_PERSONNEL": "Véhicule personnel.",
    "2_TRANSPORTS_EN_COMMUN": "Transports en commun terrestres.",
  },
} as const;
