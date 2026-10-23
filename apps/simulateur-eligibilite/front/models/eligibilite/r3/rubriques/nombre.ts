// Le nombre de transports que ce document prescrit (Q3.1.1), sur la PMT et la
// DAP. Il ne compte que ceux de ce document : deux documents de deux
// transports peuvent former une série de quatre.

import type { Rubrique } from "./rubrique";

export type Nombre = {
  readonly nombre?: string;
};

export const NOMBRE: Rubrique<Nombre> = {
  nombre: ({ validated }) => {
    const nombre = validated.question("Q3.1.1").value;
    return nombre === undefined ? undefined : String(nombre);
  },
};
