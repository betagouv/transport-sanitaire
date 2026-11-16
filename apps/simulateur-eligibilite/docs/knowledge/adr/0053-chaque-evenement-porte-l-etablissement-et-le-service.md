# ADR-0053 - L'établissement et le service sur chaque événement, et en colonnes

> Statut : **décidé** · 2026-11-16 · Anciennement ADR-16 de `analytics.md`

**Contexte.** Dans le Grist du journal, on ne voyait ni l'établissement ni le
service d'une simulation (#491). Les deux ids n'étaient que dans le JSON de
`payload`, et seulement sur `simulation_started`. Leur nom se lisait dans le
référentiel, qui est un autre document.

**Décision.**

1. **Le rattachement sur chaque événement.** Le parcours le reçoit à son
   ouverture, avec sa provenance (ADR-0050), et l'écrit sur tous les événements
   qu'il numérote :

   | Champ | Ce qu'il dit | Quand il manque |
   |---|---|---|
   | `establishment_id` | l'id de l'établissement dans le référentiel | l'établissement est saisi à l'écran |
   | `establishment_name` | son nom, lu dans la liste ou saisi | le référentiel ne répondait pas |
   | `service_id` | l'id du service, celui d'« Autre » sous un service saisi | l'établissement est saisi à l'écran |
   | `service_name` | son nom, lu dans la liste ou saisi | le référentiel ne répondait pas |

2. **Le navigateur envoie les noms.** L'écran de rattachement les a déjà : il
   garde le libellé choisi avec son id. Un nom saisi passe devant celui de la
   liste : sous « Autre », c'est lui qui dit le service.
3. **Deux colonnes dans Grist.** L'adaptateur écrit `establishment` et
   `service`, dans `Evenements` et dans `Collisions`, en JSON brut : `id` et
   `name`, et une clé qui manque quand la valeur manque. Un texte « nom (id) »,
   d'abord écrit, se lisait mais ne s'exploitait pas sans le redécouper.

   | Rattachement | `establishment` | `service` |
   |---|---|---|
   | un service de la liste | `{"id":"12","name":"CHU Grenoble Alpes"}` | `{"id":"48","name":"Cardiologie"}` |
   | un service saisi sous « Autre » | `{"id":"12","name":"CHU Grenoble Alpes"}` | `{"id":"51","name":"Néphrologie"}`, où 51 est l'id d'« Autre » |
   | un établissement saisi | `{"name":"Clinique des Cèdres"}` | `{"name":"Urgences"}` |
   | le repli, sans référentiel | `{"id":"autre"}` | `{"id":"autre"}` |
   | le signe de vie | vide | vide |

4. **Le serveur borne les noms.** 300 caractères au plus, là où l'écran borne
   une saisie à 150 : un nom long du référentiel ne fait pas perdre l'événement.

**Pourquoi.** Une ligne du journal se lit et se filtre seule, sans ouvrir
`payload` ni joindre le début du parcours. Le navigateur a les noms sous la main : le
serveur n'a ni lecture de plus dans Grist ni cache à tenir.

Écarté : le serveur qui trouve le nom dans le référentiel d'après l'id. Le
contrat restait fait d'ids, mais chaque écriture relisait Grist, ou demandait un
cache, et un établissement saisi restait sans nom.

**Conséquences.**

- Le serveur écrit un nom qu'il ne vérifie pas : un client peut en envoyer un
  autre que celui du référentiel. L'id reste la clé, le nom une aide à la
  lecture.
- Un nom saisi à l'écran de rattachement part au journal. L'enrichissement
  l'écrivait déjà dans le référentiel. Un très petit service peut désigner une
  ou deux personnes (R-11 de l'[ADR-0003](./0003-la-mesure-d-audience-se-fait-sans-bandeau-de-consentement.md)).
- Matomo ne change pas : il ne reçoit que l'id du service (ADR-0002).
- Le contrat de nos compléments passe en version 3. Les lignes d'avant gardent
  leurs colonnes vides : elles ne sont pas reprises.
- Les deux colonnes doivent exister dans le document du journal avant le
  déploiement. Grist refuse une écriture vers une colonne inconnue, et la
  collecte s'arrêterait.

## Mises à jour

> **Mise à jour 2026-11-16, l'établissement et le service en colonnes (#491).**
> Chaque événement d'un parcours porte désormais son rattachement : les ids du
> référentiel, et les noms de l'établissement et du service. Le journal Grist
> les écrit dans deux colonnes, `establishment` et `service`, en JSON brut.
> Un nom saisi à l'écran de rattachement part donc au journal : cela **révise**
> ce qui ne part jamais, dans
> [`mesure-d-audience.md`](../domain/mesure-d-audience.md).
