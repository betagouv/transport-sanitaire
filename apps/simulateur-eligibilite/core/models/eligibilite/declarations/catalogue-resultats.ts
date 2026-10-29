// Le type de `rules/catalogue-resultats.json`, les textes de R2 que l'éditeur
// livre à côté de ses règles. Le fichier est recopié tel quel (D-103) : ce type
// en décrit la forme, et son chargement (`../catalogue-resultats.ts`) vérifie,
// à la compilation, que le fichier livré la respecte.
//
// Les noms des champs sont ceux de l'éditeur.

/** Le catalogue n'a pas de texte pour ce cas : rien ne s'affiche. */
export type AucunTexte = undefined;

/** Aucun scénario du catalogue ne correspond à ce cas. */
export type AucunScenario = undefined;

/** Le catalogue : sa version, ses sources, et les textes de chaque issue. */
export type CatalogueResultats = {
  readonly schema: string;
  /** La version du modèle, celle de `rules/VERSION`. */
  readonly packageVersion: string;
  /** L'empreinte SHA-256 de `rules/regles.publicodes`. */
  readonly modelSha256: string;
  readonly sourceDate: string;
  readonly sources: Readonly<Record<string, Source>>;
  /** La phrase qui annonce la fiche à remettre au patient. */
  readonly patientSheetIntro: string;
  /** L'invitation au patient à donner son avis, au pied de sa fiche. */
  readonly patientFeedback: { readonly text: string; readonly email: string };
  readonly issues: {
    readonly ISSUE_PMT: IssuePositive;
    readonly ISSUE_DAP_SANS_URGENCE: IssueDAccordPrealable;
    readonly ISSUE_DAP_URGENCE_ATTESTEE: IssueDAccordPrealable;
    readonly ISSUE_S3141: IssuePositive & {
      readonly permissionPhrases: readonly Texte[];
      readonly permissionAdministrative: readonly Texte[];
    };
    readonly ISSUE_CAISSE: IssueDeLaCaisse;
    readonly ISSUE_ETABLISSEMENT: IssuePrescripteur;
    readonly ISSUE_PERMISSION_PATIENT: IssuePrescripteur;
    readonly ISSUE_CONVOCATION: IssuePrescripteur;
    readonly ISSUE_NON_ELIGIBLE: IssueNegative;
    readonly ISSUE_DAP_ETRANGER_A_EXAMINER: IssueEtranger;
  };
  readonly badges: {
    /** Les badges de chaque critère de Q1.2, par son numéro au catalogue. */
    readonly criteria: Readonly<Record<string, readonly string[]>>;
    readonly nonShared: string;
    readonly bari: string;
  };
};

/** La page de l'éditeur d'où vient un texte, et son empreinte. */
type Source = {
  readonly id: string;
  readonly title: string;
  readonly url: string;
  readonly edited: string;
  readonly sha256: string;
  readonly blank?: boolean;
  readonly parent?: string;
};

/** Un texte, et les codes de contexte qui le choisissent. */
export type TexteCode = {
  readonly id: string;
  readonly codes: readonly string[];
  readonly text: string;
};

type Texte = { readonly id: string; readonly text: string };
type Extra = { readonly code: string; readonly text: string };
export type Bloc = { readonly title: string; readonly text: string };
type Intro = { readonly title: string; readonly subtitle: string };

/** Une carte de mode de transport, et les critères de Q1.2 qui la montrent. */
type Carte = {
  readonly id: string;
  readonly criteria: readonly number[];
  readonly mode: string;
  readonly nonShared: boolean;
  readonly bari: boolean;
  readonly title: string;
  readonly text: string;
};

