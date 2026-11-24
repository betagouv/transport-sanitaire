// La comparaison en profondeur du journal, par `node:util`.

import { isDeepStrictEqual } from "node:util";
import type { SameContent } from "./same-content.port.ts";

export class NodeSameContent implements SameContent {
  equal(first: unknown, second: unknown): boolean {
    return isDeepStrictEqual(first, second);
  }
}
