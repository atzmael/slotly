# Slotly - Monetization

> **Lire pour :** strategie de monetisation, limites du gratuit, protections du coeur viral.

**Status :** Canonical draft  
**Derniere mise a jour :** 2026-06-01

---

## Decision

La monetisation est **hors scope MVP**, mais le produit doit etre concu pour pouvoir l'ajouter sans casser la promesse centrale.

Regle canonique :

> Le coeur viral reste gratuit et sans compte ; la monetisation cible les organisateurs recurrents, pas les participants.

## Coeur Gratuit A Proteger

Ces capacites ne doivent pas etre paywallees :

- creer un poll simple sans compte ;
- partager un lien ;
- participer sans compte ;
- detecter automatiquement le fuseau horaire ;
- renseigner ses disponibilites ;
- voir le ranking des meilleurs slots ;
- voir les presents/absents d'un slot ;
- utiliser le produit confortablement sur mobile.

Le produit doit rester utile a un groupe d'amis ou une petite communaute meme sans paiement.

## Hors Scope MVP

- Paiements.
- Plans payants.
- Comptes organisateur.
- Quotas de billing.
- Facturation.
- Gestion d'equipe.
- Integrations payantes.
- Publicites.

Aucune dependance paiement ne doit etre ajoutee avant une decision ADR explicite.

## Monetisation Future

### Pro Polls

Fonctionnalites possibles pour un poll premium :

- expiration personnalisee ;
- duplication de poll ;
- edition apres creation ;
- protection par mot de passe ;
- branding leger ;
- URL custom ou slug lisible ;
- export CSV ;
- limite de participants plus elevee ;
- conservation plus longue.

### Organizer Account

Fonctionnalites possibles pour les createurs recurrents :

- historique des polls ;
- dashboard organisateur ;
- templates ;
- liens persistants ;
- brouillons ;
- reprise d'un poll cree sans compte via lien secret ;
- statistiques simples.

### Team Plan

Fonctionnalites possibles pour petits groupes et organisations :

- espaces partages ;
- permissions ;
- domaine custom ;
- branding equipe ;
- exports ;
- politiques de retention ;
- controles privacy/compliance.

### Integrations

Integrations potentiellement payantes :

- Google Calendar ;
- Outlook ;
- Discord ;
- Slack ;
- webhooks ;
- embeds.

## Limites Gratuites Possibles

Les limites gratuites doivent reduire les couts et abus sans casser la valeur de base.

Limites acceptables :

- nombre de polls actifs par navigateur ou empreinte legere ;
- duree de conservation ;
- nombre de jours dans un date range ;
- nombre de participants au-dela d'un seuil raisonnable ;
- frequence de creation ;
- exports avances reserves au payant.

Limites a eviter :

- obligation de compte pour participer ;
- ranking payant ;
- timezone payante ;
- lecture presents/absents payante ;
- UI mobile degradee ;
- publicites intrusives.

## Principes UX Et Business

- Ne jamais ralentir le chemin `create -> share -> respond -> results` pour pousser un paiement.
- Un participant ne doit jamais etre force de payer ou creer un compte pour repondre.
- Les upsells s'adressent a la personne qui organise souvent, pas au groupe invite.
- Les fonctionnalites payantes doivent etre des gains de confort, controle, retention ou collaboration.
- Les messages de limite doivent rester courts, utiles, et proposer une action claire.

## Questions Ouvertes

- Quel seuil de participants gratuit reste genereux tout en protegeant les couts ?
- Quelle duree de retention gratuite est acceptable ?
- Faut-il permettre de revendiquer un poll cree sans compte apres creation d'un compte ?
- Stripe ou Lemon Squeezy si un paiement est ajoute plus tard ?
- La monetisation doit-elle commencer par Pro Polls ou Organizer Account ?