/** La fiche patient d'une issue qui ouvre une prise en charge. */
export type IssuePositive = {
  /** Le titre, par libellé de mode. */
  readonly titles: Readonly<Record<string, string>>;
  readonly prescriberTitles: readonly string[];
  readonly contexts: readonly TexteCode[];
  readonly contextExtras: readonly Extra[];
  readonly dapPhrases: readonly TexteCode[];
  readonly administrativeBases: readonly TexteCode[];
  readonly administrativeExtras: readonly Extra[];
  readonly administrativeDap: readonly TexteCode[];
  readonly modus: readonly {
    readonly mode: string;
    readonly alsoFor: readonly string[];
    readonly text: string;
    readonly particularities: string;
  }[];
  readonly cards: readonly Carte[];
  readonly fixedCards: readonly Bloc[];
  readonly cardPrefixes: Readonly<Record<string, string>>;
  /** Les définitions : par contexte (`id`), et les autres termes (`name`). */
  readonly lexicon: {
    readonly hospitalisation: readonly Texte[];
    readonly atmp: readonly Texte[];
    readonly other?: readonly {
      readonly name: string;
      readonly text: string;
    }[];
  };
  /**
   * Les définitions du motif administratif, quand elles diffèrent de celles
   * du contexte (TS1014-J02). Seule la PMT en porte.
   */
  readonly administrativeLexicon?: Pick<
    IssuePositive["lexicon"],
    "hospitalisation" | "atmp"
  >;
  readonly finance: Bloc;
  /** Le bloc bleu du délai est retiré (TS1014-J04). */
  readonly blueReminder: null;
};

/** Une demande d'accord préalable : son introduction, avant les étapes. */
type IssueDAccordPrealable = IssuePositive & {
  readonly intro: Intro;
  /** Une ligne régulière n'a ni cartes ni étapes (TS1014-J04). */
  readonly suppressCardsAndStepsForLine: boolean;
};

/** Le résultat du prescripteur : un scénario par situation à confirmer. */
export type IssuePrescripteur = {
  readonly type: string;
  readonly title: string;
  readonly scenarios: readonly ScenarioPrescripteur[];
};

/** La caisse : ses titres, pour un point et pour plusieurs, et l'introduction de plusieurs. */
export type IssueDeLaCaisse = IssuePrescripteur & {
  readonly multipleIntro: string;
  readonly titles: { readonly single: string; readonly multiple: string };
};

/** Un scénario du résultat du prescripteur, et ce qui le choisit. */
export type ScenarioPrescripteur = {
  readonly id: string;
  readonly label: string;
  readonly intro: string;
  readonly whyTitle: string;
  readonly whyText: string;
  readonly sourceKeys: readonly string[];
  readonly reason: string;
  readonly actions: readonly string[];
  /**
   * Les paramètres du scénario ; `null` : il n'en demande pas la preuve.
   * Absents d'un scénario gardé pour la compatibilité, comme celui de la dialyse.
   */
  readonly params: Readonly<Partial<Record<string, string | null>>>;
  /** Un scénario inactif n'est jamais montré. */
  readonly inactive: boolean;
  readonly codes: readonly string[];
  readonly questions: readonly string[];
};

/** La fiche patient d'un transport qui n'est pas pris en charge. */
export type IssueNegative = {
  readonly type: string;
  readonly title: string;
  readonly prescriberTitle: string;
  readonly reasons: readonly {
    readonly id: string;
    readonly condition: string;
    readonly priority: number;
    readonly text: string;
    readonly reason: string;
    readonly inactive: boolean;
  }[];
  /** Ce que l'Assurance Maladie ne rembourse pas : un titre, puis ses puces. */
  readonly institutionalInformation: {
    readonly title: string;
    readonly items: readonly string[];
  };
  readonly instructions: {
    readonly intro: Intro;
    /** À sauts (`<br>`) et à puces (« • »). */
    readonly body: string;
    readonly steps: readonly string[];
  };
  readonly finance: Bloc;
};

/** Le transport à l'étranger, que la caisse examine. */
export type IssueEtranger = {
  readonly type: string;
  readonly title: string;
  readonly intro: string;
  readonly whyTitle: string;
  readonly whyItems: readonly {
    readonly title: string;
    readonly body: string;
  }[];
  readonly questions: readonly string[];
  readonly actions: readonly string[];
  readonly notice: string;
  readonly completeLabel: string;
  readonly support: string;
  readonly financeur: string;
  readonly reason: string;
  readonly publicationReview: string;
};
