# Projet Jeu Canvas - Blob Escape

JUNGERS Enzo / CHARRIER Logan / AIT-ELDJOUDI Dylan

Un jeu d'arcade en 2D développé en JavaScript natif utilisant l'API HTML5 Canvas. Le joueur doit naviguer à travers différents niveaux, résoudre des puzzles simples avec des clés, éviter des obstacles et atteindre la sortie.

## 🎮 Fonctionnalités

- **Système de Niveaux** : 3 niveaux uniques avec une difficulté progressive (chargés dynamiquement via `levels.js`).
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
4. **Mécaniques** :
   - Touchez les **carrés roses (Keypads)** pour ouvrir les portes roses correspondantes.
   - Évitez les **croix rouges** qui tournent.
   - Utilisez les **bumpers oranges** pour rebondir.

## 🚀 Installation et Lancement

Ce projet utilise des **modules ES6** (`import`/`export`). Pour des raisons de sécurité (CORS), il ne peut pas être lancé directement en ouvrant le fichier `.html` dans le navigateur via le système de fichiers (`file://`).

### Pré-requis
- Un navigateur web moderne (Chrome, Firefox, Edge).
- Un serveur local.

### Méthode recommandée (VS Code)
1. Installez l'extension **Live Server** sur Visual Studio Code.
2. Faites un clic droit sur le fichier `index.html`.
3. Sélectionnez "Open with Live Server".

### Méthode alternative (Python)
Si vous avez Python installé :
1. Ouvrez un terminal dans le dossier du projet.
2. Lancez la commande : `python -m http.server`
3. Ouvrez votre navigateur à l'adresse `http://localhost:8000`.

## 📂 Structure du Projet

- **`index.html`** : Point d'entrée principal (Canvas + UI).
- **`css/style.css`** : Styles de l'interface, du menu et des animations.
- **`js/`** :
  - `Game.js` : Moteur principal (boucle de jeu, gestion des états, update/draw).
  - `levels.js` : Configuration des niveaux (placement des obstacles et ennemis).
  - `Player.js` : Logique du joueur (déplacement, dessin).
  - `collisions.js` : Bibliothèque mathématique de détection de collisions.
  - `Obstacle.js` : Classes pour les murs statiques et rotatifs.
  - `Items.js` : Classe parente pour les objets ramassables (`keypad`, `potions`, etc.).
  - `ecouteurs.js` : Gestion des événements clavier et souris.
  - `utils.js` : Fonctions utilitaires graphiques.
