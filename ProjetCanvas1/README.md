Blob Escape - Projet Jeu Web (Canvas API)

Blob Escape est un jeu d'arcade et de réflexion en 2D développé en JavaScript natif (ES6+). Ce projet a été réalisé dans le cadre d'un module universitaire pour démontrer la maîtrise de l'API HTML5 Canvas, de la programmation orientée objet (POO) et de la gestion de moteurs de jeu (physique, collisions, cycle de vie).

👥 Équipe de développement
- Enzo JUNGERS
- Logan CHARRIER
- Dylan AIT-ELDJOUDI

🚀 Technologies utilisées
- Langage : JavaScript avec modules.
- Moteur de rendu : HTML5 Canvas API.
- Style : CSS3 pour l'interface de menu et l'overlay de jeu.
- Assets : Graphismes pixel-art et effets sonores personnalisés.

🎮 Fonctionnalités principales
1. Système de Jeu
- Gestion des niveaux : Système de chargement dynamique de niveaux à partir de fichiers de configuration (JSON/Objects).
- Timer & UI : Affichage en temps réel du temps écoulé, du niveau actuel et d'un clavier virtuel réactif aux entrées du joueur.
- Compte à rebours : Overlay animé "3-2-1-GO" avant chaque début de niveau.

2. Mécaniques et Physique
Moteur de Collisions avancé :
- Pour les collisions simples avec les murs et obstacles fixes.
- Gérer les collisions précises avec les obstacles en rotation (RotatingObstacle).
- Collisions Cercle-Rectangle : Pour les obstacles circulaires et le portail de fin.
- Physique de rebond : Gestion du recul lors des impacts avec des Bumpers.
- Effets de vent : Système de ventilateurs appliquant une force directionnelle continue sur le joueur selon sa distance.

3. Objets Interactifs
- Keypads & Fading Doors : Système de clés colorées permettant d'ouvrir (rendre invisible) des portes temporairement pour progresser.
- Potions de Vitesse : Augmente la vélocité du joueur pendant une durée limitée.
- Potions de Taille : Modifie la taille du Blob pour lui permettre d'emprunter des passages étroits.
- Téléporteurs : Points de passage instantanés entre deux coordonnées du canvas.

📈 Perspectives d'évolution :
- Système de High-Score persistant via LocalStorage.
- Niveaux supplémentaires avec de nouveaux biomes.

Ce projet a été réalisé dans un but pédagogique pour illustrer les principes de programmation de jeux vidéo web.
