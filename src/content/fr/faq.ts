import type { Faq } from "@/lib/tools/types";

export const homeFaq: Faq[] = [
  { q: "Kanifo est-il vraiment gratuit ?", a: "Oui. Tous les outils et le QR Studio sont accessibles gratuitement, sans inscription et sans limite cachée. Si une offre Pro voit le jour, elle ajoutera des fonctions avancées sans retirer celles qui existent." },
  { q: "Faut-il créer un compte ?", a: "Non. Tu peux utiliser tous les outils immédiatement. Tes favoris, ton thème et tes QR codes sauvegardés sont enregistrés localement dans ton navigateur." },
  { q: "Mes fichiers sont-ils envoyés sur vos serveurs ?", a: "Non. Les images, PDF et textes sont traités directement dans ton navigateur, sur ton appareil. Ils ne sont ni téléversés ni stockés par Kanifo." },
  { q: "Les QR codes créés ont-ils une date d'expiration ?", a: "Non. Les QR codes générés par le QR Studio sont statiques : l'information est inscrite dans l'image elle-même. Ils fonctionnent indéfiniment et sans dépendre de Kanifo." },
  { q: "Kanifo fonctionne-t-il sur mobile ?", a: "Oui. Le site s'adapte aux smartphones, tablettes et ordinateurs, et fonctionne dans tous les navigateurs récents (Chrome, Safari, Firefox, Edge)." },
  { q: "Comment retrouver rapidement un outil ?", a: "Utilise la recherche (raccourci Ctrl+K ou Cmd+K), filtre le catalogue par catégorie, ou ajoute tes outils préférés aux favoris en cliquant sur le cœur." },
];

export const generalFaq: { title: string; items: Faq[] }[] = [
  { title: "Général", items: homeFaq },
  {
    title: "Confidentialité et sécurité",
    items: [
      { q: "Quelles données Kanifo conserve-t-il ?", a: "Aucune donnée personnelle n'est collectée par les outils. Les préférences (favoris, thème, historique de recherche, tâches, QR codes sauvegardés) restent dans le stockage local de ton navigateur et ne nous sont jamais transmises." },
      { q: "Comment effacer mes données locales ?", a: "Efface les données de site de ton navigateur pour Kanifo, ou supprime les éléments un à un depuis les pages concernées (favoris, historique du QR Studio, to-do list)." },
      { q: "Les mots de passe générés sont-ils sûrs ?", a: "Ils sont créés dans ton navigateur à l'aide du générateur aléatoire cryptographique (Web Crypto) et ne transitent par aucun serveur." },
    ],
  },
  {
    title: "Fichiers et limites",
    items: [
      { q: "Quelle est la taille maximale des fichiers ?", a: "25 Mo par image et 50 Mo par PDF. Ces limites protègent la mémoire de ton navigateur, puisque tout le traitement est local." },
      { q: "Pourquoi un outil est-il lent avec un gros fichier ?", a: "Le traitement utilise la puissance de ton appareil. Un PDF de plusieurs centaines de pages ou une très grande image peut demander quelques secondes, surtout sur mobile." },
      { q: "Quels formats sont pris en charge ?", a: "Images : JPG, PNG et WebP. Documents : PDF non protégés par mot de passe. Les fichiers d'un autre type sont refusés avec un message explicite." },
    ],
  },
  {
    title: "QR Studio",
    items: [
      { q: "Mon QR code sera-t-il lisible par tous les téléphones ?", a: "Oui, tant que le contraste reste suffisant. Le studio vérifie le contraste en direct, t'avertit en cas de risque et bloque l'export lorsque le code deviendrait illisible. Teste toujours ton QR code avant impression." },
      { q: "Puis-je modifier la destination d'un QR code après impression ?", a: "Non : les QR codes générés sont statiques. Les QR codes dynamiques (destination modifiable, statistiques) nécessitent un service de redirection qui n'est pas encore proposé." },
      { q: "Puis-je utiliser les QR codes à des fins commerciales ?", a: "Oui, librement et sans attribution : affiches, emballages, cartes de visite, menus…" },
    ],
  },
];
