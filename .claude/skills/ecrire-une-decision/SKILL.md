---
name: ecrire-une-decision
description: Écrire une décision : dire si elle mérite un ADR de docs/knowledge/adr/, puis l'écrire, la réviser ou la révoquer. À charger dès qu'une décision structurante est prise, révisée ou révoquée, ou qu'on demande de « documenter l'archi ».
---

# Écrire une décision

Ce skill ne porte que la marche à suivre. Les règles sont ailleurs :

| Ce qu'il faut savoir | Où |
|---|---|
| quand une décision mérite un ADR, où s'écrit une décision courante, la forme et le nom d'un ADR, ce qui n'y entre pas, les décisions renversées | [`docs/knowledge/contributing/ecrire-une-decision.md`](../../../docs/knowledge/contributing/ecrire-une-decision.md) |
| ce qui n'est pas une décision d'architecture, et où ça va | `AGENTS.md` § « Où écrire quoi » |

## 1. Est-ce que ça mérite un ADR ?

Applique le critère du document ci-dessus. Si la décision ne le remplit pas,
n'écris pas d'ADR : le corps du message du commit dit le pourquoi, et le ticket
Notion du chantier la garde.

## 2. Choisir où l'écrire

```bash
ls docs/knowledge/adr apps/*/docs/knowledge/adr
```

| La décision | Où |
|---|---|
| d'architecture, sur une app | un nouveau fichier dans son `docs/knowledge/adr/` |
| d'architecture, sur ce qui traverse les apps | un nouveau fichier dans `docs/knowledge/adr/` de la racine |

Lis les titres du dossier, puis les ADR du même sujet : une décision en précise
ou en renverse souvent une autre.

```bash
grep -h '^# ADR' apps/simulateur-eligibilite/docs/knowledge/adr/*.md
```

## 3. Écrire ou réviser un ADR

- **Un nouvel ADR** prend le numéro qui suit le dernier du dossier, dans son
  propre fichier. Il ne cite pas de `D-<n>`.
- **Un ADR révisé** reçoit un encart daté sous son en-tête.
- **Un ADR révoqué** garde son fichier : change son statut, et cite l'ADR qui
  le remplace.

Ce qui touche le métier va dans `docs/knowledge/domain/`, pas dans l'ADR.

## 4. Vérifier

Chaque renvoi relatif doit ouvrir un fichier qui existe :

```bash
cd <dossier de l'ADR>
grep -oE '\]\(\.[^)#]+' <fichier>.md | cut -c3- | while read -r f; do [ -e "$f" ] || echo "mort : $f"; done
```

Si la décision change ce que fait le code, le corps du commit qui la porte cite
l'ADR : « (ADR-0053) ».
