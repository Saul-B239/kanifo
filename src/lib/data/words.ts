/** Lexiques intégrés (aucun appel réseau). Les doublons éventuels sont éliminés à l'exécution. */
const split = (s: string) => [...new Set(s.trim().split(/\s+/))];

/** Noms communs courts et sans accents : sert aussi de lexique pour les phrases de passe. */
export const NOUNS = split(`
chat chien cheval vache mouton lapin souris tigre lion ours loup renard singe girafe zebre panda koala
castor otarie phoque baleine dauphin requin poisson crabe homard pieuvre tortue lezard serpent grenouille
oiseau aigle faucon hibou corbeau moineau pigeon canard cygne poule coq dinde perroquet pingouin mouette
abeille fourmi papillon araignee mouche scarabee libellule cigale grillon escargot limace ver
arbre chene sapin bouleau erable palmier olivier saule cedre pin hetre platane tilleul noyer
fleur rose tulipe lilas jasmin lavande orchidee violette iris muguet pivoine dahlia lotus cactus
herbe mousse feuille racine branche tronc graine bourgeon fruit legume
pomme poire prune cerise fraise banane orange citron melon raisin figue datte mangue kiwi abricot peche
carotte tomate radis navet poireau oignon ail salade chou courge haricot pois lentille riz mais
pain beurre fromage lait yaourt creme oeuf farine sucre sel poivre miel confiture chocolat biscuit gateau tarte
soupe pizza crepe gaufre brioche croissant baguette sandwich omelette
eau jus the cafe tisane sirop soda glace
maison porte mur toit sol plafond fenetre escalier cave grenier jardin garage balcon terrasse cour
table chaise lit canape armoire tiroir bureau lampe tapis rideau miroir coussin oreiller drap
cuisine four frigo evier poele casserole assiette verre tasse bol fourchette couteau cuillere plateau
salle bain douche savon serviette brosse peigne
ville rue avenue place pont tunnel quai gare port tour marche parc fontaine statue musee ecole mairie
magasin banque hotel cinema theatre stade piscine ferme village route chemin sentier carrefour
montagne colline vallee plaine foret prairie desert plage dune falaise grotte ile lac riviere fleuve
ruisseau cascade source mer ocean vague maree rivage volcan glacier canyon marais
ciel soleil lune etoile planete comete nuage pluie neige grele vent orage tonnerre eclair brume
brouillard rosee givre tempete arc aurore aube matin midi soir nuit minuit
hiver printemps automne saison semaine mois annee siecle heure minute seconde instant
voiture camion bus train metro tram avion fusee bateau navire voilier barque canoe velo moto
trottinette roue moteur volant frein phare valise sac billet carte boussole
livre page cahier carnet stylo crayon gomme regle feutre pinceau toile dessin photo image tableau
journal lettre enveloppe timbre colis affiche poster
musique chanson note rythme guitare piano violon flute tambour trompette harpe orgue
film scene acteur danse ballet cirque clown magie jeu jouet puzzle domino cube ballon corde
sport course saut nage ski surf tennis golf rugby judo boxe yoga
main doigt pouce bras coude epaule jambe genou pied tete visage front joue nez bouche dent langue
oreille oeil cou dos ventre coeur
robe jupe pull veste manteau chemise pantalon short gilet echarpe gant bonnet chapeau casquette
botte chaussure sandale ceinture cravate bague collier montre lunettes parapluie
ami voisin famille parent enfant bebe frere cousin oncle tante
docteur pilote marin facteur boulanger fermier peintre poete chef juge guide
roi reine prince chevalier pirate geant fee dragon licorne sorcier tresor chateau couronne epee bouclier
or argent bronze fer acier cuivre verre bois pierre sable argile marbre cristal diamant perle rubis
feu flamme braise cendre fumee lumiere ombre reflet couleur
rouge bleu vert jaune violet indigo beige ivoire azur turquoise
idee pensee reve souvenir secret mystere histoire legende conte fable
projet plan liste code cle serrure outil marteau clou vis pince scie pelle rateau seau echelle
robot ecran clavier cable pile antenne radio signal reseau
panier boite caisse coffre bocal flacon bouteille bidon tube ruban ficelle noeud bouton
cloche sifflet horloge pendule sablier calendrier
`);

