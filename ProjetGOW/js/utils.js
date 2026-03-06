import { createNoise2D } from 'https://esm.sh/simplex-noise';

export const mapSize = 1000; // Carte doublée (1000x1000)
export const limitRadius = 400; // Rayon de la zone jouable (arène)
export const waterLevel = -1.5; // Niveau de l'eau

// On peut créer une "seed" (graine) fixe ou aléatoire
// Math.random() changera la map à chaque actualisation
const noise2D = createNoise2D(Math.random);

// Paramètres aléatoires pour les montagnes (générés à chaque rechargement)
const mountainSlope = 0.6 + Math.random() * 1.4; // Pente variable (entre 0.6 et 2.0)
const mountainScale = 5 + Math.random() * 25;    // Hauteur des reliefs (bosses plus ou moins grosses)
const mountainFreq = 0.01 + Math.random() * 0.06; // Fréquence (bosses plus ou moins larges)

export function getHeight(x, z) {
    // Calcul de la distance par rapport au centre (0,0)
    const distanceFromCenter = Math.sqrt(x * x + z * z);
    
    // Trou pour les égouts au centre (rayon de 2 unités)
    if (distanceFromCenter < 2.0) {
        return -6.0; // On enfonce le sol bien en dessous
    }

    // Si on dépasse la limite, on génère des montagnes
    if (distanceFromCenter > limitRadius) {
        const dist = distanceFromCenter - limitRadius;
        
        // Pente de base (moins haute qu'avant, mais texturée)
        let h = dist * mountainSlope; 
        
        // Ajout de texture rocheuse avec le bruit
        h += noise2D(x * mountainFreq, z * mountainFreq) * mountainScale; // Gros rochers aléatoires
        h += noise2D(x * 0.1, z * 0.1) * 3;   // Détails
        
        return Math.max(0, h);
    }
    
    // Dans l'arène, on ajoute du relief pour créer des cours d'eau
    // On utilise un bruit basse fréquence pour faire des rivières larges
    let arenaHeight = noise2D(x * 0.015, z * 0.015) * 4; 
    
    // Gestion de la profondeur des lacs (si on est sous l'eau)
    if (arenaHeight < waterLevel) {
        // On accentue la profondeur : plus c'est bas, plus on creuse
        // On ajoute un bruit haute fréquence pour faire un fond marin accidenté
        arenaHeight -= Math.abs(arenaHeight - waterLevel) * 0.2; // Encore moins profond
        arenaHeight += noise2D(x * 0.1, z * 0.1) * 0.5; // Petites bosses au fond
    }

    // On s'assure que la zone de l'égout (centre) reste accessible (pas sous l'eau)
    if (distanceFromCenter < 10) return Math.max(0.5, arenaHeight);

    return arenaHeight;
}