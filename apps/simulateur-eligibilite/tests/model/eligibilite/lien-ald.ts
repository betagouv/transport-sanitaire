// Q1.3.b, le lien du soin avec l'ALD : il se répond dès que la case ALD de
// Q1.3 est cochée (QST-ALD-LIEN-001). Les cas d'avant la v10.1.4 parlaient
// d'un soin lié à l'ALD : ils gardent ce sens par un lien direct.

import type { Questions } from "../../../core/models/eligibilite/declarations/questions";

export const lienAld = (
  cas: Questions["Q1.3"] | undefined,
  lien: Questions["Q1.3.b"] = "1_LIEN_DIRECT",
): Partial<Pick<Questions, "Q1.3.b">> =>
  cas?.includes("2_ALD") ? { "Q1.3.b": lien } : {};
