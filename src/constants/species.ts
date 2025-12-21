export interface BirdSpecies {
    id: string;
    name: string;
    scientificName: string;
    color: string;
    minCentroid: number; // Spectral Centroid range
    maxCentroid: number;
    minSpread: number; // Spectral Spread
    maxSpread: number;
}

export const BIRD_SPECIES: BirdSpecies[] = [
    {
        id: 'robin',
        name: 'European Robin',
        scientificName: 'Erithacus rubecula',
        color: '#ff5e3a', // Reddish orange
        minCentroid: 45,
        maxCentroid: 65,
        minSpread: 15,
        maxSpread: 35
    },
    {
        id: 'nightingale',
        name: 'Common Nightingale',
        scientificName: 'Luscinia megarhynchos',
        color: '#ffd700', // Gold/Flute-like
        minCentroid: 30,
        maxCentroid: 50,
        minSpread: 10,
        maxSpread: 25
    },
    {
        id: 'blue-tit',
        name: 'Eurasian Blue Tit',
        scientificName: 'Cyanistes caeruleus',
        color: '#4cc9f0', // Bright Blue
        minCentroid: 60,
        maxCentroid: 90,
        minSpread: 5,
        maxSpread: 20
    },
    {
        id: 'blackbird',
        name: 'Common Blackbird',
        scientificName: 'Turdus merula',
        color: '#f72585', // Magenta/Deep
        minCentroid: 20,
        maxCentroid: 40,
        minSpread: 20,
        maxSpread: 45
    },
    {
        id: 'kingfisher',
        name: 'Common Kingfisher',
        scientificName: 'Alcedo atthis',
        color: '#4895ef', // Electric Blue
        minCentroid: 50,
        maxCentroid: 80,
        minSpread: 30,
        maxSpread: 60
    }
];
