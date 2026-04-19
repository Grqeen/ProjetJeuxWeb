# Projet DOM : Blob Défense

Un jeu de type **Typing Tower Defense** développé entièrement en HTML, CSS et JavaScript Vanilla (manipulation directe du DOM, sans Canvas). 
Incarnez le noyau d'un système informatique et repoussez des vagues continues de virus, bots et cyber-attaques en tapant les mots qui les identifient le plus rapidement possible.

## 🎮 Gameplay

- **Taper pour survivre :** Lorsqu'un ennemi (un "blob" rouge) approche, tapez la première lettre de son mot pour le verrouiller. Continuez de taper le mot entier pour le détruire avant qu'il n'atteigne le centre de l'écran et n'endommage vos points de vie (HP).
- **Gestion des ressources :**
  - **ADN (🧬) :** Obtenu à chaque frappe correcte. Vos combos augmentent la quantité gagnée ! L'ADN sert à améliorer vos capacités de frappe (Dégâts, ralentissement du temps, exécution...).
  - **Or (💰) :** Lâché parfois par des ennemis ou obtenu via des bonus. L'Or permet d'acheter des défenses passives comme des tourelles ou des boucliers.
- **Système de Combos :** Enchaînez les frappes sans vous tromper pour faire grimper votre multiplicateur de combo. Une erreur réinitialise le multiplicateur !
- **Boss et Mots Bonus :** 
  - Des boss résistants avec de longs mots apparaîtront régulièrement.
  - Des mots spéciaux (HEAL, FREEZE, BOOST) apparaissent parfois pour vous aider.

## ⌨️ Contrôles

- **Touches (A-Z) :** Saisir les lettres pour cibler et attaquer les ennemis.
- **Échap / Retour arrière (Backspace) :** Annuler la cible actuelle pour pouvoir verrouiller un autre ennemi.
- **Barre d'espace :** Déclencher une Impulsion Électromagnétique (EMP). Provoque un flash qui inflige de lourds dégâts à tous les ennemis à l'écran. *(Coûte 50 ADN)*.

## 🛒 Boutique et Améliorations

Sur le côté gauche de l'écran, vous pouvez dépenser vos ressources pour survivre plus longtemps :

- **Compétences (ADN) :**
  - **Exécution :** Détruit automatiquement la cible dès que vous avez tapé un certain pourcentage du mot.
  - **Calibre Clavier :** Ajoute des dégâts physiques à chaque frappe correcte.
  - **Multiplicateur ADN :** Augmente vos gains bruts par touche.
  - **Ralentissement :** Réduit la vitesse globale de déplacement des ennemis.
- **Défenses (Or) :**
  - **Bouclier :** Ajoute une couche de protection régénérative à votre base.
  - **Tourelle Basique :** Tourelle d'appoint ciblant automatiquement les virus.
  - **Tourelle Sniper :** Tourelle lourde tirant à plus faible cadence mais causant plus de dégâts.
  - **Dégâts Tourelles :** Augmente l'efficacité de l'ensemble de vos défenses déployées.
