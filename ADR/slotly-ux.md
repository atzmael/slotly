# Slotly - Interfaces, Flows UX Et User Stories

> **Lire pour :** interfaces, flows UX, user stories Slotly.

**Date :** 2026-05-31  
**Mise a jour :** 2026-05-31  
**Lie a :** [ADR slotly.md](./slotly.md)

Chaque flow doit etre documente ecran par ecran : ce que l'utilisateur voit, les actions disponibles, les etats vides/erreur et les feedbacks visuels attendus.

---

## Priorites UX

Ordre de priorite :

1. Experience mobile.
2. Vitesse.
3. Simplicite.
4. Lisibilite des resultats.
5. Support desktop.

Le produit doit se rapprocher d'une app de messagerie moderne plus que d'un outil de planification traditionnel. Si un utilisateur a besoin d'explications pour creer, participer ou lire les resultats, l'UX a echoue.

## Pages MVP

### Accueil Public

Route : `/`

Objectif :

- comprendre le produit en moins de 5 secondes ;
- CTA simple : "Create Poll" ;
- aucun onboarding, aucun compte, aucune friction.

### Create Poll

Route : `/new`

Objectif : creer un availability poll en moins de 15 secondes.

Champs :

- Event name.
- Date range.
- Daily time range.
- Event duration : 30 min, 1 hour, 2 hours, 3 hours, 4 hours.
- Slot size : 30 min ou 1 hour.

Action :

- Create Event.
- Succes : redirect vers `/e/{eventId}`.

UX :

- formulaire compact ;
- libelles immediatement comprehensibles ;
- erreurs inline ;
- la grille de participation utilise la plage horaire choisie, sans plage
  hardcodee ;
- aucune option avancee en MVP.

### Join Poll

Route : `/e/{eventId}`

Objectif : remplir ses disponibilites en moins de 30 secondes.

L'utilisateur saisit :

- name ;
- timezone detecte automatiquement par `Intl.DateTimeFormat().resolvedOptions().timeZone`.

Interaction disponibilite :

- grille mobile-first ;
- tap ;
- drag ;
- selection continue ;
- drag rectangulaire : depuis une case de depart, glisser horizontalement puis
  verticalement selectionne tout le rectangle de cases entre depart et arrivee ;
- cibles tactiles confortables ;
- pas de micro-cellules difficiles a toucher.

Regles :

- deux etats seulement : available / not available ;
- pas de preferences ;
- pas de weighting.
- un nom trimme identique a un participant existant reconnecte ce participant ;
- un nom equivalent seulement par casse ou accents est refuse avec une erreur
  demandant un nom plus specifique.

### Results

Route : `/e/{eventId}/results`

Objectif : identifier le meilleur creneau en moins de 5 secondes.

Cet ecran est le plus important du MVP.

Contenu attendu :

- ranking automatique des meilleurs slots, trie par attendance ;
- medailles ou autre signal visuel pour les premiers resultats ;
- nombre de participants disponibles par slot ;
- detail du slot selectionne ;
- liste Present ;
- liste Absent ;
- heatmap visible avec intensite basee sur `availableCount`.

Exemple de ranking :

```txt
1. Tuesday 20:00 -> 22:00 - 12 participants
2. Wednesday 20:00 -> 22:00 - 11 participants
3. Thursday 21:00 -> 23:00 - 10 participants
```

Heatmap :

- 0 participant = tres clair ;
- maximum participants = plus sombre ;
- les meilleures periodes doivent etre immediatement visibles.

---

## Regles UX

- Les etats importants doivent etre explicites : event introuvable, aucun participant, disponibilite sauvegardee, resultats vides.
- Les erreurs doivent expliquer l'action possible suivante.
- Les textes utilisateur doivent etre prepares pour l'i18n si la localisation est active.
- La langue initiale est detectee depuis la langue navigateur (`Accept-Language`) ;
  un choix manuel EN/FR peut ensuite etre conserve localement.
- Les routes localisees (`/fr`, `/en`) restent hors scope MVP tant que le
  besoin SEO multilingue n'est pas confirme.
- Les informations temporelles doivent afficher le fuseau pertinent.
- Les participants dans plusieurs pays doivent voir les memes slots traduits dans leur heure locale.
- Ne jamais sacrifier la simplicite pour ajouter une feature.

## Hors Scope UX MVP

- Authentification.
- Onboarding.
- Parametres compte.
- Notifications email.
- Integrations calendrier.
- Integrations Discord.
- Recurrence.
- Team management.
