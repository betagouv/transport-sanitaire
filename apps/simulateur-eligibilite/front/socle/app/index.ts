// Ce que l'app promet à `main.tsx` : de quoi la monter, et le choix d'un
// modèle. Rien du socle ne lit `app` : c'est elle qui compose les autres
// modules.

export { App } from "./App";
export type { Models } from "./model-choice";
export type { ModelSource } from "./model-loading";
