export interface BirdSpecies {
    id: string;
    name: string;
    scientificName: string;
    color: string;
    minCentroid: number; // Spectral Centroid range (normalized 0-100)
    maxCentroid: number;
    minSpread: number; // Spectral Spread (normalized 0-100)
    maxSpread: number;
}

export const BIRD_SPECIES: BirdSpecies[] = [
    {
        id: 'robin',
        name: 'European Robin',
        scientificName: 'Erithacus rubecula',
        color: '#ff5e3a',
        minCentroid: 45,
        maxCentroid: 65,
        minSpread: 15,
        maxSpread: 35
    },
    {
        id: 'nightingale',
        name: 'Common Nightingale',
        scientificName: 'Luscinia megarhynchos',
        color: '#ffd700',
        minCentroid: 30,
        maxCentroid: 50,
        minSpread: 10,
        maxSpread: 25
    },
    {
        id: 'blue-tit',
        name: 'Eurasian Blue Tit',
        scientificName: 'Cyanistes caeruleus',
        color: '#4cc9f0',
        minCentroid: 70,
        maxCentroid: 95,
        minSpread: 5,
        maxSpread: 15
    },
    {
        id: 'great-tit',
        name: 'Great Tit',
        scientificName: 'Parus major',
        color: '#fee440',
        minCentroid: 60,
        maxCentroid: 85,
        minSpread: 8,
        maxSpread: 20
    },
    {
        id: 'blackbird',
        name: 'Common Blackbird',
        scientificName: 'Turdus merula',
        color: '#f72585',
        minCentroid: 20,
        maxCentroid: 40,
        minSpread: 20,
        maxSpread: 45
    },
    {
        id: 'kingfisher',
        name: 'Common Kingfisher',
        scientificName: 'Alcedo atthis',
        color: '#4895ef',
        minCentroid: 50,
        maxCentroid: 80,
        minSpread: 30,
        maxSpread: 60
    },
    {
        id: 'goldfinch',
        name: 'European Goldfinch',
        scientificName: 'Carduelis carduelis',
        color: '#ff002b',
        minCentroid: 55,
        maxCentroid: 75,
        minSpread: 12,
        maxSpread: 30
    },
    {
        id: 'chaffinch',
        name: 'Common Chaffinch',
        scientificName: 'Fringilla coelebs',
        color: '#f3722c',
        minCentroid: 40,
        maxCentroid: 60,
        minSpread: 25,
        maxSpread: 50
    },
    {
        id: 'skylark',
        name: 'Eurasian Skylark',
        scientificName: 'Alauda arvensis',
        color: '#a2d2ff',
        minCentroid: 45,
        maxCentroid: 70,
        minSpread: 40,
        maxSpread: 70
    },
    {
        id: 'wood-warbler',
        name: 'Wood Warbler',
        scientificName: 'Phylloscopus sibilatrix',
        color: '#9ef01a',
        minCentroid: 65,
        maxCentroid: 90,
        minSpread: 20,
        maxSpread: 40
    },
    {
        id: 'barn-owl',
        name: 'Barn Owl',
        scientificName: 'Tyto alba',
        color: '#ffffff',
        minCentroid: 10,
        maxCentroid: 25,
        minSpread: 40,
        maxSpread: 80
    },
    {
        id: 'wren',
        name: 'Eurasian Wren',
        scientificName: 'Troglodytes troglodytes',
        color: '#fb8500',
        minCentroid: 50,
        maxCentroid: 80,
        minSpread: 10,
        maxSpread: 30
    },
    {
        id: 'song-thrush',
        name: 'Song Thrush',
        scientificName: 'Turdus philomelos',
        color: '#ffc8dd',
        minCentroid: 25,
        maxCentroid: 55,
        minSpread: 15,
        maxSpread: 40
    },
    {
        id: 'peregrine',
        name: 'Peregrine Falcon',
        scientificName: 'Falco peregrinus',
        color: '#ced4da',
        minCentroid: 30,
        maxCentroid: 60,
        minSpread: 50,
        maxSpread: 90
    },
    {
        id: 'blackcap',
        name: 'Eurasian Blackcap',
        scientificName: 'Sylvia atricapilla',
        color: '#7209b7',
        minCentroid: 35,
        maxCentroid: 65,
        minSpread: 20,
        maxSpread: 45
    },
    {
        id: 'woodpecker',
        name: 'Great Spotted Woodpecker',
        scientificName: 'Dendrocopos major',
        color: '#d00000',
        minCentroid: 15,
        maxCentroid: 35,
        minSpread: 60,
        maxSpread: 95
    },
    {
        id: 'willow-warbler',
        name: 'Willow Warbler',
        scientificName: 'Phylloscopus trochilus',
        color: '#d9ed92',
        minCentroid: 50,
        maxCentroid: 70,
        minSpread: 10,
        maxSpread: 25
    },
    {
        id: 'cuckoo',
        name: 'Common Cuckoo',
        scientificName: 'Cuculus canorus',
        color: '#4a4e69',
        minCentroid: 10,
        maxCentroid: 30,
        minSpread: 5,
        maxSpread: 15
    },
    {
        id: 'swallow',
        name: 'Barn Swallow',
        scientificName: 'Hirundo rustica',
        color: '#003566',
        minCentroid: 40,
        maxCentroid: 75,
        minSpread: 30,
        maxSpread: 60
    }
];
