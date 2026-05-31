# Slotly - Debug, Fixtures & Tests

> **Lire pour :** strategie de test, fixtures locales et debug futur.

**Status :** Canonical draft  
**Derniere mise a jour :** 2026-05-31

---

## Objectif

Le MVP ne prevoit pas de panel admin, de support ou de moderation. Le developpement doit tout de meme permettre de tester rapidement les mecaniques majeures sans cliquer manuellement pendant plusieurs minutes.

Exemples :

- creer un event fixture ;
- generer des participants ;
- remplir des disponibilites representatives ;
- simuler deux participants dans des fuseaux horaires differents ;
- verifier le ranking ;
- verifier la heatmap ;
- simuler une double soumission ou une update concurrente.

Ces outils ne doivent pas polluer le code metier ni creer une deuxieme implementation des regles.

## Principe Central

Les fixtures, scripts locaux et tests appellent les **memes services applicatifs** que le produit normal.

Difference :

- le produit normal passe par les formulaires et routes publiques ;
- les tests peuvent appeler les services ou helpers de persistence ;
- les fixtures doivent rester explicites, reproductibles et separees du runtime production.

## Couches

```txt
domain/*
  regles pures, testables sans DB

server/services/*
  orchestration Supabase + domaine + realtime

tests/*
  unit, integration, e2e
```

## Tests Attendus

### Unit

- validation event ;
- generation de creneaux candidats ;
- couverture availability -> slot ;
- ranking par attendance ;
- present/absent classification ;
- conversions timezone.

### Integration

- creation event ;
- creation participant ;
- sauvegarde availability ;
- recalcul results ;
- persistance Supabase ou adapter test.

### E2E

- landing -> create poll -> event page ;
- participant rejoint et selectionne ses disponibilites ;
- results affiche le meilleur creneau ;
- detail present/absent fonctionne ;
- smoke mobile pour la selection tactile.

## Debug Futur

Si des commandes debug sont ajoutees apres le MVP, elles doivent :

- appeler les services metier normaux ;
- etre desactivees en production sauf decision explicite ;
- ne pas introduire d'authentification ou de support panel dans le MVP ;
- rester tracees quand elles modifient des donnees persistantes.
