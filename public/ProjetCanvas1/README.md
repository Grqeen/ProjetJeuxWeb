# Projet Jeu Canvas - Blob Escape

JUNGERS Enzo / CHARRIER Logan / AIT-ELDJOUDI Dylan

Un jeu d'arcade en 2D développé en JavaScript natif utilisant l'API HTML5 Canvas. Le joueur doit naviguer à travers différents niveaux, résoudre des puzzles simples avec des clés, éviter des obstacles et atteindre la sortie.

## 🎮 Fonctionnalités

- **Système de Niveaux** : 3 niveaux uniques avec une difficulté progressive.
- **Physique & Collisions** :
  - Collisions Rectangle-Rectangle (AABB) pour les murs.
  - Collisions avancées (SAT - Separating Axis Theorem) pour les obstacles rotatifs.
  - Rebond physique sur les "Bumpers" (triangles oranges).
- **Objets Interactifs** :
  - **Clés (Keypads)** : Activent des mécanismes pour ouvrir les portes colorées.
  - **Portes Fantômes (Fading Doors)** : Obstacles qui deviennent invisibles temporairement.
  - **Potions de Vitesse** : Donnent un boost de vitesse temporaire.
  - **Potions de Taille** : Modifient la taille du joueur pour passer dans des endroits étroits.
- **Contrôles** : Support du clavier (Flèches directionnelles) et interface tactile virtuelle.

## 🕹️ Comment Jouer

1. **Lancer le jeu** : Cliquez sur "Start Game" ou choisissez un niveau dans le menu.
2. **Déplacement** : Utilisez les flèches du clavier (`Haut`, `Bas`, `Gauche`, `Droite`).
3. **Objectif** : Atteignez le portail de fin (cercle ou carré coloré) pour passer au niveau suivant.
