# Projet GOW - 3D Survival Rogue-lite

Un jeu de survie en arène 3D (style *Vampire Survivors* / Rogue-lite) développé avec **Babylon.js** et le moteur physique **Havok**.

Affrontez des hordes de monstres, récoltez de l'expérience, montez de niveau et choisissez parmi des dizaines d'améliorations pour survivre le plus longtemps possible et vaincre les puissants Boss de la carte !

## 🌟 Fonctionnalités Principales

- **Survie et Vagues Dynamiques :** La difficulté augmente au fil du temps avec l'apparition de nouveaux types de monstres (Tanks, Traqueurs, Tireurs, Volants).
- **Système d'Améliorations (Rogue-lite) :** À chaque montée de niveau, choisissez parmi 3 cartes d'améliorations aléatoires.
  - *Compétences Actives :* Aura de feu, Scies orbitales, Missiles explosifs, Météorites, Foudre.
  - *Bonus Passifs :* Augmentation de la cadence de tir, Armure, Réflexion de dégâts, Régénération, Bouclier, Vitesse, Aimant à XP, etc.
- **5 Boss Épiques avec des mécaniques uniques :**
  - 🪨 *Le Goliath des Ruines :* Ondes de choc dévastatrices et jets de gravats.
  - 🟣 *L'Amalgame Instable :* Se divise en de multiples entités et aspire les objets au sol.
  - 🦑 *Le Kraken des Terres :* Tentacules et inondation de l'arène.
  - 🌪️ *Le Seigneur de la Nuée :* Attaques en piqué, vents violents et invocation de sbires.
  - 🌑 *Le Mimic :* Copie vos propres améliorations pour les retourner contre vous !
- **Environnement Généré Dynamiquement :** Terrain avec relief (heightmap), lacs, herbe animée par le vent, gestion du brouillard et cycle jour/nuit dynamique.
- **Menu Paramètres en Jeu :** Ajustement de la qualité graphique à la volée (Low, Medium, High), prise en charge du plein écran, modification des touches, et optimisation LOD pour les objets lointains.

## 🎮 Contrôles (Modifiables en jeu)

| Action | Touche par défaut |
|---|---|
| **Avancer** | `Z` |
| **Reculer** | `S` |
| **Aller à gauche** | `Q` |
| **Aller à droite** | `D` |
| **Tirer (Boule de feu)** | Visée avec la souris |
| **Sauter / Double Saut** | `Espace` |
| **Sprinter** | `Shift` (Maj) |
| **S'accroupir** | `C` *(pas encore fonctionnel)* |
| **Mettre en pause** | `Échap` (Esc) |

## 🛠️ Technologies Utilisées

- **HTML5 / CSS3 / JavaScript (ES6 Modules)**
- **Babylon.js :** Moteur de rendu 3D WebGL/WebGPU.
- **Babylon GUI :** Interfaces utilisateur (menus, barres de vie, affichage de l'XP).
- **Havok Physics :** Moteur physique pour les collisions, les tirs et les déplacements fluides du personnage.

## 👨‍💻 À propos du code

- `main.js` : Boucle principale de rendu, gestion de la scène, des inputs et des événements.
- `bonus.js` : Logique de montée en niveau, rendu visuel et calcul des compétences.
- `monsters.js` & `bossAI.js` : Modèles 3D, instanciation des monstres et intelligence artificielle complexe des boss.
- `terrain.js` & `utils.js` : Génération du sol, de la topographie et fonctions mathématiques utiles.
- `player.js` : Modélisation et assemblage du personnage principal (Stickman).
- Les autres fichiers (`trees.js`, `grass.js`, etc.) gèrent la décoration environnementale de la carte.