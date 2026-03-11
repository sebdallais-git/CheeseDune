// Game/public/dune/js/factions.js

export const FactionId = {
  SWISS: 'swiss',
  FRENCH: 'french',
  GERMAN: 'german',
};

export const Factions = {
  [FactionId.SWISS]: {
    name: 'Swiss',
    colors: {
      primary: '#cc0000',   // Red
      secondary: '#ffffff', // White
      accent: '#ff3333',
    },
    unitNames: {
      harvester: 'Alpkäser',
      lightInfantry: 'Milizionär',
      heavyInfantry: 'Gardist',
      rocketInfantry: 'Raketenträger',
      lightVehicle: 'Bergbuggy',
      mediumVehicle: 'Quad Alpin',
      tank: 'Panzer',
      siegeTank: 'Belagerungswerk',
      rocketLauncher: 'Raketenwerfer',
      mcv: 'Bau-Konvoi',
      superUnit: 'Käsekanone',
    },
    buildingNames: {
      constructionYard: 'Bauamt', powerPlant: 'Wasserkraft', refinery: 'Käserei',
      silo: 'Käsekeller', barracks: 'Kaserne', lightFactory: 'Werkstatt',
      heavyFactory: 'Schwerfabrik', radar: 'Radarturm', turret: 'Wachturm',
      rocketTurret: 'Raketenwacht', repairPad: 'Reparaturplatz', starport: 'Heliport',
      palace: 'Bundeshaus',
    },
  },
  [FactionId.FRENCH]: {
    name: 'French',
    colors: {
      primary: '#0055a4',   // Blue
      secondary: '#ffffff', // White
      accent: '#ef4135',    // Red
    },
    unitNames: {
      harvester: 'Fromager',
      lightInfantry: 'Conscrit',
      heavyInfantry: 'Légionnaire',
      rocketInfantry: 'Roquetteur',
      lightVehicle: 'Patrouilleur',
      mediumVehicle: 'Quad Rapide',
      tank: 'Char',
      siegeTank: 'Canon de Siège',
      rocketLauncher: 'Lance-Missiles',
      mcv: 'Convoi Mobile',
      superUnit: 'Catapulte à Vin',
    },
    buildingNames: {
      constructionYard: 'Mairie', powerPlant: 'Centrale', refinery: 'Fromagerie',
      silo: 'Cave à Fromage', barracks: 'Caserne', lightFactory: 'Atelier',
      heavyFactory: 'Usine Lourde', radar: 'Tour Radar', turret: 'Tourelle',
      rocketTurret: 'Lance-Roquettes', repairPad: 'Aire de Réparation', starport: 'Aéroport',
      palace: 'Palais',
    },
  },
  [FactionId.GERMAN]: {
    name: 'German',
    colors: {
      primary: '#000000',   // Black
      secondary: '#dd0000', // Red
      accent: '#ffcc00',    // Gold
    },
    unitNames: {
      harvester: 'Senner',
      lightInfantry: 'Rekrut',
      heavyInfantry: 'Grenadier',
      rocketInfantry: 'Panzerfaust',
      lightVehicle: 'Kurier',
      mediumVehicle: 'Vierer',
      tank: 'Kampfpanzer',
      siegeTank: 'Belagerung',
      rocketLauncher: 'Raketengeschütz',
      mcv: 'Baufahrzeug',
      superUnit: 'Bratwurstblitz',
    },
    buildingNames: {
      constructionYard: 'Rathaus', powerPlant: 'Kraftwerk', refinery: 'Käsefabrik',
      silo: 'Käselager', barracks: 'Ausbildungslager', lightFactory: 'Leichtwerk',
      heavyFactory: 'Panzerwerk', radar: 'Funkturm', turret: 'Geschützturm',
      rocketTurret: 'Raketenturm', repairPad: 'Reparaturhof', starport: 'Flughafen',
      palace: 'Kanzleramt',
    },
  },
};

export function getFaction(factionId) {
  return Factions[factionId];
}
