# Toolify

> Tous les outils dont tu as besoin. Au même endroit.

Toolify est une plateforme web d'outils gratuits en ligne : 53 outils répartis en six catégories (texte, images, PDF, mathématiques, développeurs, productivité) et un studio complet de création de QR codes. Tous les traitements se font dans le navigateur : aucun fichier n'est envoyé à un serveur.

## Sommaire

- [Stack](#stack)
- [Lancer le projet en local](#lancer-le-projet-en-local)
- [Variables d'environnement](#variables-denvironnement)
- [Déployer sur Vercel](#déployer-sur-vercel)
- [Architecture](#architecture)
- [Ajouter un outil](#ajouter-un-outil)
- [SEO](#seo)
- [Sécurité et confidentialité](#sécurité-et-confidentialité)
- [Limites connues](#limites-connues)
- [Évolutions prévues : comptes, QR dynamiques, monétisation](#évolutions-prévues)

## Stack

| Domaine | Choix |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack), React 19, TypeScript strict |
| Styles | Tailwind CSS 4, jetons de design en variables CSS (`src/app/globals.css`), thème clair/sombre (`next-themes`) |
| Interface | Composants maison dans l'esprit shadcn/ui (`src/components/ui`), icônes Lucide, police Geist, notifications `sonner` |
| QR codes | `qr-code-styling` (rendu), `jsqr` (test de lecture) |
| PDF | `pdf-lib` (édition), `pdfjs-dist` (rendu), `jszip` (archives) |
| Divers | `zod` (validation du formulaire de contact), `marked` + `dompurify` (Markdown assaini) |

Aucune base de données ni service tiers n'est requis pour faire fonctionner le site.

## Lancer le projet en local

Prérequis : Node.js 20.9 ou plus récent.

```bash
npm install
```

```bash
cp .env.example .env.local
```

```bash
npm run dev
```

Le site est disponible sur http://localhost:3000.

Autres commandes :

| Commande | Rôle |
| --- | --- |
| `npm run build` | Compilation de production (71 pages statiques) |
| `npm run start` | Sert la compilation de production |
| `npm run lint` | ESLint |
| `npm run typecheck` | Vérification TypeScript |

`npm install` et `npm run build` exécutent `scripts/copy-pdfjs.mjs`, qui copie le worker, les polices et les décodeurs de PDF.js dans `public/pdfjs/` (dossier ignoré par Git, régénéré automatiquement).

## Variables d'environnement

Toutes sont facultatives en développement. Voir `.env.example`.

| Variable | Côté | Rôle |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | public | URL du site sans barre finale. **À définir en production** : elle alimente les URL canoniques, le sitemap, `robots.txt` et Open Graph. |
| `NEXT_PUBLIC_CONTACT_EMAIL` | public | Adresse affichée sur `/contact` et `/legal`, et utilisée comme solution de repli du formulaire. |
| `NEXT_PUBLIC_LEGAL_PUBLISHER`, `NEXT_PUBLIC_LEGAL_ADDRESS`, `NEXT_PUBLIC_LEGAL_HOST` | public | Contenu de la page des mentions légales. |
| `RESEND_API_KEY` | serveur | Clé API [Resend](https://resend.com) pour l'envoi des messages du formulaire de contact. |
| `CONTACT_TO_EMAIL` | serveur | Destinataire des messages. |
| `CONTACT_FROM_EMAIL` | serveur | Expéditeur (domaine vérifié dans Resend). |
| `NEXT_PUBLIC_ADS_ENABLED` | public | `true` pour afficher les emplacements publicitaires réservés. |

### Formulaire de contact

La route `POST /api/contact` valide les données (zod), applique un champ piège anti-robots et une limitation de débit, puis envoie le message via Resend.

Tant que `RESEND_API_KEY` et `CONTACT_TO_EMAIL` ne sont pas définies, la route répond `503` et l'interface le dit clairement à l'utilisateur, en proposant d'écrire depuis sa messagerie si `NEXT_PUBLIC_CONTACT_EMAIL` est renseignée. Aucun envoi n'est simulé.

## Déployer sur Vercel

1. Pousse le dépôt sur GitHub, GitLab ou Bitbucket.
2. Sur [vercel.com/new](https://vercel.com/new), importe le dépôt. Vercel détecte Next.js : aucun réglage de build n'est nécessaire.
3. Dans **Settings → Environment Variables**, ajoute au minimum `NEXT_PUBLIC_SITE_URL` (ton domaine définitif), puis les variables du formulaire de contact et des mentions légales.
4. Déploie, puis rattache ton domaine dans **Settings → Domains**.
5. Vérifie `https://ton-domaine/sitemap.xml` et soumets-le dans Google Search Console.

Avant la mise en ligne : renseigne les mentions légales, relis `/privacy` et `/terms` pour les adapter à ta structure, et configure le formulaire de contact.

Le site est presque entièrement statique : il peut aussi être hébergé sur toute plateforme compatible Node.js avec `npm run build` puis `npm run start`.

## Architecture

```
src/
├─ app/                      Pages (App Router)
│  ├─ page.tsx               Accueil
│  ├─ tools/                 Catalogue et pages d'outils /tools/[slug]
│  ├─ qr-studio/             QR Studio
│  ├─ favorites, new, about, contact, faq, privacy, terms, legal
│  ├─ api/contact/route.ts   Seule route serveur
│  └─ sitemap.ts, robots.ts, opengraph-image.tsx
├─ content/fr/               Contenus éditoriaux (fiches SEO des outils, FAQ)
├─ components/
│  ├─ ui/                    Primitives (bouton, champs, alertes…)
│  ├─ layout/                En-tête, pied de page, palette de recherche
│  ├─ tools/                 Interfaces des outils, regroupées par famille
│  └─ qr/                    Interface du QR Studio
└─ lib/                      Logique sans interface
   ├─ tools/                 Registre, catégories, recherche
   ├─ qr/                    Contenus, contrôles de lisibilité, rendu, export
   ├─ calc.ts, dates.ts, codec.ts, json-tools.ts, pdf.ts, files.ts
   └─ storage.ts             Préférences locales (favoris, historique…)
```

Principes :

- **Logique séparée de l'interface.** Les calculs, encodages et validations vivent dans `src/lib` et ne dépendent pas de React.
- **Chargement à la demande.** Chaque famille d'outils est un lot JavaScript distinct, chargé uniquement sur les pages qui l'utilisent ; `pdf-lib`, PDF.js, JSZip et le moteur QR sont importés dynamiquement.
- **Pages statiques.** Le contenu éditorial de chaque outil est rendu côté serveur ; seul l'outil interactif est hydraté.
- **Internationalisation préparée.** Les contenus éditoriaux sont isolés dans `src/content/fr`. Ajouter une langue revient à créer `src/content/<langue>` et à sélectionner le contenu dans le registre. Les libellés internes aux outils sont encore écrits en français dans les composants : ils devront être extraits pour une traduction complète.

## Ajouter un outil

1. Décris sa fiche (nom, description, mots-clés, icône, textes SEO, FAQ) dans `src/content/fr/tools/<catégorie>.ts`.
2. Écris son composant dans `src/components/tools/`.
3. Associe le slug au composant dans `src/components/tools/tool-renderer.tsx`.
4. Si l'icône Lucide est nouvelle, ajoute-la dans `src/components/tool-icon.tsx`.

La page, les métadonnées, le sitemap, la recherche, le catalogue et les liens internes sont générés automatiquement.

## SEO

- Une URL propre par outil (`/tools/<slug>`), avec `title`, meta description, `h1`, introduction, mode d'emploi, section « Bon à savoir » et FAQ uniques.
- URL canoniques, Open Graph, Twitter Cards et image Open Graph générée.
- Données structurées : `WebSite` avec action de recherche, `Organization`, `WebApplication`, `FAQPage`, `BreadcrumbList`, `ItemList`.
- `sitemap.xml` et `robots.txt` générés depuis le registre.
- Maillage interne : fil d'Ariane, outils associés, liens de catégorie, pied de page.
- La page `/favorites`, propre à chaque visiteur, est exclue de l'indexation.

## Sécurité et confidentialité

- Les fichiers ne quittent pas le navigateur. Leur type est vérifié par signature binaire et non par extension, avec des limites de taille (25 Mo par image, 50 Mo par PDF) et de dimensions.
- La calculatrice utilise un analyseur d'expressions dédié : aucun `eval`, aucun code utilisateur exécuté.
- Le HTML produit par l'éditeur Markdown est assaini par DOMPurify.
- Les mots de passe, UUID et tirages au sort utilisent `crypto.getRandomValues` avec une méthode sans biais.
- En-têtes de sécurité définis dans `next.config.ts`. Aucune clé secrète n'est exposée au client.
- Aucun cookie ni traceur tiers. Les préférences sont stockées dans `localStorage` sous le préfixe `toolify:`.

## Limites connues

- **Compression PDF.** Sans traitement serveur, deux modes sont proposés : une optimisation sans perte au gain modeste, et une compression forte qui convertit les pages en images (le texte n'est alors plus sélectionnable). L'interface l'explique avant le traitement.
- **Compression PNG.** Le navigateur encode le PNG sans perte ; pour l'alléger, l'outil recommande la sortie WebP.
- **PDF protégés par mot de passe.** Ils sont refusés avec un message explicite.
- **Jours ouvrés.** Le compteur de jours ne déduit pas les jours fériés.
- **Limitation de débit du formulaire de contact.** Elle est tenue en mémoire, donc par instance serveur. Pour un trafic important, remplace-la par un stockage partagé (Upstash, Vercel KV).
- **Tests.** Le projet a été vérifié par des parcours automatisés dans un navigateur, mais ne contient pas encore de suite de tests versionnée.

## Évolutions prévues

Ces fonctionnalités ne sont **pas** implémentées. L'architecture les prépare, et rien dans l'interface ne les présente comme actives.

### Comptes utilisateurs avec Supabase

Aucun compte n'est nécessaire aujourd'hui. Pour synchroniser favoris et QR codes entre appareils :

1. Crée un projet sur [supabase.com](https://supabase.com) et installe `@supabase/supabase-js` et `@supabase/ssr`.
2. Ajoute `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`. La clé `service_role` ne doit jamais être exposée au client.
3. Crée les tables `favorites (user_id, slug)` et `saved_qr (id, user_id, payload jsonb)`, avec la sécurité au niveau des lignes activée et une politique `auth.uid() = user_id`.
4. Remplace la lecture et l'écriture de `src/lib/storage.ts` par un adaptateur qui utilise Supabase lorsque l'utilisateur est connecté, et `localStorage` sinon.
5. Ajoute le bouton de connexion dans `src/components/layout/header.tsx`.

### QR codes dynamiques

Le contrat est décrit dans `src/lib/qr/dynamic.ts` : table de liens, route de redirection `/r/[code]`, statistiques de scans. Le type `SavedQr` porte déjà un champ `kind: "static" | "dynamic"`. Le drapeau `DYNAMIC_QR_ENABLED` doit rester à `false` tant que le backend de redirection n'existe pas.

### Monétisation

- **Publicité.** Le composant `AdSlot` réserve des emplacements sur l'accueil et sous chaque outil. Il ne rend rien tant que `NEXT_PUBLIC_ADS_ENABLED` n'est pas à `true`. Avant d'y brancher une régie, ajoute un bandeau de consentement et mets à jour `/privacy`.
- **Toolify Pro.** Chaque outil porte un champ `tier: "free" | "pro"`, aujourd'hui toujours `free`. Un futur système de paiement pourra s'appuyer dessus sans modifier les outils existants.
