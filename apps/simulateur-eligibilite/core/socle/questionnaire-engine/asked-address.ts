// Une adresse telle qu'elle se demande : ses champs, dans son mode du moment,
// en France ou à l'étranger (`address.ts`). Elle n'est répondue qu'avec tous
// ses champs attendus, sans rien à corriger.

import {
  type Address,
  type AddressProblems,
  type AskedField,
  addressProblems,
  askedAddress,
  askedFields,
  isAddress,
  isCompleteAddress,
} from "./address.ts";
import { type AnswerProblem, MISSING } from "./answer-problem.ts";
import { AskedCommon, type AskedCommonData } from "./asked-common.ts";
import type { Answer, Unanswered } from "./question.ts";

export type AskedAddressData = AskedCommonData & {
  readonly kind: "address";
  readonly withPlaceName?: boolean;
  readonly abroad?: boolean;
};

/** Une adresse, telle qu'elle se demande. */
export class AskedAddress extends AskedCommon {
  readonly kind = "address";
  /** Demande aussi le nom du lieu, avant la voie. */
  readonly withPlaceName: boolean;
  /** L'adresse est à l'étranger : le pays se demande, le code postal est libre. */
  readonly abroad: boolean;

  constructor(data: AskedAddressData) {
    super(data);
    this.withPlaceName = data.withPlaceName ?? false;
    this.abroad = data.abroad ?? false;
  }

  /** Les champs qui se demandent, dans l'ordre où ils se saisissent. */
  fields(): readonly AskedField[] {
    return askedFields(this);
  }

  /**
   * Ce qui ne va pas dans l'adresse, champ par champ, à montrer sous chacun. Un
   * champ encore vide n'a rien à corriger.
   */
  fieldProblems(address: Address): AddressProblems {
    return addressProblems(this, address);
  }

  /**
   * L'adresse réduite aux champs qui se demandent, sans espace autour. Le pays
   * d'une adresse repassée en France s'y perd.
   */
  override kept(answer: Answer | Unanswered): Answer | Unanswered {
    return isAddress(answer) ? askedAddress(this, answer) : undefined;
  }

  override isAnsweredBy(answer: Answer | Unanswered): boolean {
    const kept = this.kept(answer);
    if (!super.isAnsweredBy(answer)) return false;
    return !isAddress(kept) || isCompleteAddress(this, kept);
  }

  // Une adresse a un problème par champ, montré sous chacun. Ici, le premier
  // suffit : il dit qu'il reste quelque chose à corriger.
  protected override formatProblemOf(
    answer: Answer,
  ): AnswerProblem | undefined {
    if (!isAddress(answer)) return MISSING;
    return Object.values(this.fieldProblems(answer))[0];
  }
}
