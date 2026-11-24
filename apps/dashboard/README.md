# dashboard

Le tableau de bord du dépôt. Aujourd'hui, une coquille : une page Vite avec un titre
« Tableau de bord » et rien d'autre.

## Pourquoi une app à part

Elle a été ajoutée pour éprouver le déploiement d'une seconde app depuis le monorepo,
sans toucher aux apps Scalingo du simulateur. Comme toute app, elle ne dépend d'aucune
autre.

## Comment elle est servie et déployée

Le build reste lancé depuis la racine, car le workspace pnpm y tient son lock. La
variable `DEPLOY_APP` choisit l'app que le `build` et le `start` de la racine
construisent et lancent. Le `Procfile` appelle ce `start`. Sans `DEPLOY_APP`, c'est le
simulateur : ses apps Scalingo n'ont rien à régler. Pour le dashboard, on pose
`DEPLOY_APP=dashboard`, et c'est bien posé sur l'app Scalingo du tableau de bord.

`start` sert le build par `vite preview`, sur `$PORT` (4173 par défaut). Vite refuse
les domaines qu'il ne connaît pas : `vite.config.ts` autorise les sous-domaines de
Scalingo et ceux de `transportsanitaire.beta.gouv.fr`.

## Commandes

| Commande | Ce qu'elle fait |
|---|---|
| `pnpm --filter dashboard dev` | serveur de développement Vite |
| `pnpm --filter dashboard build` | construit la page dans `dist/` |
| `pnpm --filter dashboard lint` | Biome, sur la config de l'app |
| `pnpm --filter dashboard typecheck` | TypeScript, sur `vite.config.ts` |
| `pnpm --filter dashboard verifier` | lint, typecheck, puis build |
| `pnpm --filter dashboard start` | sert le build, comme en production |

## Ce qu'elle n'est pas encore

- Elle n'affiche aucune donnée. Son contenu reste à définir (à venir).
- Elle n'a ni tests ni knip. La CI passe son lint, son typecheck et son build
  (job `dashboard`).
