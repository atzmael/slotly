# Slotly - Observability, Analytics & Privacy

> **Lire pour :** erreurs production, logs serveur, analytics produit et confidentialite.

**Status :** Canonical draft  
**Derniere mise a jour :** 2026-05-31

---

## Objectif

L'observabilite doit permettre de comprendre les bugs, reproduire les blocages utilisateurs, mesurer les parcours et surveiller les performances sans exposer de donnees sensibles.

Les outils externes ne remplacent pas les systemes produit :

- les logs techniques aident au debug ;
- les analytics produit aident a comprendre les parcours ;
- les replays/heatmaps, si actives, aident a reperer les blocages UX ;
- les logs applicatifs aident a reperer les erreurs sans stocker de donnees personnelles inutiles.

## Outils Cibles A Confirmer

| Besoin | Outil cible | Usage |
|--------|-------------|-------|
| Erreurs frontend/server | Sentry ou equivalent | Exceptions, stack traces, breadcrumbs |
| Logs serveur structures | Axiom ou equivalent | Routes, services, guards, jobs, request id |
| Analytics produit | PostHog ou equivalent | Funnels, evenements produit |
| Web analytics leger | Vercel Web Analytics | Trafic global, pages publiques |
| Performance reelle | Vercel Speed Insights | Web vitals et regressions perf |

Tous les tokens, DSN, hosts, dataset names et cles publiques doivent venir de variables d'environnement.

Interdit :

- token, DSN, project id prive ou dataset sensible hardcode ;
- URL interne privee hardcodee ;
- cle API commitee ;
- valeur de configuration qui empecherait de rendre le repo public.

## Categories De Pages

| Categorie | Exemples | Analytics | Replay / heatmap |
|-----------|----------|-----------|------------------|
| Publique | `/`, pages legales, aide | Autorise | Autorise si champs sensibles masques |
| Create | `/new` | Autorise avec payload type | Autorise si champs masques |
| Event public | `/e/[id]` | Autorise avec payload type | Echantillonne et masque |
| Results | `/e/[id]/results` | Autorise avec payload type | Echantillonne et masque |
| Futur sensible | auth, admin, support, compte | Minimal | Desactive par defaut |

## Donnees Autorisees, Hachees, Masquees, Interdites

### Autorise

- environnement (`development`, `preview`, `production`) ;
- version/release/commit ;
- route ou route pattern ;
- nom stable d'evenement ;
- feature flag actif/inactif ;
- type de device, viewport, navigateur ;
- duree, statut, compteur, code d'erreur applicatif non sensible.

### Hache Ou Pseudonymise

- identifiant participant pour correlation externe ;
- identifiant event si l'evenement n'a pas besoin d'exposer l'id public.

### Masque Ou Agrege

- email ;
- nom libre ;
- contenu de champ texte ;
- parametres d'URL pouvant contenir des tokens ;
- messages d'erreur contenant une donnee utilisateur.

### Interdit

- mot de passe ;
- hash de mot de passe ;
- token de session ;
- token OAuth ;
- refresh token ;
- cle API ;
- secret webhook ;
- donnees de paiement ;
- notes support privees ;
- payload brut de provider auth.

## Regles De Payload

Les evenements analytics, logs et erreurs utilisent des slugs stables.

Bon :

```txt
event.created
participant.joined
availability.updated
results.viewed
app_access.blocked
```

A eviter :

```txt
"Connexion echouee"
"Mael a confirme le rendez-vous"
```

Les textes traduits ne doivent pas devenir des cles analytics.

Chaque payload doit etre type et minimal :

- uniquement les champs necessaires ;
- pas de dump d'objet DB ;
- pas de dump de request complete ;
- pas de dump de session complete ;
- pas de champs libres non filtres.
