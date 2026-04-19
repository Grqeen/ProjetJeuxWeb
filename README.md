# Projet Jeux Web : The Blob Universe

Bienvenue sur notre plateforme multi-jeux développée dans le cadre de notre module de programmation web. Ce projet rassemble trois jeux distincts, chacun exploitant une technologie web différente, le tout relié par un backend commun pour la gestion des scores et de l'authentification.

## 1. Qui a fait quoi ? (Répartition des tâches)

- **Enzo JUNGERS** : 
  - Développement du jeu Canvas (ajout de tous les bonus, obstacles, création des niveaux (10 à 18), etc.)
  - Développement du jeu GOW (optimisation du jeu, équilibrage du jeu (ennemis, bonus...))
  - Création des modèles 3D pour le jeu GOW

- **Logan CHARRIER** :
  - Développement du jeu DOM
  - Développement du site regroupant les 3 jeux
  - Développement du jeu Canvas (ajouts des apparences et du skin global du jeu (background, skin, etc.))


- **Dylan AIT-ELDJOUDI** :
  - Développement du jeu Canvas (ajout d'obstacles, création des niveaux (0 à 10), gestion du jeu (déplacement du joueur, UI...), etc.)
  - Développement du jeu GOW (ajout du moteur de jeu, des différentes mécaniques de gameplay, des boss...)

*(Note : L'intégration globale et le débogage final ont été réalisés par toute l'équipe).*

## 2. Pourcentage de travail fourni

- **Enzo JUNGERS** : 33%
- **Logan CHARRIER** : 33%
- **Dylan AIT-ELDJOUDI** : 33%
- **IA** : 1%

L'investissement a été globalement équitable. Chacun a pris les devants sur un des trois projets de jeu (DOM, Canvas, GOW), mais aussi sur le site les regroupant.

## 3. Difficultés rencontrées et Résolutions

### A. Optimisation des performances 3D et Moteur Physique (Blob's Revenge)
**Difficulté** : L'utilisation de Havok Physics avec un grand nombre d'entités (vagues de 70+ monstres) faisait perdre énormément de FPS. De plus, l'instanciation continue de projectiles saturait la mémoire.
**Résolution** : 
- Nous avons mis en place un système d'**Object Pooling** pour recycler les boules de feu et les effets de particules au lieu de les détruire/recréer.
- **Culling Physique** : Les "proxys physiques" des monstres ne sont activés que s'ils sont à une certaine distance du joueur. S'ils sont loin, ils utilisent un simple déplacement cinématique (sans Havok).

### B. Moteur de Collisions Mathématique (Blob Escape)
**Difficulté** : Gérer les collisions précises dans un Canvas entre un joueur circulaire et des obstacles rectangulaires, particulièrement ceux en rotation.
**Résolution** : Nous avons dû implémenter le théorème des axes séparateurs (SAT) et développer des algorithmes trigonométriques pour projeter les coordonnées du cercle par rapport à l'angle de rotation des rectangles avant d'évaluer la collision.

### C. Gestion des entrées clavier et ciblage dynamique (Défense Cybernétique - DOM)
**Difficulté** : Dans notre "Typing Game", gérer les événements de frappe (`keydown`) avec plusieurs ennemis à l'écran posait un vrai problème de logique. Si deux ennemis commencent par la même lettre, lequel le joueur attaque-t-il ? Et comment s'assurer que la suite de la frappe ne s'applique qu'à ce seul ennemi ?
**Résolution** : Nous avons développé un système de "Verrouillage de cible" (Focus). À la première frappe, le jeu identifie tous les ennemis ayant cette lettre initiale et sélectionne le plus proche du centre (la base). Cet ennemi devient la cible "active". Les frappes suivantes sont strictement comparées au reste de son mot, et la touche *Échap* permet au joueur de réinitialiser ce verrouillage pour changer de cible.

## 4. Justification des choix

### Pourquoi le thème de "Blob" ?
Le choix du personnage du "Blob" (que ce soit en tant qu'ennemi ou héros) permet d'avoir **un fil rouge visuel et narratif**, la contrainte d'avoir un lien entre les 3 jeux est donc respectée de par ce lien narratif. C'est également une forme simple à animer et à gérer techniquement (hitbox sphérique), ce qui nous a permis de nous concentrer sur le code et les mécaniques de gameplay plutôt que sur la modélisation ou le dessin d'assets complexes.

### Pourquoi Blob Escape ?
L'idée initiale de Blob Escape nous a été donnée par M. Buffa lors de notre 1er cours. En manque d'idées, celle-ci nous a paru inspirante.

### Pourquoi Blob's Revenge?
L'idée nous est venue grâce à la sortie triomphante de MegaBonk, un jeu survivor. C'est en partant de cette inspiration que nous avons choisi de faire un survivor.

### Pourquoi Blob Defense?
L'idée initiale était de faire un jeu flash comme dans notre enfance. Nous avons donc hésité puis nous avons choisi de faire un mix de plusieurs jeux : tycoon, tower defense, clicker et Typing Game.