/** Noms supplémentaires avec accents, pour le générateur de mots. */
export const EXTRA_NOUNS = split(`
été forêt château étoile océan île fenêtre théâtre musée école bibliothèque pâtisserie boulangerie
éléphant zèbre araignée abeille hérisson écureuil chèvre chouette libellule
mélodie poème rêve idée légende mystère lumière fumée rosée tempête
câble téléphone télévision écran énergie électricité fusée planète comète
`);

export const VERBS = split(`
aimer chanter danser manger boire dormir courir marcher sauter nager voler grimper tomber
lire écrire dessiner peindre compter calculer mesurer peser couper coller plier ranger
parler écouter regarder observer chercher trouver cacher montrer donner recevoir prendre
ouvrir fermer pousser tirer lancer attraper porter poser lever baisser tourner
jouer gagner perdre partager aider apprendre comprendre oublier imaginer rêver penser
construire réparer casser nettoyer laver cuisiner goûter sentir toucher
voyager partir arriver rentrer visiter explorer découvrir traverser suivre guider
rire sourire pleurer crier murmurer siffler applaudir saluer
planter arroser cueillir récolter semer creuser
acheter vendre payer offrir choisir essayer commencer finir attendre
briller scintiller souffler tomber fondre geler brûler
`);

export const ADJECTIVES = split(`
grand petit gros mince long court large étroit haut bas épais fin
rapide lent fort faible lourd léger dur mou doux rugueux lisse
chaud froid tiède glacé brûlant humide sec frais
clair sombre brillant terne lumineux transparent coloré pâle vif
rouge bleu vert jaune orange violet rose noir blanc gris doré argenté
joyeux triste calme nerveux fier timide curieux drôle sérieux gentil
courageux prudent patient sage malin habile maladroit distrait
jeune vieux neuf ancien moderne antique récent
simple complexe facile difficile étrange normal rare commun unique
propre sale plein vide ouvert fermé rond carré pointu plat
silencieux bruyant sucré salé amer acide épicé délicieux
magique mystérieux sauvage tranquille fragile solide précieux immense minuscule
`);

export const FIRST_NAMES_F = split(`
Emma Jade Louise Alice Chloé Lina Léa Rose Anna Mila Inès Ambre Julia Lou Juliette Zoé Léna Agathe
Jeanne Camille Manon Sarah Lucie Eva Nina Romane Charlotte Margaux Clara Marie Pauline Mathilde
Élise Laura Julie Sophie Claire Hélène Nathalie Isabelle Valérie Céline Aurélie Émilie Caroline
Margot Victoire Adèle Capucine Anaïs Noémie Océane Clémence Élodie Justine Morgane Yasmine Salomé Apolline
`);

export const FIRST_NAMES_M = split(`
Gabriel Léo Raphaël Arthur Louis Lucas Adam Jules Hugo Maël Liam Noah Paul Ethan Nathan Gabin Sacha
Mohamed Aaron Tom Théo Victor Martin Mathis Timéo Enzo Axel Antoine Valentin Maxime Baptiste
Clément Alexandre Thomas Nicolas Julien Pierre Jean Michel Philippe Laurent Olivier Sébastien
Benjamin Quentin Romain Florian Adrien Simon Samuel Oscar Basile Augustin Marius Côme Malo Eliott Yanis
`);

export const LAST_NAMES = split(`
Martin Bernard Thomas Petit Robert Richard Durand Dubois Moreau Laurent Simon Michel Lefebvre Leroy
Roux David Bertrand Morel Fournier Girard Bonnet Dupont Lambert Fontaine Rousseau Vincent Muller
Lefèvre Faure André Mercier Blanc Guérin Boyer Garnier Chevalier François Legrand Gauthier Garcia
Perrin Robin Clément Morin Nicolas Henry Roussel Mathieu Gautier Masson Marchand Duval Denis Dumont
Marie Lemaire Noël Meyer Dufour Meunier Brun Blanchard Giraud Joly Rivière Lucas Brunet Gaillard
Barbier Arnaud Martinez Gérard Roche Renard Schmitt Roy Leroux Colin Vidal Caron Picard Roger Fabre
`);

export const LOREM = split(`
lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et
dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea
commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum fugiat nulla pariatur
excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum
at vero eos accusamus iusto odio dignissimos ducimus blanditiis praesentium voluptatum deleniti atque
corrupti quos dolores quas molestias excepturi similique mollitia animi harum quidem rerum facilis
expedita distinctio nam libero tempore cum soluta nobis eligendi optio cumque nihil impedit quo minus
`);
