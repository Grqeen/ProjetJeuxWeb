import { createNoise2D } from 'https://esm.sh/simplex-noise';

export const mapSize = 1000;
export const limitRadius = 400;
export const waterLevel = -2.5;

const noise2D = createNoise2D(Math.random);

const mountainSlope = 0.6 + Math.random() * 1.4;
const mountainScale = 5 + Math.random() * 25;
const mountainFreq = 0.01 + Math.random() * 0.06;

// Génère l'élévation procédurale d'un point pour accorder le terrain et le positionnement du monde.
export function getHeight(x, z) {
    const distanceFromCenter = Math.sqrt(x * x + z * z);
    
    if (distanceFromCenter < 2.0) {
        return -6.0;
    }
    
    if (distanceFromCenter < 8.0) {
        return 0.5; 
    }

    if (distanceFromCenter > limitRadius) {
        const dist = distanceFromCenter - limitRadius;
        
        let h = dist * mountainSlope; 
        
        h += noise2D(x * mountainFreq, z * mountainFreq) * mountainScale;
        h += noise2D(x * 0.1, z * 0.1) * 3;
        
        return Math.max(0, h);
    }
    
    let arenaHeight = noise2D(x * 0.015, z * 0.015) * 4; 
    
    if (arenaHeight < waterLevel) {
        arenaHeight -= Math.abs(arenaHeight - waterLevel) * 0.2;
        arenaHeight += noise2D(x * 0.1, z * 0.1) * 0.5;
    }

    return arenaHeight;
}