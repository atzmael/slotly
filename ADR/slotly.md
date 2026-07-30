# ADR - Slotly

> **Lire pour :** vision produit, decisions transversales et carte des ADR specialises.

**Date :** 2026-05-31  
**Mise a jour :** 2026-05-31 - Integration du brief MVP brainstorm.  
**Status :** Canonical draft - a relire avant implementation.

---

## Principe

Ce fichier est le **hub canonique** de Slotly. Il ne doit pas contenir toutes les regles detaillees.

Les mecaniques et decisions precises vivent dans les fichiers specialises de `slotly/`. Si une regle detaillee change, elle doit etre modifiee dans le fichier de domaine correspondant.

Regles de maintenance :

- Le hub decrit la vision, les invariants transversaux et les liens.
- Les ADR `slotly/*` decrivent les regles metier detaillees.
- L'UX vit dans `slotly-ux.md`.
- L'implementation doit suivre les ADR.

---

## Index ADR

| Fichier                                                        | Source de verite pour                                            |
| -------------------------------------------------------------- | ---------------------------------------------------------------- |
| [`slotly/README.md`](./slotly/README.md)                       | Index des ADR Slotly et regles de maintenance                    |
| [`slotly/architecture.md`](./slotly/architecture.md)           | Stack, architecture cible, strategie d'implementation            |
| [`slotly/feature-checklist.md`](./slotly/feature-checklist.md) | Checklist obligatoire pour developper une feature                |
| [`slotly/schema.md`](./slotly/schema.md)                       | Modele conceptuel DB                                             |
| [`slotly/admin-testing.md`](./slotly/admin-testing.md)         | Debug futur, fixtures, tests unitaires et e2e                    |
| [`slotly/observability.md`](./slotly/observability.md)         | Erreurs production, logs, analytics, privacy                     |
| [`slotly/monetization.md`](./slotly/monetization.md)           | Strategie de monetisation future et protections du coeur gratuit |
| [`slotly-ux.md`](./slotly-ux.md)                               | Interfaces, flows UX, etats, feedbacks                           |

---

## Vision

Slotly est une alternative moderne aux outils de disponibilite historiques, centree sur une UX mobile-first, une participation instantanee, la gestion automatique des fuseaux horaires et le classement automatique des meilleurs creneaux.

Promesse coeur :

> Create a link, collect availability, instantly know the best time to meet.

Objectifs produit MVP :

1. Creer un poll de disponibilites en moins de 15 secondes.
2. Renseigner ses disponibilites en moins de 30 secondes.
3. Identifier le meilleur creneau en moins de 5 secondes.

Le produit doit paraitre beaucoup plus rapide et clair que les outils de disponibilite historiques, sans perdre sa simplicite.

---

## Nom

**Slotly** evoque un outil centre sur des slots, creneaux ou disponibilites.

---

## Contraintes

- Projet standalone : dossier `slotly/`, base et deploiement propres.
- MVP sans comptes, sans onboarding et sans authentification.
- Workflow par lien partageable.
- Participation instantanee avec nom libre.
- UX mobile prioritaire.
- Les regles metier doivent etre testables hors UI et hors framework.
- Les decisions visibles par les utilisateurs doivent etre comprehensibles dans l'interface et auditables quand elles changent un etat important.
- Toute feature doit passer par la checklist [`slotly/feature-checklist.md`](./slotly/feature-checklist.md) avant implementation.

Hors scope MVP :

- authentification ;
- notifications email ;
- integrations calendrier ;
- integrations Discord ;
- evenements recurrents ;
- fonctionnalites IA ;
- paiements ;
- gestion d'equipe.

Voir [`slotly/monetization.md`](./slotly/monetization.md) pour la strategie future : le coeur viral reste gratuit et sans compte ; la monetisation cible les organisateurs recurrents, pas les participants.

---

## Stack

Voir [`slotly/architecture.md`](./slotly/architecture.md).

Decision actuelle en draft :

- Next.js / React.
- TypeScript strict.
- Tailwind CSS.
- shadcn/ui.
- Supabase database, realtime et RLS.
- Vercel pour le deploiement.

---

## Invariants Produit

- Un event est cree sans compte et donne un lien `/e/{eventId}`.
- Un participant rejoint sans compte en saisissant seulement un nom.
- Les disponibilites MVP sont binaires : available / not available.
- Le fuseau horaire du participant est detecte automatiquement avec `Intl.DateTimeFormat().resolvedOptions().timeZone`.
- Les creneaux sont stockes de facon normalisee pour que chaque participant voie les memes slots traduits dans son fuseau local.
- La page resultats `/e/{eventId}/results` est l'ecran le plus important.
- Les meilleurs creneaux sont classes automatiquement par nombre de participants disponibles.
- Le detail d'un creneau montre immediatement presents et absents.
- La heatmap reste visible pour garder une lecture globale.
- Le createur accountless peut choisir une date definitive depuis les resultats
  et verrouiller le sondage ; ce choix peut etre annule.
- Les exports calendrier du MVP sont limites au choix definitif via lien Google
  Calendar et fichier `.ics`, sans compte ni integration connectee.
- Les donnees personnelles libres sont minimales, masquees dans les logs, et jamais utilisees comme cles analytics.
- La monetisation future ne doit pas bloquer la creation simple, la participation sans compte, le ranking, les timezones ou la lecture presents/absents.
- Les regles metier doivent rester dans `src/domain` ou services applicatifs, pas dans les composants UI.

## Utilisateurs Cibles

- Groupes d'amis.
- Communautes gaming.
- Serveurs Discord.
- Etudiants.
- Petites equipes.
- Organisateurs d'evenements.

---

## Plan D'Implementation

Voir [`../IMPLEMENTATION_PLAN.md`](../IMPLEMENTATION_PLAN.md).
